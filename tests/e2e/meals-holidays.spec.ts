import { test, expect } from '@playwright/test'

// TC-MEAL-001: List meals (authenticated)
test('TC-MEAL-001: List meals (authenticated)', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.get('/api/meals', {
    headers: { Cookie: cookieString },
  })

  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(Array.isArray(body.meals) || Array.isArray(body)).toBeTruthy()
})

// TC-MEAL-002: Create meal (admin)
test('TC-MEAL-002: Create meal (admin)', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.post('/api/meals', {
    data: { name: 'Test Meal', type: 'main' },
    headers: { Cookie: cookieString },
  })

  expect([200, 201, 400]).toContain(response.status())
})

// TC-MEAL-003: Create meal validation (missing fields)
test('TC-MEAL-003: Create meal validation (missing fields)', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.post('/api/meals', {
    data: {},
    headers: { Cookie: cookieString },
  })

  expect(response.status()).toBe(400)
})

// TC-MEAL-004: Create meal validation (invalid type)
test('TC-MEAL-004: Create meal validation (invalid type)', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.post('/api/meals', {
    data: { name: 'Test Meal', type: 'invalid_type' },
    headers: { Cookie: cookieString },
  })

  expect(response.status()).toBe(400)
})

// TC-MEAL-005: Admin-only create (non-admin blocked)
test('TC-MEAL-005: Admin-only create (non-admin blocked)', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'nguyenvana', password: 'employee123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.post('/api/meals', {
    data: { name: 'Test Meal', type: 'main' },
    headers: { Cookie: cookieString },
  })

  expect(response.status()).toBe(403)
})

// TC-MEAL-006: Admin-only create (unauthenticated blocked)
test('TC-MEAL-006: Admin-only create (unauthenticated blocked)', async ({ request }) => {
  const response = await request.post('/api/meals', {
    data: { name: 'Test Meal', type: 'main' },
  })

  expect(response.status()).toBe(401)
})

// TC-HOL-001: List holidays
test('TC-HOL-001: List holidays', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.get('/api/holidays', {
    headers: { Cookie: cookieString },
  })

  expect(response.status()).toBe(200)
})

// TC-HOL-002: Create holiday
test('TC-HOL-002: Create holiday', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.post('/api/holidays', {
    data: { date: '2026-06-01', name: 'Test Holiday' },
    headers: { Cookie: cookieString },
  })

  expect([200, 201, 400]).toContain(response.status())
})

// TC-HOL-003: Create holiday (date only, no description)
test('TC-HOL-003: Create holiday (date only, no description)', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.post('/api/holidays', {
    data: { date: '2026-06-02' },
    headers: { Cookie: cookieString },
  })

  // Should accept date only or return validation error
  expect([200, 201, 400]).toContain(response.status())
})

// TC-HOL-004: Create holiday validation (missing date)
test('TC-HOL-004: Create holiday validation (missing date)', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.post('/api/holidays', {
    data: { name: 'Test Holiday' },
    headers: { Cookie: cookieString },
  })

  expect(response.status()).toBe(400)
})

// TC-HOL-005: Admin-only holiday operations
test('TC-HOL-005: Admin-only holiday operations', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'nguyenvana', password: 'employee123' },
  })
  const cookies = loginResponse.headers()['set-cookie']
  const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies || ''

  const response = await request.post('/api/holidays', {
    data: { date: '2026-06-03', name: 'Test' },
    headers: { Cookie: cookieString },
  })

  expect(response.status()).toBe(403)
})