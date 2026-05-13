import { test, expect } from '@playwright/test'

// Helper to extract cookie from headers object
function getCookieHeader(headers: Record<string, string>): string {
  const cookies = headers['set-cookie'] || ''
  if (!cookies) return ''
  // Multiple Set-Cookie headers come as comma-separated values
  const cookieStrings = cookies.split(',').map(c => c.trim())
  return cookieStrings
    .map(c => c.split(';')[0]) // Get just the name=value part
    .filter(c => c.includes('='))
    .join('; ')
}

// TC-SEC-IDOR-001: User A Cannot Access User B's Registrations
test('TC-SEC-IDOR-001: User A Cannot Access User B\'s Registrations', async ({ browser }) => {
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()

  // Login as User A
  const loginA = await contextA.request.post('/api/auth/login', {
    data: { username: 'alice', password: 'pass123' },
  })
  expect(loginA.status()).toBe(200)
  const cookiesA = getCookieHeader(loginA.headers())

  // Login as User B
  const loginB = await contextB.request.post('/api/auth/login', {
    data: { username: 'john', password: 'pass123' },
  })
  expect(loginB.status()).toBe(200)
  const cookiesB = getCookieHeader(loginB.headers())

  // User B creates a registration
  const regB = await contextB.request.post('/api/registrations', {
    data: { date: '2026-05-20', status: 'eating' },
    headers: { Cookie: cookiesB },
  })
  expect(regB.status()).toBe(201)
  const regBId = (await regB.json()).registration?.id

  if (regBId) {
    // User A tries to access User B's registration
    const idorResponse = await contextA.request.get(`/api/registrations/${regBId}`, {
      headers: { Cookie: cookiesA },
    })
    // Should be filtered out or return 403
    expect(idorResponse.status()).toBe(403)
  }

  await contextA.close()
  await contextB.close()
})

// TC-SEC-IDOR-002: User A Cannot Modify User B's Registration
test('TC-SEC-IDOR-002: User A Cannot Modify User B\'s Registration', async ({ browser }) => {
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()

  // Setup both users
  const loginA = await contextA.request.post('/api/auth/login', {
    data: { username: 'alice', password: 'pass123' },
  })
  const cookiesA = getCookieHeader(loginA.headers())

  const loginB = await contextB.request.post('/api/auth/login', {
    data: { username: 'john', password: 'pass123' },
  })
  const cookiesB = getCookieHeader(loginB.headers())

  // User B creates registration
  const regB = await contextB.request.post('/api/registrations', {
    data: { date: '2026-05-21', status: 'eating' },
    headers: { Cookie: cookiesB },
  })
  expect(regB.status()).toBe(201)
  const regBId = (await regB.json()).registration?.id

  if (regBId) {
    // User A tries to modify
    const patchResponse = await contextA.request.patch(`/api/registrations/${regBId}`, {
      data: { status: 'not_eating' },
      headers: { Cookie: cookiesA },
    })
    expect(patchResponse.status()).toBe(403)
  }

  await contextA.close()
  await contextB.close()
})

// TC-SEC-IDOR-003: User A Cannot Delete User B's Registration
test('TC-SEC-IDOR-003: User A Cannot Delete User B\'s Registration', async ({ browser }) => {
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()

  const loginA = await contextA.request.post('/api/auth/login', {
    data: { username: 'alice', password: 'pass123' },
  })
  const cookiesA = getCookieHeader(loginA.headers())

  const loginB = await contextB.request.post('/api/auth/login', {
    data: { username: 'john', password: 'pass123' },
  })
  const cookiesB = getCookieHeader(loginB.headers())

  // User B creates registration
  const regB = await contextB.request.post('/api/registrations', {
    data: { date: '2026-05-22', status: 'eating' },
    headers: { Cookie: cookiesB },
  })
  expect(regB.status()).toBe(201)
  const regBId = (await regB.json()).registration?.id

  if (regBId) {
    // User A tries to delete
    const deleteResponse = await contextA.request.delete(`/api/registrations/${regBId}`, {
      headers: { Cookie: cookiesA },
    })
    expect(deleteResponse.status()).toBe(403)
  }

  await contextA.close()
  await contextB.close()
})

// TC-SEC-IDOR-004: Admin Can Access All Registrations
test('TC-SEC-IDOR-004: Admin Can Access All Registrations', async ({ browser }) => {
  const contextAdmin = await browser.newContext()
  const contextUser = await browser.newContext()

  // User creates registration
  const loginUser = await contextUser.request.post('/api/auth/login', {
    data: { username: 'john', password: 'pass123' },
  })
  const cookiesUser = getCookieHeader(loginUser.headers())

  const regUser = await contextUser.request.post('/api/registrations', {
    data: { date: '2026-05-23', status: 'eating' },
    headers: { Cookie: cookiesUser },
  })
  expect(regUser.status()).toBe(201)
  const regUserId = (await regUser.json()).registration?.id

  // Admin logs in
  const loginAdmin = await contextAdmin.request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  })
  const cookiesAdmin = getCookieHeader(loginAdmin.headers())

  // Admin should be able to access user's registration
  if (regUserId) {
    const adminAccess = await contextAdmin.request.get(`/api/registrations/${regUserId}`, {
      headers: { Cookie: cookiesAdmin },
    })
    expect(adminAccess.status()).toBe(200)
  }

  await contextAdmin.close()
  await contextUser.close()
})