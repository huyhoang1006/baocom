import { test as base, Page, APIRequestContext } from '@playwright/test'

export interface User {
  username: string
  password: string
  role: string
}

export interface AuthContext {
  page: Page
  api: APIRequestContext
  user: User
  cookies: string[]
}

const TEST_USERS = {
  admin: { username: 'admin', password: 'admin123', role: 'admin' },
  employee: { username: 'john', password: 'pass123', role: 'employee' },
  manager: { username: 'alice', password: 'pass123', role: 'manager' },
} as const

export { TEST_USERS }

export const test = base.extend<{ authenticatedAdmin: AuthContext; authenticatedEmployee: AuthContext }>({
  authenticatedAdmin: async ({ browser }, use) => {
    const context = await browser.newContext()
    const api = context.request
    const page = await context.newPage()

    const response = await api.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' },
    })

    const cookies = response.headers()['set-cookie'] || ''
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies]

    await use({
      page,
      api,
      user: TEST_USERS.admin,
      cookies: cookieArray,
    })

    await context.close()
  },

  authenticatedEmployee: async ({ browser }, use) => {
    const context = await browser.newContext()
    const api = context.request
    const page = await context.newPage()

    const response = await api.post('/api/auth/login', {
      data: { username: 'john', password: 'pass123' },
    })

    const cookies = response.headers()['set-cookie'] || ''
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies]

    await use({
      page,
      api,
      user: TEST_USERS.employee,
      cookies: cookieArray,
    })

    await context.close()
  },
})

export { expect } from '@playwright/test'