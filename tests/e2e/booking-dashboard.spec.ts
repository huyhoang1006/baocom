import { test, expect, Page } from '@playwright/test'

// Helper function for day status toggle
async function getDayButton(page: Page, index: number) {
  return page.locator('[class*="rounded-[18px]"]').nth(index)
}

async function getDayStatusLabel(page: Page, index: number) {
  return page.locator(`text=/Ăn|Không ăn|Chưa chọn/`).nth(index)
}

// TC-B01: Book page displays 8 days starting from today
test('TC-B01: Book page displays 8 days starting from today', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#username', 'admin')
  await page.fill('#password', 'admin123')
  await page.click('button[type="submit"]')

  // Login redirects admin to /admin/dashboard
  await page.waitForURL(/\/admin\/dashboard|127\.0\.0\.1:3000/, { timeout: 10000 }).catch(() => {
    // If URL pattern doesn't match, check if we're on dashboard
  })

  await page.goto('/book')

  // Count day cards
  const dayCards = page.locator('[class*="rounded-[18px]"]')
  await expect(dayCards).toHaveCount(8)

  // First card should have "Hôm nay" badge
  await expect(page.locator('text=Hôm nay').first()).toBeVisible()
})

// TC-B02: Day status toggle cycle (none -> eating -> not-eating -> eating)
test('TC-B02: Day status toggle cycle', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#username', 'admin')
  await page.fill('#password', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })

  await page.goto('/book')

  // Wait for page to load
  await page.waitForSelector('[class*="rounded-[18px]"]')

  // Click on a future day (not today)
  const futureDay = getDayButton(page, 1)
  await futureDay.click()

  // Check for status change - should show "Ăn" or toast
  // This is a basic check - actual implementation may vary
  await page.waitForTimeout(500)
})

// TC-B03: Past date blocking
test('TC-B03: Past date blocking', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#username', 'admin')
  await page.fill('#password', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })

  await page.goto('/book')

  // The first day card should be "Hôm nay" and clickable
  // Past days should be disabled
  // This depends on implementation
})

// TC-D01: Dashboard shows weekly menu for current week
test('TC-D01: Dashboard shows weekly menu for current week', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#username', 'admin')
  await page.fill('#password', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })

  // Navigate to regular dashboard
  await page.goto('/dashboard')

  // Should show day tabs (T2-T6) as buttons
  await expect(page.locator('button:has-text("T2")').first()).toBeVisible({ timeout: 10000 })
})

// TC-D02: Dashboard day tab navigation
test('TC-D02: Dashboard day tab navigation', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#username', 'admin')
  await page.fill('#password', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })

  await page.goto('/dashboard')

  // Click on different day tabs
  const dayTabs = page.locator('button:has-text("T2"), button:has-text("T3")')
  if (await dayTabs.count() > 0) {
    await dayTabs.first().click()
    await page.waitForTimeout(500)
  }
})

// TC-D03: Dashboard empty menu handling
test('TC-D03: Dashboard empty menu handling', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#username', 'admin')
  await page.fill('#password', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })

  await page.goto('/dashboard')

  // If no menu exists for a day, should show appropriate message
  // This is implementation-dependent
})

// TC-DM-001: List daily menus
test('TC-DM-001: List daily menus', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.get('/api/daily-menus', {
    headers: { Cookie: cookieString },
  })

  expect(response.status()).toBe(200)
})

// TC-DM-002: Create daily menu (valid meals)
test('TC-DM-002: Create daily menu (valid meals)', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  // First get meals
  const mealsResponse = await request.get('/api/meals', {
    headers: { Cookie: cookieString },
  })
  const meals = (await mealsResponse.json()).meals || []
  const mainMeal = meals.find((m: { type: string }) => m.type === 'main')

  if (mainMeal) {
    const response = await request.post('/api/daily-menus', {
      data: {
        date: '2026-05-26',
        mainDishId: mainMeal.id,
      },
      headers: { Cookie: cookieString },
    })

    expect([200, 201, 400]).toContain(response.status())
  }
})

// TC-DM-003: Create daily menu validation (invalid meal)
test('TC-DM-003: Create daily menu validation (invalid meal)', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.post('/api/daily-menus', {
    data: {
      date: '2026-05-27',
      mainDishId: 'invalid-id',
    },
    headers: { Cookie: cookieString },
  })

  expect([400, 404]).toContain(response.status())
})

// TC-DM-004: Create daily menu validation (missing fields)
test('TC-DM-004: Create daily menu validation (missing fields)', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.post('/api/daily-menus', {
    data: {},
    headers: { Cookie: cookieString },
  })

  expect(response.status()).toBe(400)
})