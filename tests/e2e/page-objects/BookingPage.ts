import { Page, Locator } from '@playwright/test'

export class BookingPage {
  readonly page: Page

  // Navigation buttons
  readonly prevWeekBtn: Locator
  readonly nextWeekBtn: Locator

  // Stats
  readonly eatingCount: Locator
  readonly openCount: Locator

  constructor(page: Page) {
    this.page = page
    this.prevWeekBtn = page.locator('button:has-text("Tuần trước")')
    this.nextWeekBtn = page.locator('button:has-text("Tuần sau")')
    this.eatingCount = page.locator('[class*="bg-surface-container-low"]:has-text("Có ăn") >> nth=0')
    this.openCount = page.locator('[class*="bg-surface-container-low"]:has-text("Còn sửa được") >> nth=0')
  }

  async goto() {
    await this.page.goto('/book')
    await this.page.waitForLoadState('networkidle')
  }

  getDayCard(dateKey: string): Locator {
    return this.page.locator(`[data-testid="book-day-${dateKey}"]`)
  }

  getEatButton(dateKey: string): Locator {
    return this.page.locator(`[data-testid="book-day-${dateKey}"] button:has-text("Có ăn")`)
  }

  getNotEatButton(dateKey: string): Locator {
    return this.page.locator(`[data-testid="book-day-${dateKey}"] button:has-text("Không ăn")`)
  }

  getLockedBadge(dateKey: string): Locator {
    return this.page.locator(`[data-testid="book-day-${dateKey}"] span:has-text("Đã khóa")`)
  }

  async clickEat(dateKey: string) {
    await this.getEatButton(dateKey).click()
  }

  async clickNotEat(dateKey: string) {
    await this.getNotEatButton(dateKey).click()
  }

  async nextWeek() {
    await this.nextWeekBtn.click()
  }

  async prevWeek() {
    await this.prevWeekBtn.click()
  }

  async isDayLocked(dateKey: string): Promise<boolean> {
    return await this.getLockedBadge(dateKey).count() > 0
  }

  async getDayStatus(dateKey: string): Promise<string | null> {
    const eating = await this.page.locator(`[data-testid="book-day-${dateKey}"] span:has-text("Đã đăng ký")`).count()
    if (eating > 0) return 'eating'
    const notEating = await this.page.locator(`[data-testid="book-day-${dateKey}"] span:has-text("Đã báo nghỉ")`).count()
    if (notEating > 0) return 'not-eating'
    const defaultEating = await this.page.locator(`[data-testid="book-day-${dateKey}"] span:has-text("Mặc định có cơm")`).count()
    if (defaultEating > 0) return 'default-eating'
    return null
  }

  async getDayCount(): Promise<number> {
    return await this.page.locator('[data-testid^="book-day-"]').count()
  }

  async getWeekOffset(): Promise<string> {
    return await this.page.locator('[class*="text-sm text-ink-muted-80"]:has-text("/5")').textContent() || ''
  }

  async isPrevWeekDisabled(): Promise<boolean> {
    const disabled = await this.prevWeekBtn.getAttribute('disabled')
    return disabled !== null
  }

  async isNextWeekDisabled(): Promise<boolean> {
    const disabled = await this.nextWeekBtn.getAttribute('disabled')
    return disabled !== null
  }
}