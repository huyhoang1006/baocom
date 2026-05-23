import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.usernameInput = page.getByTestId('username-input')
    this.passwordInput = page.getByTestId('password-input')
    this.submitButton = page.getByTestId('login-submit')
    this.errorMessage = page.getByTestId('login-error')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async getErrorMessage(): Promise<string> {
    const content = await this.errorMessage.textContent()
    return content ?? ''
  }
}