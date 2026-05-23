import { Page, Locator } from '@playwright/test'

export class EmployeeDashboardPage {
  readonly page: Page

  // Day tabs (e.g., T2, T3, T4, T5, T6)
  readonly dayTabs: Locator

  // Menu content
  readonly menuContent: Locator
  readonly dayHeader: Locator
  readonly registrationBadge: Locator
  readonly mainDish: Locator
  readonly vegetableDish: Locator
  readonly dessertDish: Locator

  constructor(page: Page) {
    this.page = page
    this.dayTabs = page.locator('button:has-text("T2"), button:has-text("T3"), button:has-text("T4"), button:has-text("T5"), button:has-text("T6")')
    this.menuContent = page.locator('[class*="rounded-[18px]"][class*="bg-surface"]')
    this.dayHeader = page.locator('h2:has-text("Thứ")')
    this.registrationBadge = page.locator('[class*="rounded-full"][class*="text-xs"]')
    this.mainDish = page.locator('text=Món chính')
    this.vegetableDish = page.locator('text=Món rau')
    this.dessertDish = page.locator('text=Tráng miệng')
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async selectDay(index: number) {
    const tabs = this.dayTabs
    const count = await tabs.count()
    if (index < count) {
      await tabs.nth(index).click()
    }
  }

  async getDayCount(): Promise<number> {
    return await this.dayTabs.count()
  }

  async getDayTabText(index: number): Promise<string> {
    const tabs = this.dayTabs
    const count = await tabs.count()
    if (index < count) {
      return await tabs.nth(index).textContent() || ''
    }
    return ''
  }

  async hasMenuContent(): Promise<boolean> {
    return await this.menuContent.count() > 0
  }

  async getRegistrationStatus(): Promise<string | null> {
    const badge = await this.registrationBadge.first()
    if (await badge.count() > 0) {
      return await badge.textContent()
    }
    return null
  }
}