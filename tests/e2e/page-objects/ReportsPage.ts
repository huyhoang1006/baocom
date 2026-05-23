import { Page, Locator } from '@playwright/test'

export class ReportsPage {
  readonly page: Page
  readonly dayTab: Locator
  readonly weekTab: Locator
  readonly monthTab: Locator
  readonly searchBtn: Locator
  readonly exportXlsxBtn: Locator

  constructor(page: Page) {
    this.page = page
    this.dayTab = page.locator('button:has-text("Ngày")')
    this.weekTab = page.locator('button:has-text("Tuần")')
    this.monthTab = page.locator('button:has-text("Tháng")')
    this.searchBtn = page.locator('button:has-text("Tra cứu")')
    this.exportXlsxBtn = page.locator('button:has-text("Excel")')
  }

  async goto() {
    await this.page.goto('/admin/reports')
    await this.page.waitForLoadState('networkidle')
  }

  async selectDayReport(date: string) {
    await this.dayTab.click()
    await this.page.waitForTimeout(200)
    await this.page.fill('input[type="date"]', date)
    await this.searchBtn.click()
    await this.page.waitForLoadState('networkidle')
  }

  async exportXlsx() {
    await this.exportXlsxBtn.click()
    await this.page.waitForTimeout(1000)
  }
}