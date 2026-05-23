import { Page, Locator } from '@playwright/test'

export class SettingsPage {
  readonly page: Page
  readonly cutoffHourInput: Locator
  readonly cutoffMinuteInput: Locator
  readonly saveBtn: Locator

  constructor(page: Page) {
    this.page = page
    this.cutoffHourInput = page.locator('input[type="number"]').first()
    this.cutoffMinuteInput = page.locator('input[type="number"]').nth(1)
    this.saveBtn = page.locator('button:has-text("Lưu")').last()
  }

  async goto() {
    await this.page.goto('/admin/settings')
    await this.page.waitForLoadState('networkidle')
  }

  async updateCutoff(hour: number, minute: number) {
    await this.cutoffHourInput.fill(hour.toString())
    await this.cutoffMinuteInput.fill(minute.toString())
    await this.saveBtn.click()
    await this.page.waitForLoadState('networkidle')
  }
}