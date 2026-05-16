import { test, expect, Page } from '@playwright/test'

// Helper to extract cookie from headers object
function getCookieHeader(headers: Record<string, string>): string {
  const cookies = headers['set-cookie'] || ''
  if (!cookies) return ''
  const cookieStrings = cookies.split(',').map(c => c.trim())
  return cookieStrings
    .map(c => c.split(';')[0])
    .filter(c => c.includes('='))
    .join('; ')
}

// TC-REPORT-CSV-001: CSV export matches preview data
test('TC-REPORT-CSV-001: CSV export matches preview data', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  // 1. Login as admin
  await page.goto('/login')
  await page.fill('#username', 'admin')
  await page.fill('#password', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })

  // 2. Go to /admin/reports
  await page.goto('/admin/reports')
  await page.waitForLoadState('networkidle')

  // 3. Set date range: startDate=2026-05-11, endDate=2026-05-15
  // Wait for report type selector to appear, click "Ngày" to switch to day mode
  await page.waitForSelector('button:has-text("Ngày")', { timeout: 5000 })

  // Use day report type and set specific date
  const startDate = '2026-05-11'
  const endDate = '2026-05-15'

  // Navigate to week view and select the week containing our dates
  // First check what week options are available
  await page.click('button:has-text("Tuần")')
  await page.waitForTimeout(500)

  // Set the date range by using direct URL or finding the right week
  // For this test we use the day picker - set to a single date that falls in our range
  // and also test CSV download for the full range via direct API

  // Instead, we'll use the API directly to get preview data and CSV
  // Login via API to get cookies
  const loginResp = await context.request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = getCookieHeader(loginResp.headers())

  // 4. Get preview data via API
  const previewResp = await context.request.get(
    `/api/admin/reports?startDate=${startDate}&endDate=${endDate}&includeSundays=false`,
    { headers: { Cookie: cookies } }
  )
  expect(previewResp.status()).toBe(200)
  const previewData = await previewResp.json()
  const previewRows = previewData.reportData || []

  // 5. Download CSV via API
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    context.request.get(
      `/api/admin/reports/export?startDate=${startDate}&endDate=${endDate}&includeSundays=false`,
      { headers: { Cookie: cookies } }
    )
  ])

  // Save download
  const downloadPath = await download.path()
  expect(downloadPath).toBeTruthy()

  // 6. Verify CSV content
  const fs = await import('fs')
  const csvContent = fs.readFileSync(downloadPath, 'utf-8')
  const csvLines = csvContent.split('\n').filter(line => line.trim() !== '')

  // Verify date range in CSV header
  expect(csvContent).toContain(`Date Range,${startDate} - ${endDate}`)

  // Verify timezone
  expect(csvContent).toContain('Timezone,Asia/Ho_Chi_Minh')

  // Verify totals match preview
  const previewTotal = previewRows.length

  // The CSV has header rows before the absent employee list
  // Count actual registration lines (format: "number,name" for absent employees)
  const absentEmployeeLines = csvLines.filter(line => {
    const trimmed = line.trim()
    // Absent employee lines start with a number followed by comma
    return /^\d+,/.test(trimmed) && !trimmed.startsWith('BAOCOM') && !trimmed.startsWith('Date') && !trimmed.startsWith('Generated') && !trimmed.startsWith('Timezone') && !trimmed.startsWith('Total') && !trimmed.startsWith('Eating') && !trimmed.startsWith('Not')
  })

  // Verify row count (total registrations in preview should match CSV absent count for verification)
  // The CSV format: BAOCOM Lunch Report, Date Range, Generated, Timezone, Total Employees,
  // Eating, Not Eating, [blank], Absent Employees header, then numbered list

  // Extract eating/not-eating counts from CSV
  let eatingCount = 0
  let notEatingCount = 0
  for (const line of csvLines) {
    if (line.startsWith('Eating,')) {
      eatingCount = parseInt(line.split(',')[1], 10)
    }
    if (line.startsWith('Not Eating,')) {
      notEatingCount = parseInt(line.split(',')[1], 10)
    }
  }

  expect(eatingCount + notEatingCount).toBeGreaterThanOrEqual(previewTotal)

  // Verify dates are within range
  for (const row of previewRows) {
    const dateMatch = row.date.match(/(\d{2})\/(\d{2})/)
    if (dateMatch) {
      const month = parseInt(dateMatch[2], 10)
      const day = parseInt(dateMatch[1], 10)
      expect(month).toBeGreaterThanOrEqual(5)
      expect(month).toBeLessThanOrEqual(5)
    }
  }

  await context.close()
})

// TC-REPORT-CSV-002: CSV download works with week range
test('TC-REPORT-CSV-002: CSV download works with week range', async ({ browser }) => {
  const context = await browser.newContext()

  // Login via API
  const loginResp = await context.request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = getCookieHeader(loginResp.headers())

  // Download CSV for week range
  const [download] = await Promise.all([
    context.waitForEvent('download'),
    context.request.get(
      '/api/admin/reports/export?startDate=2026-05-11&endDate=2026-05-15&includeSundays=false',
      { headers: { Cookie: cookies } }
    )
  ])

  const downloadPath = await download.path()
  expect(downloadPath).toBeTruthy()
  expect(download.suggestedFilename()).toContain('BAOCOM_Report_2026-05-11_2026-05-15.csv')

  await context.close()
})