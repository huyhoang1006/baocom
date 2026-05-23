import { Page, Locator } from '@playwright/test'

export class HolidaysPage {
  readonly page: Page
  readonly addHolidayBtn: Locator
  readonly holidayList: Locator

  constructor(page: Page) {
    this.page = page
    this.addHolidayBtn = page.locator('button:has-text("Thêm ngày lễ")')
    this.holidayList = page.locator('.space-y-3 > div')
  }

  async goto() {
    await this.page.goto('/admin/holidays')
    await this.page.waitForLoadState('networkidle')
  }

  async addHoliday(date: string, description: string) {
    await this.addHolidayBtn.click()
    await this.page.waitForSelector('input[type="date"]')
    await this.page.fill('input[type="date"]', date)
    await this.page.fill('input[placeholder*="Ngày lễ"]', description)
    await this.page.locator('button:has-text("Lưu")').click()
    await this.page.waitForLoadState('networkidle')
  }
}