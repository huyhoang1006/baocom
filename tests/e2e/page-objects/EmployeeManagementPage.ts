import { Page, Locator } from '@playwright/test'

export class EmployeeManagementPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly addEmployeeBtn: Locator
  readonly employeeTable: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.locator('input[placeholder="Tìm kiếm..."]')
    this.addEmployeeBtn = page.locator('button:has-text("Thêm nhân viên")')
    this.employeeTable = page.locator('table')
  }

  async goto() {
    await this.page.goto('/admin/employees')
    await this.page.waitForLoadState('networkidle')
  }

  async search(query: string) {
    await this.searchInput.fill(query)
  }

  async addEmployee(name: string) {
    await this.addEmployeeBtn.click()
    await this.page.waitForSelector('input[placeholder="Nhập họ và tên"]')
    await this.page.fill('input[placeholder="Nhập họ và tên"]', name)
    await this.page.locator('button:has-text("Thêm mới")').click()
  }

  getAddModal(): Locator {
    return this.page.locator('h2:has-text("Thêm nhân viên")')
  }
}