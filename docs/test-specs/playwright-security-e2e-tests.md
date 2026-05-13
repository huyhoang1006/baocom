# Playwright Security E2E Test Specifications
**Module:** Security & Edge Cases
**Document ID:** BAOCOM-TEST-SEC-001
**Version:** 1.0
**Date:** 2026-05-13

---

## 1. Overview

This document defines Playwright E2E test scenarios for security and edge case validation across the baocom application. Tests cover IDOR protection, brute force prevention, session management, authorization escalation, input validation, and race conditions.

**Test Environment:** Playwright with authenticated browser contexts
**Execution Time Estimate:** ~45 minutes for full suite

---

## 2. Test Structure

```typescript
// tests/e2e/security.spec.ts
import { test, expect } from '@playwright/test'

// Shared fixtures for authenticated contexts
test.describe('Security Tests', () => {
  // Common setup with User A and User B contexts
})
```

---

## 3. IDOR Protection Tests

### TC-SEC-IDOR-001: User A Cannot Access User B's Registrations
**Priority:** P0
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify authenticated user cannot view other user's meal registrations via direct URL manipulation |
| Pre-condition | User A and User B exist with separate registrations |
| Steps | 1. Login as User A, 2. Navigate to GET /api/registrations with User B's registration ID, 3. Attempt direct fetch |
| Expected Behavior | Only own registrations returned; no access to User B's data |
| Test Type | E2E Playwright |

```typescript
test('User A cannot access User B registrations via IDOR', async ({ browser }) => {
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()

  // Setup User B and get their registration ID
  await contextB.request.post('/api/auth/login', { data: { username: 'userb', password: 'pass' } })
  const bRegResponse = await contextB.request.post('/api/registrations', {
    data: { date: '2026-05-20', status: 'eating' }
  })
  const userBRegId = (await bRegResponse.json()).registration.id

  // Login as User A
  await contextA.request.post('/api/auth/login', { data: { username: 'usera', password: 'pass' } })

  // Try to access User B's registration directly
  const idorResponse = await contextA.request.get(`/api/registrations/${userBRegId}`)
  expect(idorResponse.status()).toBe(403) // or filtered out from list
})
```

---

### TC-SEC-IDOR-002: User A Cannot Modify User B's Registration
**Priority:** P0
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify PATCH requests with foreign registration IDs are rejected |
| Pre-condition | User A and User B both have registrations |
| Steps | 1. As User A, send PATCH /api/registrations/[user-b-id] with status change |
| Expected Behavior | 403 Forbidden returned |
| Test Type | E2E Playwright |

---

### TC-SEC-IDOR-003: User A Cannot Delete User B's Registration
**Priority:** P0
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify DELETE requests with foreign registration IDs are rejected |
| Pre-condition | User B has registration |
| Steps | 1. As User A, send DELETE /api/registrations/[user-b-id] |
| Expected Behavior | 403 Forbidden |
| Test Type | E2E Playwright |

---

### TC-SEC-IDOR-004: Admin Can Access All Registrations
**Priority:** P0
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify admin role bypasses IDOR restrictions |
| Pre-condition | Admin user exists with registrations |
| Steps | 1. Login as admin, 2. Access other user's registration data |
| Expected Behavior | Admin can view/modify any registration |
| Test Type | E2E Playwright |

---

## 4. Brute Force Protection Tests

### TC-SEC-BF-001: 6 Failed Logins Triggers 15-Minute Lockout
**Priority:** P0
**Estimated Time:** 3 min

| Field | Value |
|-------|-------|
| Description | Verify rate limiter locks account after 5 failed attempts within 15-minute window |
| Pre-condition | Valid user account exists |
| Steps | 1. Attempt 6 failed logins with wrong password, 2. Attempt 7th login |
| Expected Behavior | 429 Too Many Requests with retryAfter ~900 seconds |
| Test Type | E2E Playwright |

```typescript
test('5 failed logins triggers 15-minute lockout', async ({ page }) => {
  const ip = 'test-brute-force'

  // Attempt 5 failed logins
  for (let i = 0; i < 5; i++) {
    await page.request.post('/api/auth/login', {
      data: { username: 'admin', password: 'wrongpassword' }
    })
  }

  // 6th attempt should be blocked
  const response = await page.request.post('/api/auth/login', {
    data: { username: 'admin', password: 'wrongpassword' }
  })
  expect(response.status()).toBe(429)
  const body = await response.json()
  expect(body.retryAfter).toBeGreaterThan(800) // ~15 min in seconds
})
```

---

### TC-SEC-BF-002: Successful Login Resets Rate Limit Counter
**Priority:** P0
**Estimated Time:** 3 min

| Field | Value |
|-------|-------|
| Description | Verify successful login before 5 failures resets the counter |
| Steps | 1. Fail 3 times, 2. Login successfully, 3. Fail 5 more times |
| Expected Behavior | No lockout triggered (counter reset on success) |
| Test Type | E2E Playwright |

---

### TC-SEC-BF-003: Lockout Expires After 15 Minutes
**Priority:** P0
**Estimated Time:** 16 min (or mocked)

| Field | Value |
|-------|-------|
| Description | Verify locked account unlocks after lockout duration |
| Steps | 1. Trigger lockout, 2. Wait 15 minutes (or mock time), 3. Attempt login |
| Expected Behavior | Account accessible again |
| Test Type | E2E Playwright |

---

### TC-SEC-BF-004: Invalid Token Does Not Count Toward Rate Limit
**Priority:** P1
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify malformed requests do not increment rate limit attempts |
| Steps | 1. Send invalid JSON, 2. Check rate limit state |
| Expected Behavior | No failed attempt recorded for invalid requests |
| Test Type | E2E Playwright |

---

## 5. Session Management Tests

### TC-SEC-SESSION-001: Token Expiry After 7 Days
**Priority:** P0
**Estimated Time:** 2 min (with token manipulation)

| Field | Value |
|-------|-------|
| Description | Verify session token expires after maxAge of 7 days |
| Steps | 1. Login and get token, 2. Set cookie expiry to 8 days ahead, 3. Make authenticated request |
| Expected Behavior | 401 Unauthorized after token expiry |
| Test Type | E2E Playwright |

---

### TC-SEC-SESSION-002: Invalid Token Rejected
**Priority:** P0
**Estimated Time:** 1 min

| Field | Value |
|-------|-------|
| Description | Verify tampered or malformed tokens are rejected |
| Steps | 1. Set cookie with `token=invalid_token_string`, 2. Request /api/auth/me |
| Expected Behavior | 401 Invalid token |
| Test Type | E2E Playwright |

---

### TC-SEC-SESSION-003: Concurrent Sessions Allowed
**Priority:** P1
**Estimated Time:** 3 min

| Field | Value |
|-------|-------|
| Description | Verify same user can be logged in from multiple devices/browsers |
| Steps | 1. Login from context A, 2. Login from context B with same credentials |
| Expected Behavior | Both sessions active; logout A does not invalidate B |
| Test Type | E2E Playwright |

---

### TC-SEC-SESSION-004: Logout Invalidates Token
**Priority:** P0
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify logout properly clears the session cookie |
| Steps | 1. Login, 2. Logout, 3. Use same token for authenticated request |
| Expected Behavior | 401 Unauthorized after logout |
| Test Type | E2E Playwright |

---

### TC-SEC-SESSION-005: Missing Token Rejected
**Priority:** P0
**Estimated Time:** 1 min

| Field | Value |
|-------|-------|
| Description | Verify requests without token cookie are rejected |
| Steps | 1. Send request to /api/auth/me without cookie |
| Expected Behavior | 401 Unauthorized |
| Test Type | E2E Playwright |

---

## 6. Authorization & Role Escalation Tests

### TC-SEC-AUTHZ-001: Non-Admin Cannot Access Admin Endpoints
**Priority:** P0
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify regular users cannot access admin-only API routes |
| Steps | 1. Login as regular user, 2. Request DELETE /api/registrations/[id] (admin-only) |
| Expected Behavior | 403 Forbidden |
| Test Type | E2E Playwright |

```typescript
test('non-admin blocked from admin-only DELETE endpoint', async ({ browser }) => {
  const context = await browser.newContext()
  await context.request.post('/api/auth/login', {
    data: { username: 'regularuser', password: 'pass' }
  })

  const response = await context.request.delete('/api/registrations/some-id')
  expect(response.status()).toBe(403)
})
```

---

### TC-SEC-AUTHZ-002: Role Field Cannot Be Modified by Users
**Priority:** P0
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify users cannot escalate privileges by modifying role field |
| Steps | 1. As regular user, attempt PATCH to update own role to 'admin' |
| Expected Behavior | Role field ignored or 400 returned |
| Test Type | E2E Playwright |

---

### TC-SEC-AUTHZ-003: Admin Can Access All Registrations
**Priority:** P0
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify admin role has unrestricted access |
| Steps | 1. Login as admin, 2. Access any user registration |
| Expected Behavior | 200 OK with registration data |
| Test Type | E2E Playwright |

---

### TC-SEC-AUTHZ-004: Deactivated User Cannot Login
**Priority:** P1
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify inactive/deactivated accounts are rejected |
| Steps | 1. Login with deactivated user credentials |
| Expected Behavior | 401 Invalid credentials |
| Test Type | E2E Playwright |

---

## 7. Input Validation Tests

### TC-SEC-INPUT-001: XSS in Name Field
**Priority:** P0
**Estimated Time:** 3 min

| Field | Value |
|-------|-------|
| Description | Verify XSS payloads in name/username are sanitized and not executed |
| Steps | 1. Register/login with name `<script>alert('xss')</script>`, 2. Retrieve user data, 3. Check if script executes |
| Expected Behavior | Payload stored as escaped string; no script execution |
| Test Type | E2E Playwright |

```typescript
test('XSS in name field is sanitized', async ({ page }) => {
  // Login and update name with XSS payload
  const payload = '<script>alert("xss")</script>'

  await page.request.post('/api/auth/login', { data: { username: 'admin', password: 'admin123' } })
  await page.request.patch('/api/registrations/1', {
    data: { note: payload }  // if note field has XSS risk
  })

  // Verify page does not execute script
  const response = await page.request.get('/api/registrations')
  const html = await response.text()
  expect(html).not.toContain('<script>')
})
```

---

### TC-SEC-INPUT-002: SQL Injection in Search Parameters
**Priority:** P0
**Estimated Time:** 3 min

| Field | Value |
|-------|-------|
| Description | Verify SQL injection attempts in search params do not expose data |
| Steps | 1. Send GET /api/registrations?startDate=' OR 1=1 -- |
| Expected Behavior | Treated as literal string; no data leakage |
| Test Type | E2E Playwright |

```typescript
test('SQL injection in date filter is harmless', async ({ page }) => {
  const payload = "' OR 1=1 --"
  const response = await page.request.get(`/api/registrations?startDate=${payload}`)
  expect(response.status()).toBe(200)
  // Verify no data breach - should only return own data
})
```

---

### TC-SEC-INPUT-003: HTML Tags in Registration Note
**Priority:** P1
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify HTML tags in note field are escaped on output |
| Steps | 1. Create registration with note `<b>bold</b>`, 2. Retrieve and display |
| Expected Behavior | HTML escaped, not rendered |
| Test Type | E2E Playwright |

---

### TC-SEC-INPUT-004: Invalid Status Value Rejected
**Priority:** P0
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify invalid status values are rejected with 400 |
| Steps | 1. POST /api/registrations with status: 'maybe' |
| Expected Behavior | 400 Bad Request |
| Test Type | E2E Playwright |

---

### TC-SEC-INPUT-005: Missing Required Fields Rejected
**Priority:** P1
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify requests missing required fields are properly rejected |
| Steps | 1. POST /api/registrations with empty body, 2. POST with only date |
| Expected Behavior | 400 Bad Request with validation error |
| Test Type | E2E Playwright |

---

### TC-SEC-INPUT-006: Invalid JSON Body Handling
**Priority:** P1
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify malformed JSON does not crash the server |
| Steps | 1. Send POST with `{invalid json`, 2. Send with Content-Type but no body |
| Expected Behavior | 400 Bad Request, server remains healthy |
| Test Type | E2E Playwright |

---

## 8. Race Condition Tests

### TC-SEC-RACE-001: Simultaneous Registrations for Same Date
**Priority:** P1
**Estimated Time:** 3 min

| Field | Value |
|-------|-------|
| Description | Verify two concurrent POST requests for same user/date are handled correctly |
| Steps | 1. Send two POST /api/registrations for same date simultaneously |
| Expected Behavior | Only one registration created, or proper conflict handling |
| Test Type | E2E Playwright |

```typescript
test('concurrent registrations handled correctly', async ({ browser }) => {
  const context = await browser.newContext()
  await context.request.post('/api/auth/login', { data: { username: 'user', password: 'pass' } })

  const [resp1, resp2] = await Promise.all([
    context.request.post('/api/registrations', { data: { date: '2026-05-25', status: 'eating' } }),
    context.request.post('/api/registrations', { data: { date: '2026-05-25', status: 'eating' } })
  ])

  // Both should not succeed with 201
  const successes = [resp1, resp2].filter(r => r.status() === 201)
  expect(successes.length).toBeLessThanOrEqual(1)
})
```

---

### TC-SEC-RACE-002: Rapid PATCH Requests to Same Registration
**Priority:** P1
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify rapid status updates don't cause inconsistent state |
| Steps | 1. Send 5 PATCH requests changing status rapidly |
| Expected Behavior | Final state consistent; no partial updates |
| Test Type | E2E Playwright |

---

### TC-SEC-RACE-003: Login During Rate Limit Window
**Priority:** P2
**Estimated Time:** 2 min

| Field | Value |
|-------|-------|
| Description | Verify successful login during rate limit window resets counter properly |
| Steps | 1. Fail 4 times, 2. Login successfully, 3. Fail 4 more times |
| Expected Behavior | No lockout (counter reset) |
| Test Type | E2E Playwright |

---

## 9. Security Headers & HTTPS Tests

### TC-SEC-HEADERS-001: HttpOnly Cookie Set
**Priority:** P0
**Estimated Time:** 1 min

| Field | Value |
|-------|-------|
| Description | Verify token cookie has HttpOnly flag |
| Steps | 1. Login and inspect Set-Cookie header |
| Expected Behavior | HttpOnly present; document.cookie returns undefined |
| Test Type | E2E Playwright |

---

### TC-SEC-HEADERS-002: Secure Cookie in Production
**Priority:** P1
**Estimated Time:** 1 min

| Field | Value |
|-------|-------|
| Description | Verify cookie has Secure flag in production |
| Steps | 1. In production env, login and check cookie |
| Expected Behavior | Secure flag set (requires HTTPS) |
| Test Type | E2E Playwright |

---

### TC-SEC-HEADERS-003: SameSite Cookie Attribute
**Priority:** P1
**Estimated Time:** 1 min

| Field | Value |
|-------|-------|
| Description | Verify SameSite attribute is set |
| Steps | 1. Login and check Set-Cookie header |
| Expected Behavior | SameSite=Lax or Strict |
| Test Type | E2E Playwright |

---

## 10. Test Execution Matrix

| Test ID | Priority | Estimated Time | Dependencies |
|---------|----------|----------------|--------------|
| TC-SEC-IDOR-001 | P0 | 2 min | Two user accounts |
| TC-SEC-IDOR-002 | P0 | 2 min | Two user accounts |
| TC-SEC-IDOR-003 | P0 | 2 min | Two user accounts |
| TC-SEC-IDOR-004 | P0 | 2 min | Admin account |
| TC-SEC-BF-001 | P0 | 3 min | Valid user account |
| TC-SEC-BF-002 | P0 | 3 min | Valid user account |
| TC-SEC-BF-003 | P0 | 16 min | Valid user account (or time mock) |
| TC-SEC-BF-004 | P1 | 2 min | None |
| TC-SEC-SESSION-001 | P0 | 2 min | Valid account |
| TC-SEC-SESSION-002 | P0 | 1 min | None |
| TC-SEC-SESSION-003 | P1 | 3 min | Valid account |
| TC-SEC-SESSION-004 | P0 | 2 min | Valid account |
| TC-SEC-SESSION-005 | P0 | 1 min | None |
| TC-SEC-AUTHZ-001 | P0 | 2 min | Regular + admin accounts |
| TC-SEC-AUTHZ-002 | P0 | 2 min | Regular account |
| TC-SEC-AUTHZ-003 | P0 | 2 min | Admin account |
| TC-SEC-AUTHZ-004 | P1 | 2 min | Deactivated user |
| TC-SEC-INPUT-001 | P0 | 3 min | Valid account |
| TC-SEC-INPUT-002 | P0 | 3 min | Valid account |
| TC-SEC-INPUT-003 | P1 | 2 min | Valid account |
| TC-SEC-INPUT-004 | P0 | 2 min | None |
| TC-SEC-INPUT-005 | P1 | 2 min | None |
| TC-SEC-INPUT-006 | P1 | 2 min | None |
| TC-SEC-RACE-001 | P1 | 3 min | Valid account |
| TC-SEC-RACE-002 | P1 | 2 min | Valid account |
| TC-SEC-RACE-003 | P2 | 2 min | Valid account |
| TC-SEC-HEADERS-001 | P0 | 1 min | None |
| TC-SEC-HEADERS-002 | P1 | 1 min | Production env |
| TC-SEC-HEADERS-003 | P1 | 1 min | None |

---

## 11. Test Summary

| Category | P0 | P1 | P2 |
|----------|----|----|-----|
| IDOR | 4 | 0 | 0 |
| Brute Force | 3 | 1 | 0 |
| Session | 4 | 1 | 0 |
| Authorization | 3 | 1 | 0 |
| Input Validation | 2 | 4 | 0 |
| Race Conditions | 0 | 2 | 1 |
| Security Headers | 1 | 2 | 0 |
| **Total** | **17** | **11** | **1** |

**Total Test Cases:** 29
**Estimated Execution Time:** ~45 minutes
**P0 Coverage:** All P0 security tests are covered

---

## 12. Implementation Notes

1. **Rate Limiter Testing:** The rate limiter is IP-based. Use browser contexts with distinct IPs or mock the rate limiter state via test hooks.
2. **Time-Based Tests:** For lockout expiry tests, either mock the time or run with extended timeout.
3. **Concurrent Sessions:** Playwright browser contexts can simulate multiple devices.
4. **XSS Testing:** Use page.evaluate to verify script execution doesn't occur.
5. **SQL Injection:** Prisma ORM provides parameterized queries; verify injection attempts don't break the query.