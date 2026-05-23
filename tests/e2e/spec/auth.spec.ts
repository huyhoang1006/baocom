import { test, expect } from '../fixtures/auth.fixtures'
import { LoginPage } from '../page-objects/LoginPage'

const BASE_URL = 'http://127.0.0.1:3000'

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('TC-AUTH-001: Valid admin login redirects to /admin/dashboard', async ({ authenticatedAdmin }) => {
    await loginPage.login('admin', 'admin123')
    await expect(authenticatedAdmin.page).toHaveURL(/\/admin\/dashboard/)
  })

  test('TC-AUTH-002: Valid employee login redirects to /dashboard', async ({ authenticatedEmployee }) => {
    await loginPage.login('john', 'pass123')
    await expect(authenticatedEmployee.page).toHaveURL(/\/dashboard/)
  })

  test('TC-AUTH-003: Invalid username shows error message', async ({ page }) => {
    await loginPage.login('invaliduser', 'admin123')
    await expect(loginPage.errorMessage).toHaveText('Sai tên đăng nhập hoặc mật khẩu')
  })

  test('TC-AUTH-004: Invalid password shows error message', async ({ page }) => {
    await loginPage.login('admin', 'wrongpassword')
    await expect(loginPage.errorMessage).toHaveText('Sai tên đăng nhập hoặc mật khẩu')
  })

  test('TC-AUTH-005: Missing fields show validation error', async ({ page }) => {
    await loginPage.submitButton.click()
    await expect(loginPage.errorMessage).toBeVisible()
  })

  test('TC-AUTH-006: Short password shows validation error about minimum length', async ({ page }) => {
    await loginPage.login('admin', '123')
    const errorText = await loginPage.getErrorMessage()
    expect(errorText).toContain('ít nhất 4 ký tự')
  })

  test('TC-AUTH-007: Logout clears session', async ({ authenticatedAdmin }) => {
    const { page } = authenticatedAdmin

    // Navigate to a protected page while authenticated
    await page.goto(`${BASE_URL}/admin/dashboard`)
    await expect(page).toHaveURL(/\/admin\/dashboard/)

    // Perform logout (navigate to logout endpoint or click logout button)
    await page.goto(`${BASE_URL}/api/auth/logout`)

    // Try to access protected route after logout
    await page.goto(`${BASE_URL}/admin/dashboard`)
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-008: Protected route redirects to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`)
    await expect(page).toHaveURL(/\/login/)
  })
})
