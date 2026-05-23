import { Page, Locator } from '@playwright/test'

export class MenuManagementPage {
  readonly page: Page
  readonly nextWeekBtn: Locator
  readonly prevWeekBtn: Locator
  readonly saveBtn: Locator

  constructor(page: Page) {
    this.page = page
    this.nextWeekBtn = page.locator('button:has-text("Tuần sau")')
    this.prevWeekBtn = page.locator('button:has-text("Tuần trước")')
    this.saveBtn = page.locator('button:has-text("Lưu thay đổi")')
  }

  async goto() {
    await this.page.goto('/admin/menu')
    await this.page.waitForLoadState('networkidle')
  }

  getDayCard(index: number): Locator {
    return this.page.locator('.bg-surface.border.border-hairline.rounded-2xl').nth(index)
  }

  async expandDay(index: number) {
    const card = this.getDayCard(index)
    await card.locator('button').first().click()
    await this.page.waitForTimeout(300)
  }

  async addMeal(index: number, mealType: 'main' | 'vegetable' | 'dessert', mealName: string) {
    const card = this.getDayCard(index)
    const mealSection = card.locator('button:has-text("Món chính"), button:has-text("Món rau"), button:has-text("Tráng miệng")').filter({ hasText: this.getMealTypeLabel(mealType) })
    await mealSection.click()
    await this.page.waitForTimeout(200)

    const addBtn = card.locator('button:has-text("Thêm món")')
    await addBtn.click()
    await this.page.waitForSelector('input[placeholder="Nhập tên món..."]')
    await this.page.fill('input[placeholder="Nhập tên món..."]', mealName)
    await this.page.keyboard.press('Enter')
  }

  async save() {
    await this.saveBtn.click()
    await this.page.waitForLoadState('networkidle')
  }

  private getMealTypeLabel(type: 'main' | 'vegetable' | 'dessert'): string {
    const labels = { main: 'Món chính', vegetable: 'Món rau', dessert: 'Tráng miệng' }
    return labels[type]
  }
}