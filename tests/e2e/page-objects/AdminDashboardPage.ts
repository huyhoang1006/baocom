import { Page, Locator } from '@playwright/test'

export class AdminDashboardPage {
  readonly page: Page
  readonly todayBtn: Locator
  readonly exportReportBtn: Locator
  readonly manageEmployeesBtn: Locator
  readonly statsCards: Locator
  readonly absencesTable: Locator

  constructor(page: Page) {
    this.page = page
    this.todayBtn = page.locator('button:has-text("Hôm nay")')
    this.exportReportBtn = page.locator('a:has-text("Xuất báo cáo")')
    this.manageEmployeesBtn = page.locator('a:has-text("Quản lý nhân sự")')
    this.statsCards = page.locator('.grid.grid-cols-2 > div')
    this.absencesTable = page.locator('table')
  }

  async goto() {
    await this.page.goto('/admin/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async clickToday() {
    await this.todayBtn.click()
    await this.page.waitForLoadState('networkidle')
  }
}