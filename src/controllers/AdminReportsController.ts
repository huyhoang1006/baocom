import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { RegistrationService } from '@/services/RegistrationService'
import ExcelJS from 'exceljs'

// BUG-013: Standardize reports query params with friendly errors.
function parseDateRange(searchParams: URLSearchParams):
  | { ok: true; startDate: string; endDate: string }
  | { ok: false; error: string } {

  // Primary names
  let startDate = searchParams.get('startDate')
  let endDate = searchParams.get('endDate')

  // Aliases for backward compatibility (BUG-013 fix)
  if (!startDate) startDate = searchParams.get('from')
  if (!endDate) endDate = searchParams.get('to')

  if (!startDate || !endDate) {
    return {
      ok: false,
      error: 'Missing required query params: startDate, endDate (or aliases: from, to). Use YYYY-MM-DD format.'
    }
  }

  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
  if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
    return { ok: false, error: 'Invalid date format. Expected YYYY-MM-DD.' }
  }
  if (startDate > endDate) {
    return { ok: false, error: 'startDate must be before or equal to endDate' }
  }
  return { ok: true, startDate, endDate }
}

export class AdminReportsController {
  private registrationService: RegistrationService

  constructor() {
    this.registrationService = new RegistrationService()
  }

  async getReport(req: NextRequest) {
    const range = parseDateRange(req.nextUrl.searchParams)
    if (!range.ok) {
      return NextResponse.json({ error: range.error }, { status: 400 })
    }
    const { startDate, endDate } = range

    // Carry-forward: tổng hợp theo nhân viên, sắp theo phòng ban.
    // Cùng nguồn với export → preview trên màn hình == file tải về.
    const { rows, totals, workdays, holidays } = await this.registrationService.getReportByDateRange(startDate, endDate)

    return NextResponse.json({
      rows,
      totals,
      workdays,
      holidays,
      stats: { totalEmployees: rows.length, ...totals },
    })
  }

  async exportCsv(req: NextRequest) {
    const range = parseDateRange(req.nextUrl.searchParams)
    if (!range.ok) {
      return NextResponse.json({ error: range.error }, { status: 400 })
    }
    const { startDate, endDate } = range

    // Carry-forward: cùng nguồn với preview/Excel
    const { rows, totals, workdays, holidays } = await this.registrationService.getReportByDateRange(startDate, endDate)

    const now = new Date()
    const generatedAt = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

    const csvRows = [
      `BAOCOM Lunch Report`,
      `Date Range,${startDate} - ${endDate}`,
      `Generated,${generatedAt}`,
      `Timezone,Asia/Ho_Chi_Minh`,
      `So ngay lam viec,${workdays}`,
      `Tong nhan vien,${rows.length}`,
      `Tong suat an,${totals.eating}`,
      `Tong suat cat com,${totals.notEating}`,
      ``,
      `Ngay le (khong tinh com),${holidays.length}`,
      ...holidays.map((h) => `${h.dateKey},${h.description || 'Ngay le'} - khong an`),
      ``,
      `STT,Ho ten,Phong ban,Tong bao com,Bao cat com`,
      ...rows.map((r) => `${r.stt},${r.name},${r.department},${r.eating},${r.notEating}`),
    ]

    const csv = csvRows.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="BAOCOM_Report_${startDate}_${endDate}.csv"`,
      }
    })
  }

  async exportXlsx(req: NextRequest) {
    const range = parseDateRange(req.nextUrl.searchParams)
    if (!range.ok) {
      return NextResponse.json({ error: range.error }, { status: 400 })
    }
    const { startDate, endDate } = range

    // Carry-forward: cùng nguồn với preview/CSV, đã sắp theo phòng ban
    const { rows, holidays } = await this.registrationService.getReportByDateRange(startDate, endDate)

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'BAOCOM'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Báo Cáo')

    // Title row
    sheet.getCell('A1').value = 'BAOCOM LUNCH REPORT'
    sheet.getCell('A1').font = { bold: true, size: 16 }
    sheet.mergeCells('A1:E1')

    // Date range row
    sheet.getCell('A2').value = `Date Range: ${startDate} - ${endDate}`
    sheet.getCell('A2').font = { size: 11 }
    sheet.mergeCells('A2:E2')

    // Generated row
    const generatedAt = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    sheet.getCell('A3').value = `Generated: ${generatedAt}`
    sheet.getCell('A3').font = { size: 11 }
    sheet.mergeCells('A3:E3')

    // Header row (row 4)
    const headers = ['STT', 'Họ tên', 'Phòng ban', 'Tổng báo cơm', 'Báo cắt cơm']
    headers.forEach((header, idx) => {
      const cell = sheet.getCell(4, idx + 1)
      cell.value = header
      cell.font = { bold: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Data rows (đã sắp theo phòng ban rồi tên) — chèn dòng tiêu đề mỗi khi đổi phòng ban
    let rowNum = 5
    let totalEating = 0
    let totalNotEating = 0
    let prevDept: string | null = null

    rows.forEach(r => {
      if (r.department !== prevDept) {
        prevDept = r.department
        const header = sheet.getRow(rowNum)
        header.getCell(1).value = r.department || 'Chưa có phòng ban'
        header.getCell(1).font = { bold: true }
        header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBFF' } }
        sheet.mergeCells(rowNum, 1, rowNum, 5)
        rowNum++
      }
      const row = sheet.getRow(rowNum)
      row.getCell(1).value = r.stt
      row.getCell(2).value = r.name
      row.getCell(3).value = r.department
      row.getCell(4).value = r.eating
      row.getCell(5).value = r.notEating
      totalEating += r.eating
      totalNotEating += r.notEating
      rowNum++
    })

    // Summary row
    const summaryRow = sheet.getRow(rowNum)
    summaryRow.getCell(1).value = ''
    summaryRow.getCell(2).value = 'Tổng cộng'
    summaryRow.getCell(2).font = { bold: true }
    summaryRow.getCell(3).value = ''
    summaryRow.getCell(4).value = totalEating
    summaryRow.getCell(4).font = { bold: true }
    summaryRow.getCell(5).value = totalNotEating
    summaryRow.getCell(5).font = { bold: true }
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF99' }
    }

    // Ngày lễ trong kỳ (không tính cơm)
    if (holidays.length > 0) {
      rowNum += 2
      const hHeader = sheet.getRow(rowNum)
      hHeader.getCell(1).value = 'Ngày lễ trong kỳ (không tính cơm)'
      hHeader.getCell(1).font = { bold: true }
      sheet.mergeCells(rowNum, 1, rowNum, 5)
      rowNum++
      holidays.forEach((h) => {
        const hr = sheet.getRow(rowNum)
        hr.getCell(1).value = h.dateKey
        hr.getCell(2).value = `${h.description || 'Ngày lễ'} — không ăn`
        sheet.mergeCells(rowNum, 2, rowNum, 5)
        rowNum++
      })
    }

    // Auto-fit columns
    sheet.columns.forEach((column) => {
      column.width = 20
    })

    // Freeze top rows
    sheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 4 }
    ]

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="BAOCOM_Report_${startDate}_${endDate}.xlsx"`,
      }
    })
  }
}