import { test, expect } from '@playwright/test'

// Helper to extract cookie from Set-Cookie header
function extractCookie(headers: Record<string, string>): string {
  const cookies = headers['set-cookie'] || ''
  if (!cookies) return ''
  // Parse the cookie string and extract just the name=value part
  const cookieParts = cookies.split(',').map(c => c.trim())
  const tokenPart = cookieParts.find(p => p.startsWith('token='))
  if (tokenPart) {
    return tokenPart.split(';')[0]
  }
  return ''
}

// TC-E2E-007: API Login with Valid Credentials
test('TC-E2E-007: API Login with Valid Credentials', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })

  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body.user).toBeDefined()
  expect(body.user.role).toBe('admin')
  expect(body.user.username).toBe('admin')
})

// TC-E2E-008: API Login with Invalid Username
test('TC-E2E-008: API Login with Invalid Username', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: { username: 'nonexistent', password: 'any' },
  })

  expect(response.status()).toBe(401)
  const body = await response.json()
  expect(body.error).toBe('Invalid credentials')
})

// TC-E2E-009: API Login with Invalid Password
test('TC-E2E-009: API Login with Invalid Password', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'wrongpassword' },
  })

  expect(response.status()).toBe(401)
  const body = await response.json()
  expect(body.error).toBe('Invalid credentials')
})

// TC-E2E-010: API Login with Missing Fields
test('TC-E2E-010: API Login with Missing Fields', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: {},
  })

  expect(response.status()).toBe(400)
  const body = await response.json()
  expect(body.error).toBe('Missing username or password')
})

// TC-E2E-011: API Logout
test('TC-E2E-011: API Logout', async ({ request }) => {
  // Login first
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const headers = loginResponse.headers()
  const cookie = extractCookie(headers)

  // Logout
  const logoutResponse = await request.post('/api/auth/logout', {
    headers: { Cookie: cookie },
  })

  expect(logoutResponse.status()).toBe(200)
})

// TC-E2E-012: API Get Current User
test('TC-E2E-012: API Get Current User', async ({ request }) => {
  // Login first
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const headers = loginResponse.headers()
  const cookie = extractCookie(headers)

  // Get current user
  const meResponse = await request.get('/api/auth/me', {
    headers: { Cookie: cookie },
  })

  expect(meResponse.status()).toBe(200)
  const body = await meResponse.json()
  expect(body.user).toBeDefined()
  expect(body.user.username).toBe('admin')
})

// TC-E2E-013: API Get Profile Without Auth
test('TC-E2E-013: API Get Profile Without Auth', async ({ request }) => {
  const response = await request.get('/api/auth/me')

  expect(response.status()).toBe(401)
  const body = await response.json()
  expect(body.error).toBe('Unauthorized')
})

// TC-E2E-014: API Get Profile with Invalid Token
test('TC-E2E-014: API Get Profile with Invalid Token', async ({ request }) => {
  const response = await request.get('/api/auth/me', {
    headers: { Cookie: 'token=invalid_token' },
  })

  expect(response.status()).toBe(401)
  const body = await response.json()
  expect(body.error).toBe('Invalid token')
})