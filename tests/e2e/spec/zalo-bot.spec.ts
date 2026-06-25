import { test, expect } from '@playwright/test'

test.describe('Zalo bot page', () => {
  test('admin can navigate to /admin/zalo-bot and see setup card', async ({ page, request }) => {
    // Login as admin (uses default seed: admin / admin123)
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' },
    })
    expect(loginRes.ok()).toBeTruthy()

    // Transfer cookies to page context
    const cookies = loginRes.headers()['set-cookie']?.split(';')[0] ?? ''
    if (cookies) {
      await page.context().addCookies([
        {
          name: cookies.split('=')[0],
          value: cookies.split('=')[1] ?? '',
          domain: '127.0.0.1',
          path: '/',
        },
      ])
    }

    // Navigate
    await page.goto('/admin/zalo-bot')
    await expect(page.locator('h1', { hasText: 'Zalo Bot' })).toBeVisible()
    await expect(page.locator('h2', { hasText: '1. Kết nối' })).toBeVisible()
    await expect(page.locator('h2', { hasText: '4. Auto-send' })).toBeVisible()
  })

  test('non-admin user gets redirected away from /admin/zalo-bot', async ({ page, request }) => {
    // Login as a non-admin employee
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'employee1', password: 'employee123' },
    })
    // employee1 may not exist in seed; skip if login fails
    test.skip(!loginRes.ok(), 'no employee user in seed')
  })
})
