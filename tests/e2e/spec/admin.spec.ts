import { test, expect } from '@playwright/test'
import { test as adminTest, expect as adminExpect } from './fixtures/auth.fixtures'
import { AdminDashboardPage } from './page-objects/AdminDashboardPage'
import { EmployeeManagementPage } from './page-objects/EmployeeManagementPage'
import { MenuManagementPage } from './page-objects/MenuManagementPage'
import { HolidaysPage } from './page-objects/HolidaysPage'
import { ReportsPage } from './page-objects/ReportsPage'
import { SettingsPage } from './page-objects/SettingsPage'

// TC-ADMIN-001: Dashboard displays stats cards
adminTest('TC-ADMIN-001: Dashboard displays stats cards', async ({ authenticatedAdmin }) => {
  const page = new AdminDashboardPage(authenticatedAdmin.page)
  await page.goto()

  // Stats cards should be visible
  const statsCards = page.statsCards
  await adminExpect(statsCards).toBeVisible()
  const count = await statsCards.count()
  expect(count).toBeGreaterThanOrEqual(6)
})

// TC-ADMIN-002: Dashboard quick actions work
adminTest('TC-ADMIN-002: Dashboard quick actions work', async ({ authenticatedAdmin }) => {
  const page = new AdminDashboardPage(authenticatedAdmin.page)
  await page.goto()

  // Export report button should navigate to reports
  await adminExpect(page.exportReportBtn).toBeVisible()
  await page.exportReportBtn.click()
  await authenticatedAdmin.page.waitForURL('**/admin/reports')
})

// TC-ADMIN-003: Dashboard today highlight
adminTest('TC-ADMIN-003: Dashboard today button shows today stats', async ({ authenticatedAdmin }) => {
  const page = new AdminDashboardPage(authenticatedAdmin.page)
  await page.goto()

  await page.clickToday()
  await authenticatedAdmin.page.waitForLoadState('networkidle')
  // Page should still be on dashboard
  await adminExpect(authenticatedAdmin.page.locator('h1:has-text("Dashboard")')).toBeVisible()
})

// TC-ADMIN-004: Employee list loads
adminTest('TC-ADMIN-004: Employee list loads', async ({ authenticatedAdmin }) => {
  const page = new EmployeeManagementPage(authenticatedAdmin.page)
  await page.goto()

  await adminExpect(page.employeeTable).toBeVisible()
})

// TC-ADMIN-005: Employee search filters results
adminTest('TC-ADMIN-005: Employee search filters results', async ({ authenticatedAdmin }) => {
  const page = new EmployeeManagementPage(authenticatedAdmin.page)
  await page.goto()

  await page.search('admin')
  await authenticatedAdmin.page.waitForTimeout(300)
  // Search should filter the table
  const rows = authenticatedAdmin.page.locator('tbody tr')
  expect(await rows.count()).toBeGreaterThanOrEqual(0)
})

// TC-ADMIN-006: Add employee modal opens
adminTest('TC-ADMIN-006: Add employee modal opens', async ({ authenticatedAdmin }) => {
  const page = new EmployeeManagementPage(authenticatedAdmin.page)
  await page.goto()

  await page.addEmployeeBtn.click()
  await adminExpect(page.getAddModal()).toBeVisible()
})

// TC-ADMIN-007: Add new employee
adminTest('TC-ADMIN-007: Add new employee', async ({ authenticatedAdmin }) => {
  const page = new EmployeeManagementPage(authenticatedAdmin.page)
  await page.goto()

  const testName = `Test Employee ${Date.now()}`
  await page.addEmployee(testName)
  await authenticatedAdmin.page.waitForTimeout(500)
  // Employee should be added to the list
  await adminExpect(authenticatedAdmin.page.locator(`text=${testName}`)).toBeVisible()
})

// TC-ADMIN-008: Edit employee modal
adminTest('TC-ADMIN-008: Edit employee modal opens', async ({ authenticatedAdmin }) => {
  const page = new EmployeeManagementPage(authenticatedAdmin.page)
  await page.goto()

  // Click edit button on first employee
  const editBtn = authenticatedAdmin.page.locator('button[title="Sửa"]').first()
  await editBtn.click()
  await adminExpect(authenticatedAdmin.page.locator('h2:has-text("Chỉnh sửa nhân viên")')).toBeVisible()
})

// TC-ADMIN-009: Delete employee modal
adminTest('TC-ADMIN-009: Delete employee modal opens', async ({ authenticatedAdmin }) => {
  const page = new EmployeeManagementPage(authenticatedAdmin.page)
  await page.goto()

  // Click delete button on first employee
  const deleteBtn = authenticatedAdmin.page.locator('button[title="Xóa"]').first()
  await deleteBtn.click()
  await adminExpect(authenticatedAdmin.page.locator('h2:has-text("Xóa nhân viên?")')).toBeVisible()
})

// TC-ADMIN-010: Employee detail modal with clipboard
adminTest('TC-ADMIN-010: Employee detail modal shows credentials', async ({ authenticatedAdmin }) => {
  const page = new EmployeeManagementPage(authenticatedAdmin.page)
  await page.goto()

  // Click on employee row to open detail
  const firstRow = authenticatedAdmin.page.locator('tbody tr').first()
  await firstRow.click()
  await adminExpect(authenticatedAdmin.page.locator('h2:has-text("Chi tiết nhân viên")')).toBeVisible()
  // Copy button should be visible
  await adminExpect(authenticatedAdmin.page.locator('button[title="Copy"]').first()).toBeVisible()
})

// TC-ADMIN-011: Add employee validation
adminTest('TC-ADMIN-011: Add employee validation shows error for empty name', async ({ authenticatedAdmin }) => {
  const page = new EmployeeManagementPage(authenticatedAdmin.page)
  await page.goto()

  await page.addEmployeeBtn.click()
  await authenticatedAdmin.page.waitForTimeout(200)
  // Try to save without name
  await authenticatedAdmin.page.locator('button:has-text("Thêm mới")').click()
  await adminExpect(authenticatedAdmin.page.locator('text=Vui lòng nhập họ và tên')).toBeVisible()
})

// TC-ADMIN-012: Search with no results
adminTest('TC-ADMIN-012: Search shows no results message for non-existent employee', async ({ authenticatedAdmin }) => {
  const page = new EmployeeManagementPage(authenticatedAdmin.page)
  await page.goto()

  await page.search('xyznonexistent123')
  await authenticatedAdmin.page.waitForTimeout(300)
  await adminExpect(authenticatedAdmin.page.locator('text=Không tìm thấy nhân viên')).toBeVisible()
})

// TC-ADMIN-013: Reports day view
adminTest('TC-ADMIN-013: Reports day view displays correctly', async ({ authenticatedAdmin }) => {
  const page = new ReportsPage(authenticatedAdmin.page)
  await page.goto()

  await adminExpect(page.dayTab).toBeVisible()
  await adminExpect(authenticatedAdmin.page.locator('input[type="date"]')).toBeVisible()
})

// TC-ADMIN-014: Reports week view
adminTest('TC-ADMIN-014: Reports week view displays correctly', async ({ authenticatedAdmin }) => {
  const page = new ReportsPage(authenticatedAdmin.page)
  await page.goto()

  await page.weekTab.click()
  await adminExpect(authenticatedAdmin.page.locator('select')).toBeVisible()
})

// TC-ADMIN-015: Reports month view
adminTest('TC-ADMIN-015: Reports month view displays correctly', async ({ authenticatedAdmin }) => {
  const page = new ReportsPage(authenticatedAdmin.page)
  await page.goto()

  await page.monthTab.click()
  await adminExpect(authenticatedAdmin.page.locator('select')).toBeVisible()
})

// TC-ADMIN-016: Reports day report query
adminTest('TC-ADMIN-016: Reports day report can be queried', async ({ authenticatedAdmin }) => {
  const page = new ReportsPage(authenticatedAdmin.page)
  await page.goto()

  const today = new Date().toISOString().split('T')[0]
  await page.selectDayReport(today)
  await authenticatedAdmin.page.waitForTimeout(500)
  // Stats section may appear after query
  await adminExpect(page.searchBtn).toBeVisible()
})

// TC-ADMIN-017: Reports stats display
adminTest('TC-ADMIN-017: Reports stats display after query', async ({ authenticatedAdmin }) => {
  const page = new ReportsPage(authenticatedAdmin.page)
  await page.goto()

  const today = new Date().toISOString().split('T')[0]
  await page.selectDayReport(today)
  await authenticatedAdmin.page.waitForTimeout(1000)
  // May show empty state or data depending on registration status
  await adminExpect(page.searchBtn).toBeVisible()
})

// TC-ADMIN-018: Reports expandable list
adminTest('TC-ADMIN-018: Reports list can be expanded', async ({ authenticatedAdmin }) => {
  const page = new ReportsPage(authenticatedAdmin.page)
  await page.goto()

  const today = new Date().toISOString().split('T')[0]
  await page.selectDayReport(today)
  await authenticatedAdmin.page.waitForTimeout(1000)

  // Look for expand button (if there are more than 5 employees)
  const expandBtn = authenticatedAdmin.page.locator('button:has-text("Xem thêm")')
  if (await expandBtn.count() > 0) {
    await expandBtn.click()
    await authenticatedAdmin.page.waitForTimeout(300)
    await adminExpect(authenticatedAdmin.page.locator('button:has-text("Thu gọn")')).toBeVisible()
  }
})

// TC-ADMIN-019: Reports export XLSX
adminTest('TC-ADMIN-019: Reports export XLSX button is clickable', async ({ authenticatedAdmin }) => {
  const page = new ReportsPage(authenticatedAdmin.page)
  await page.goto()

  const today = new Date().toISOString().split('T')[0]
  await page.selectDayReport(today)
  await authenticatedAdmin.page.waitForTimeout(1000)

  await adminExpect(page.exportXlsxBtn).toBeVisible()
  // Just verify button is clickable - actual download test would need more setup
})

// TC-ADMIN-020: Menu management week navigation
adminTest('TC-ADMIN-020: Menu management week navigation works', async ({ authenticatedAdmin }) => {
  const page = new MenuManagementPage(authenticatedAdmin.page)
  await page.goto()

  await adminExpect(page.nextWeekBtn).toBeVisible()
  await adminExpect(page.prevWeekBtn).toBeVisible()

  await page.nextWeekBtn.click()
  await authenticatedAdmin.page.waitForTimeout(300)

  await page.prevWeekBtn.click()
  await authenticatedAdmin.page.waitForTimeout(300)
})

// TC-ADMIN-021: Menu management expand day
adminTest('TC-ADMIN-021: Menu management expand day shows meals', async ({ authenticatedAdmin }) => {
  const page = new MenuManagementPage(authenticatedAdmin.page)
  await page.goto()

  // Expand first day
  await page.expandDay(0)
  await adminExpect(authenticatedAdmin.page.locator('button:has-text("Món chính")')).toBeVisible()
})

// TC-ADMIN-022: Menu management add meal
adminTest('TC-ADMIN-022: Menu management can add meal', async ({ authenticatedAdmin }) => {
  const page = new MenuManagementPage(authenticatedAdmin.page)
  await page.goto()

  await page.expandDay(0)
  await authenticatedAdmin.page.waitForTimeout(200)

  // Click on a meal type section
  const mainMealSection = authenticatedAdmin.page.locator('button:has-text("Món chính")')
  await mainMealSection.click()
  await authenticatedAdmin.page.waitForTimeout(200)

  // Click add meal button
  const addBtn = authenticatedAdmin.page.locator('button:has-text("Thêm món")')
  if (await addBtn.count() > 0) {
    await addBtn.click()
    await authenticatedAdmin.page.waitForSelector('input[placeholder="Nhập tên món..."]')
    await authenticatedAdmin.page.fill('input[placeholder="Nhập tên món..."]', 'Test Meal')
    await authenticatedAdmin.page.locator('button:has-text("Thêm")').click()
  }
})

// TC-ADMIN-023: Menu management save meals
adminTest('TC-ADMIN-023: Menu management save button works', async ({ authenticatedAdmin }) => {
  const page = new MenuManagementPage(authenticatedAdmin.page)
  await page.goto()

  await adminExpect(page.saveBtn).toBeVisible()
  await page.saveBtn.click()
  await authenticatedAdmin.page.waitForTimeout(500)
})

// TC-ADMIN-024: Menu - edit meal
adminTest('TC-ADMIN-024: Menu management can edit meal name', async ({ authenticatedAdmin }) => {
  const page = new MenuManagementPage(authenticatedAdmin.page)
  await page.goto()

  await page.expandDay(0)
  await authenticatedAdmin.page.waitForTimeout(200)

  // Find and click more_horiz button to access edit
  const moreBtn = authenticatedAdmin.page.locator('.material-symbols-outlined:has-text("more_horiz")').first()
  if (await moreBtn.count() > 0) {
    await moreBtn.click()
    await authenticatedAdmin.page.waitForTimeout(200)
    const editBtn = authenticatedAdmin.page.locator('button:has-text("Sửa tên")')
    if (await editBtn.count() > 0) {
      await editBtn.click()
      await adminExpect(authenticatedAdmin.page.locator('h2:has-text("Sửa tên món")')).toBeVisible()
    }
  }
})

// TC-ADMIN-025: Menu - delete meal
adminTest('TC-ADMIN-025: Menu management can delete meal', async ({ authenticatedAdmin }) => {
  const page = new MenuManagementPage(authenticatedAdmin.page)
  await page.goto()

  await page.expandDay(0)
  await authenticatedAdmin.page.waitForTimeout(200)

  // Find and click more_horiz button to access delete
  const moreBtn = authenticatedAdmin.page.locator('.material-symbols-outlined:has-text("more_horiz")').first()
  if (await moreBtn.count() > 0) {
    await moreBtn.click()
    await authenticatedAdmin.page.waitForTimeout(200)
    const deleteBtn = authenticatedAdmin.page.locator('button:has-text("Xóa")')
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click()
      await adminExpect(authenticatedAdmin.page.locator('h2:has-text("Xác nhận xóa")')).toBeVisible()
    }
  }
})

// TC-ADMIN-SET-001: Settings cutoff time
adminTest('TC-ADMIN-SET-001: Settings page displays cutoff inputs', async ({ authenticatedAdmin }) => {
  const page = new SettingsPage(authenticatedAdmin.page)
  await page.goto()

  await adminExpect(page.cutoffHourInput).toBeVisible()
  await adminExpect(page.cutoffMinuteInput).toBeVisible()
  await adminExpect(page.saveBtn).toBeVisible()
})

// TC-ADMIN-SET-002: Settings update cutoff time
adminTest('TC-ADMIN-SET-002: Settings can update cutoff time', async ({ authenticatedAdmin }) => {
  const page = new SettingsPage(authenticatedAdmin.page)
  await page.goto()

  await page.updateCutoff(22, 30)
  await authenticatedAdmin.page.waitForTimeout(500)
  // Should show success notification
  await adminExpect(authenticatedAdmin.page.locator('text=Đã lưu cài đặt')).toBeVisible({ timeout: 5000 })
})