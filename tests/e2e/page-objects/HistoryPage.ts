import { Page, Locator } from '@playwright/test'

export class HistoryPage {
  readonly page: Page

  // Navigation
  readonly prevMonthBtn: Locator
  readonly nextMonthBtn: Locator
  readonly monthYearLabel: Locator

  // Calendar grid
  readonly calendarGrid: Locator

  // Stats
  readonly totalStat: Locator
  readonly eatingStat: Locator
  readonly notEatingStat: Locator

  constructor(page: Page) {
    this.page = page
    this.prevMonthBtn = page.locator('button[aria-label="Tháng trước"]')
    this.nextMonthBtn = page.locator('button[aria-label="Tháng sau"]')
    this.monthYearLabel = page.locator('h2:has-text("Tháng")')
    this.calendarGrid = page.locator('[class*="grid"][class*="grid-cols-7"]')
    this.totalStat = page.locator('[class*="rounded-[18px]"]:has-text("Tổng")')
    this.eatingStat = page.locator('[class*="bg-success-bg"]:has-text("Có ăn")')
    this.notEatingStat = page.locator('[class*="bg-error-bg"]:has-text("Không ăn")')
  }

  async goto() {
    await this.page.goto('/my-history')
    await this.page.waitForLoadState('networkidle')
  }

  async prevMonth() {
    await this.prevMonthBtn.click()
    await this.page.waitForTimeout(300)
  }

  async nextMonth() {
    await this.nextMonthBtn.click()
    await this.page.waitForTimeout(300)
  }

  async getMonthYearText(): Promise<string> {
    return await this.monthYearLabel.textContent() || ''
  }

  async getDayCount(): Promise<number> {
    return await this.calendarGrid.locator('[class*="rounded-full"]').count()
  }

  async getTotalCount(): Promise<number> {
    const text = await this.totalStat.textContent() || ''
    const match = text.match(/\d+/)
    return match ? parseInt(match[0], 10) : 0
  }

  async getEatingCount(): Promise<number> {
    const text = await this.eatingStat.textContent() || ''
    const match = text.match(/\d+/)
    return match ? parseInt(match[0], 10) : 0
  }

  async getNotEatingCount(): Promise<number> {
    const text = await this.notEatingStat.textContent() || ''
    const match = text.match(/\d+/)
    return match ? parseInt(match[0], 10) : 0
  }
}