import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { RegistrationService } from '@/services/RegistrationService'
import { UserService } from '@/services/UserService'
import { toDateKey } from '@/lib/registrationWindow'
import ExcelJS from 'exceljs'

export class AdminReportsController {
  private registrationService: RegistrationService
  private userService: UserService

  constructor() {
    this.registrationService = new RegistrationService()
    this.userService = new UserService()
  }

  async getReport(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeSundays = searchParams.get('includeSundays') === 'true'

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
    }

    const registrations = await this.registrationService.findByDateRange(startDate, endDate)

    // Filter out Sundays and admin accounts from results (no lunch service on Sundays, admin accounts excluded)
    const filtered = registrations.filter(r => {
      const day = new Date(r.date).getDay()
      if (day === 0 && !includeSundays) return false

      const userRole = (r.user as { role?: string })?.role
      if (userRole === 'admin') return false

      return true
    })

    // Group by date for stats
    const dateGroups: Record<string, number> = {}
    filtered.forEach(r => {
      const dateKey = toDateKey(new Date(r.date))
      dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1
    })

    const reportData = filtered.map((r, idx) => ({
      stt: idx + 1,
      name: r.user?.name,
      phone: (r.user as { phone?: string })?.phone ?? r.user?.username ?? '',
      date: new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      status: r.status,
      department: (r.user as { department?: { name?: string } })?.department?.name ?? ''
    }))

    return NextResponse.json({
      reportData,
      stats: {
        total: reportData.length,
        byDate: dateGroups
      }
    })
  }

  async exportCsv(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeSundays = searchParams.get('includeSundays') === 'true'

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
    }

    const registrations = await this.registrationService.findByDateRange(startDate, endDate)
    const filtered = registrations.filter(r => {
      const day = new Date(r.date).getDay()
      if (day === 0 && !includeSundays) return false

      const userRole = (r.user as { role?: string })?.role
      if (userRole === 'admin') return false

      return true
    })

    const totalEmployees = await this.userService.count()
    const eatingCount = filtered.filter(r => r.status === 'eating').length
    const notEatingCount = filtered.filter(r => r.status === 'not_eating').length
    const absentUsers = filtered.filter(r => r.status === 'not_eating').map(r => r.user?.name)

    const now = new Date()
    const generatedAt = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

    const csvRows = [
      `BAOCOM Lunch Report`,
      `Date Range,${startDate} - ${endDate}`,
      `Generated,${generatedAt}`,
      `Timezone,Asia/Ho_Chi_Minh`,
      `Total Employees,${totalEmployees}`,
      `Eating,${eatingCount}`,
      `Not Eating,${notEatingCount}`,
      ``,
      `Absent Employees,${absentUsers.length}`,
      ...absentUsers.map((name, i) => `${i + 1},${name}`),
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
    const { searchParams } = req.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
    }

    const registrations = await this.registrationService.findByDateRange(startDate, endDate)

    // Group by user and count eating/not_eating
    const userStats: Record<string, { name: string; department: string; eating: number; notEating: number }> = {}
    registrations.forEach(r => {
      if (!r.userId) return

      const userRole = (r.user as { role?: string })?.role
      if (userRole === 'admin') return

      const name = r.user?.name || 'Unknown'
      const department = (r.user as { department?: { name?: string } })?.department?.name ?? ''
      if (!userStats[r.userId]) {
        userStats[r.userId] = { name, department, eating: 0, notEating: 0 }
      }
      if (r.status === 'eating' || r.status === 'registered') {
        userStats[r.userId].eating++
      } else if (r.status === 'not_eating') {
        userStats[r.userId].notEating++
      }
    })

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

    // Data rows
    let rowNum = 5
    let totalEating = 0
    let totalNotEating = 0
    let stt = 1

    Object.values(userStats).forEach(stats => {
      const row = sheet.getRow(rowNum)
      row.getCell(1).value = stt++
      row.getCell(2).value = stats.name
      row.getCell(3).value = stats.department
      row.getCell(4).value = stats.eating
      row.getCell(5).value = stats.notEating
      totalEating += stats.eating
      totalNotEating += stats.notEating
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