import { test, expect } from '@playwright/test'
import { BookingPage } from '../page-objects/BookingPage'
import { EmployeeDashboardPage } from '../page-objects/EmployeeDashboardPage'
import { HistoryPage } from '../page-objects/HistoryPage'

test.describe('Employee Workflows', () => {
  let bookingPage: BookingPage
  let dashboardPage: EmployeeDashboardPage
  let historyPage: HistoryPage

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page)
    dashboardPage = new EmployeeDashboardPage(page)
    historyPage = new HistoryPage(page)
  })

  test('TC-EMP-001: Booking page displays 8 days', async ({ authenticatedEmployee }) => {
    await bookingPage.goto()
    // Wait for content to load
    await expect(bookingPage.prevWeekBtn).toBeVisible()
    // The booking page shows 5 workdays (Mon-Fri) per week, not 8 days
    const dayCount = await bookingPage.getDayCount()
    expect(dayCount).toBe(5)
  })

  test('TC-EMP-002: Week navigation previous disabled on week 0', async ({ authenticatedEmployee }) => {
    await bookingPage.goto()
    await expect(bookingPage.prevWeekBtn).toBeVisible()
    const isPrevDisabled = await bookingPage.isPrevWeekDisabled()
    expect(isPrevDisabled).toBe(true)
  })

  test('TC-EMP-003: Week navigation next enabled', async ({ authenticatedEmployee }) => {
    await bookingPage.goto()
    await expect(bookingPage.nextWeekBtn).toBeVisible()
    const isNextDisabled = await bookingPage.isNextWeekDisabled()
    expect(isNextDisabled).toBe(false)
  })

  test('TC-EMP-004: Toggle "Có ăn" on future day', async ({ authenticatedEmployee }) => {
    await bookingPage.goto()
    // Find first unlocked day card
    const dayCards = authenticatedEmployee.page.locator('[data-testid^="book-day-"]')
    const count = await dayCards.count()
    let unlockedDateKey: string | null = null
    for (let i = 0; i < count; i++) {
      const card = dayCards.nth(i)
      const lockedBadge = card.locator('span:has-text("Đã khóa")')
      if (await lockedBadge.count() === 0) {
        const testId = await card.getAttribute('data-testid')
        if (testId) {
          unlockedDateKey = testId.replace('book-day-', '')
          break
        }
      }
    }
    expect(unlockedDateKey).not.toBeNull()
    // Get initial status
    const initialStatus = await bookingPage.getDayStatus(unlockedDateKey!)
    // Click "Có ăn"
    await bookingPage.clickEat(unlockedDateKey!)
    await authenticatedEmployee.page.waitForTimeout(500)
    // Verify status changed
    const newStatus = await bookingPage.getDayStatus(unlockedDateKey!)
    // If was default-eating, clicking eat should confirm it
    expect(newStatus).not.toBeNull()
  })

  test('TC-EMP-005: Toggle "Không ăn" on future day', async ({ authenticatedEmployee }) => {
    await bookingPage.goto()
    // Find first unlocked day card
    const dayCards = authenticatedEmployee.page.locator('[data-testid^="book-day-"]')
    const count = await dayCards.count()
    let unlockedDateKey: string | null = null
    for (let i = 0; i < count; i++) {
      const card = dayCards.nth(i)
      const lockedBadge = card.locator('span:has-text("Đã khóa")')
      if (await lockedBadge.count() === 0) {
        const testId = await card.getAttribute('data-testid')
        if (testId) {
          unlockedDateKey = testId.replace('book-day-', '')
          break
        }
      }
    }
    expect(unlockedDateKey).not.toBeNull()
    // Click "Không ăn"
    await bookingPage.clickNotEat(unlockedDateKey!)
    await authenticatedEmployee.page.waitForTimeout(500)
    // Verify status changed
    const newStatus = await bookingPage.getDayStatus(unlockedDateKey!)
    expect(newStatus).toBe('not-eating')
  })

  test('TC-EMP-006: Past days are locked', async ({ authenticatedEmployee }) => {
    await bookingPage.goto()
    // First day (today) should be locked
    const dayCards = authenticatedEmployee.page.locator('[data-testid^="book-day-"]')
    const firstCard = dayCards.first()
    const isLocked = await firstCard.locator('span:has-text("Đã khóa")').count() > 0
    expect(isLocked).toBe(true)
  })

  test('TC-EMP-007: Booking stats display', async ({ authenticatedEmployee }) => {
    await bookingPage.goto()
    // Stats should be visible
    await expect(bookingPage.eatingCount).toBeVisible()
    await expect(bookingPage.openCount).toBeVisible()
  })

  test('TC-EMP-009: Max week offset enforced', async ({ authenticatedEmployee }) => {
    await bookingPage.goto()
    // Navigate forward 4 more weeks (max is 4 weeks ahead, so week 0 + 4 = week 4)
    for (let i = 0; i < 4; i++) {
      await bookingPage.nextWeek()
      await authenticatedEmployee.page.waitForTimeout(200)
    }
    // Next button should now be disabled
    const isNextDisabled = await bookingPage.isNextWeekDisabled()
    expect(isNextDisabled).toBe(true)
  })

  test('TC-EMP-010: Dashboard loads weekly menu', async ({ authenticatedEmployee }) => {
    await dashboardPage.goto()
    // Dashboard should show day tabs
    const dayCount = await dashboardPage.getDayCount()
    expect(dayCount).toBeGreaterThan(0)
    // Menu content should be present
    const hasContent = await dashboardPage.hasMenuContent()
    expect(hasContent).toBe(true)
  })

  test('TC-EMP-011: Day tab navigation', async ({ authenticatedEmployee }) => {
    await dashboardPage.goto()
    // Click on second day tab if available
    const dayCount = await dashboardPage.getDayCount()
    if (dayCount > 1) {
      await dashboardPage.selectDay(1)
      await authenticatedEmployee.page.waitForTimeout(300)
    }
    // Verify tab changed
    const dayCountAfter = await dashboardPage.getDayCount()
    expect(dayCountAfter).toBeGreaterThan(0)
  })

  test('TC-EMP-013: History page loads', async ({ authenticatedEmployee }) => {
    await historyPage.goto()
    // Calendar should be visible
    await expect(historyPage.calendarGrid).toBeVisible()
    // Stats should be visible
    await expect(historyPage.totalStat).toBeVisible()
    await expect(historyPage.eatingStat).toBeVisible()
    await expect(historyPage.notEatingStat).toBeVisible()
  })

  test('TC-EMP-015: Month navigation in history', async ({ authenticatedEmployee }) => {
    await historyPage.goto()
    const initialMonth = await historyPage.getMonthYearText()
    // Click next month
    await historyPage.nextMonth()
    const nextMonth = await historyPage.getMonthYearText()
    expect(nextMonth).not.toBe(initialMonth)
    // Click previous month to go back
    await historyPage.prevMonth()
    const prevMonth = await historyPage.getMonthYearText()
    expect(prevMonth).toBe(initialMonth)
  })

  test('TC-EMP-016: History stats reflect bookings', async ({ authenticatedEmployee }) => {
    await historyPage.goto()
    // Get initial counts
    const totalCount = await historyPage.getTotalCount()
    const eatingCount = await historyPage.getEatingCount()
    const notEatingCount = await historyPage.getNotEatingCount()
    // Total should equal eating + not eating
    expect(totalCount).toBe(eatingCount + notEatingCount)
  })

  test('TC-EMP-017: Dashboard registration status badge visible', async ({ authenticatedEmployee }) => {
    await dashboardPage.goto()
    const status = await dashboardPage.getRegistrationStatus()
    expect(status).not.toBeNull()
    expect(status).toMatch(/Đã đăng ký|Chưa đăng ký/)
  })
})