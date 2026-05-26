# XLSX Export Implementation Plan

**Goal:** Thay CSV export bằng XLSX export với format mới (STT, Họ tên, Tổng báo cơm, Báo cắt cơm)

**Architecture:** Backend tạo XLSX file với ExcelJS, trả về binary cho download. Data được aggregate theo user từ RegistrationService.

**Tech Stack:** ExcelJS (Node.js), TypeScript, Next.js API routes

---

## File Structure

```
src/
├── controllers/
│   └── AdminReportsController.ts  # Add exportXlsx method
├── lib/
│   └── api.ts                     # Add exportXlsxUrl helper
app/
├── admin/
│   └── reports/
│       └── page.tsx              # Update export button
└── api/
    └── admin/
        └── reports/
            └── export-xlsx/
                └── route.ts       # New endpoint
```

---

## Task 1: Install ExcelJS

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add ExcelJS dependency**

Run: `npm install exceljs @types/exceljs`

Expected: Package added to package.json

---

## Task 2: Add exportXlsx method to AdminReportsController

**Files:**
- Modify: `src/controllers/AdminReportsController.ts:56-101`

- [ ] **Step 1: Add exportXlsx method**

```typescript
async exportXlsx(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
  }

  const registrations = await this.registrationService.findByDateRange(startDate, endDate)

  // Group by user and count eating/not_eating
  const userStats: Record<string, { name: string; eating: number; notEating: number }> = {}
  registrations.forEach(r => {
    if (!r.userId) return
    const name = r.user?.name || 'Unknown'
    if (!userStats[r.userId]) {
      userStats[r.userId] = { name, eating: 0, notEating: 0 }
    }
    if (r.status === 'eating' || r.status === 'registered') {
      userStats[r.userId].eating++
    } else if (r.status === 'not_eating') {
      userStats[r.userId].notEating++
    }
  })

  // Import ExcelJS
  const ExcelJS = require('exceljs')

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'BAOCOM'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Báo Cáo')

  // Title row
  sheet.getCell('A1').value = 'BAOCOM LUNCH REPORT'
  sheet.getCell('A1').font = { bold: true, size: 16 }
  sheet.mergeCells('A1:D1')

  // Date range row
  sheet.getCell('A2').value = `Date Range: ${startDate} - ${endDate}`
  sheet.getCell('A2').font = { size: 11 }
  sheet.mergeCells('A2:D2')

  // Generated row
  const generatedAt = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  sheet.getCell('A3').value = `Generated: ${generatedAt}`
  sheet.getCell('A3').font = { size: 11 }
  sheet.mergeCells('A3:D3')

  // Header row (row 4)
  const headers = ['STT', 'Họ tên', 'Tổng báo cơm', 'Báo cắt cơm']
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
    row.getCell(3).value = stats.eating
    row.getCell(4).value = stats.notEating
    totalEating += stats.eating
    totalNotEating += stats.notEating
    rowNum++
  })

  // Summary row
  const summaryRow = sheet.getRow(rowNum)
  summaryRow.getCell(1).value = ''
  summaryRow.getCell(2).value = 'Tổng cộng'
  summaryRow.getCell(2).font = { bold: true }
  summaryRow.getCell(3).value = totalEating
  summaryRow.getCell(3).font = { bold: true }
  summaryRow.getCell(4).value = totalNotEating
  summaryRow.getCell(4).font = { bold: true }
  summaryRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF99' }
  }

  // Auto-fit columns
  sheet.columns.forEach(column => {
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
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit src/controllers/AdminReportsController.ts`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/controllers/AdminReportsController.ts
git commit -m "feat: add exportXlsx method to AdminReportsController"
```

---

## Task 3: Create export-xlsx API route

**Files:**
- Create: `app/api/admin/reports/export-xlsx/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { AdminReportsController } from '@/controllers/AdminReportsController'

const controller = new AdminReportsController()

export const GET = withAdmin(async (req: NextRequest) => {
  return controller.exportXlsx(req)
})
```

- [ ] **Step 2: Test route exists**

Run: `curl -s -o /dev/null -w "%{http_code}" -b cookies.txt http://localhost:3000/api/admin/reports/export-xlsx?startDate=2026-05-18\&endDate=2026-05-24`

Expected: 200 or 400 (missing params)

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/reports/export-xlsx/route.ts
git commit -m "feat: add XLSX export endpoint"
```

---

## Task 4: Update API helper

**Files:**
- Modify: `src/lib/api.ts:163-166`

- [ ] **Step 1: Add exportXlsxUrl function**

Replace the `exportCsvUrl` function with `exportXlsxUrl`:

```typescript
exportXlsxUrl: (startDate: string, endDate: string) => {
  const params = new URLSearchParams({ startDate, endDate })
  return `/api/admin/reports/export-xlsx?${params}`
},
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: replace exportCsvUrl with exportXlsxUrl"
```

---

## Task 5: Update frontend export button

**Files:**
- Modify: `app/admin/reports/page.tsx:324-339`

- [ ] **Step 1: Replace CSV button with XLSX button**

Change the export buttons section:

```tsx
<div className="flex gap-2">
  <button
    onClick={handleExport}
    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-all"
  >
    <span className="material-symbols-outlined text-lg">table</span>
    Excel
  </button>
</div>
```

Remove `handleExportCsv` callback and the CSV button.

- [ ] **Step 2: Verify no errors**

Run: `npx tsc --noEmit app/admin/reports/page.tsx`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/admin/reports/page.tsx
git commit -m "feat: replace CSV export with XLSX export"
```

---

## Verification

1. Navigate to http://localhost:3000/admin/reports
2. Select date range and click "Tra cứu"
3. Click "Excel" button
4. Verify .xlsx file downloads
5. Open file and verify:
   - Sheet name: "Báo Cáo"
   - Title row: "BAOCOM LUNCH REPORT"
   - Columns: STT, Họ tên, Tổng báo cơm, Báo cắt cơm
   - Summary row at bottom with totals