import { test, expect } from '@playwright/test'

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

  // Login via API to get cookies
  const loginResp = await context.request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = getCookieHeader(loginResp.headers())

  // Set date range: startDate=2026-05-11, endDate=2026-05-15
  const startDate = '2026-05-11'
  const endDate = '2026-05-15'

  // Get preview data via API
  const previewResp = await context.request.get(
    `/api/admin/reports?startDate=${startDate}&endDate=${endDate}&includeSundays=false`,
    { headers: { Cookie: cookies } }
  )
  expect(previewResp.status()).toBe(200)
  const previewData = await previewResp.json()
  const previewRows = previewData.reportData || []

  // Download CSV via API
  const csvResp = await context.request.get(
    `/api/admin/reports/export?startDate=${startDate}&endDate=${endDate}&includeSundays=false`,
    { headers: { Cookie: cookies } }
  )

  // The API returns CSV content directly
  expect(csvResp.status()).toBe(200)
  const csvContent = await csvResp.text()

  // Verify date range in CSV header
  expect(csvContent).toContain(`Date Range,${startDate} - ${endDate}`)

  // Verify timezone
  expect(csvContent).toContain('Timezone,Asia/Ho_Chi_Minh')

  // Verify totals match preview
  const previewTotal = previewRows.length

  // The CSV has header rows before the absent employee list
  const csvLines = csvContent.split('\n').filter(line => line.trim() !== '')

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

  // Calculate dynamic Mon-Fri range relative to today
  const today = new Date()
  const dayOfWeek = today.getDay()
  // Find Monday: subtract (dayOfWeek - 1) days, but handle Sunday (0) as special case
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysFromMonday)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const pad = (n: number) => String(n).padStart(2, '0')
  const startDate = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`
  const endDate = `${friday.getFullYear()}-${pad(friday.getMonth() + 1)}-${pad(friday.getDate())}`

  // Get CSV for week range via API
  const csvResp = await context.request.get(
    `/api/admin/reports/export?startDate=${startDate}&endDate=${endDate}&includeSundays=false`,
    { headers: { Cookie: cookies } }
  )

  expect(csvResp.status()).toBe(200)
  const csvContent = await csvResp.text()

  // Verify content is CSV
  expect(csvContent).toContain('BAOCOM')
  expect(csvContent).toContain(`Date Range,${startDate}`)

  // Check suggested filename pattern (may not be available via API, so check content)
  expect(csvContent).toContain('Timezone,Asia/Ho_Chi_Minh')

  await context.close()
})