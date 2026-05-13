# Playwright E2E Tests for AUTH & LOGIN Flows
**Module:** Authentication
**Document ID:** BAOCOM-E2E-AUTH-001
**Version:** 1.0
**Date:** 2026-05-13

---

## 1. Overview

### 1.1 Scope
End-to-end tests for login page (`app/(auth)/login/page.tsx`) and auth API endpoints:
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### 1.2 Rate Limiter Configuration
- **Class:** `InMemoryRateLimiter`
- **Limit:** 5 failed attempts per IP
- **Window:** 15 minutes
- **Enforcement:** Blocks with `429 Too Many Requests` after 5th failure

### 1.3 Critical Finding
The login page (`app/(auth)/login/page.tsx`) uses **mock client-side logic** - it does NOT call the API endpoint. API tests and E2E tests require separate strategies.

---

## 2. Test Architecture

### 2.1 Page Objects Pattern

```
tests/e2e/
├── page-objects/
│   ├── LoginPage.ts           # Login page interactions
│   └── DashboardPage.ts       # Post-login page interactions
├── api/
│   ├── auth.api.ts            # Auth API helper functions
│   └── setup.ts               # Test data setup
├── fixtures/
│   └── auth.fixtures.ts        # Auth state fixtures
└── auth-flows.spec.ts         # Main test file
```

### 2.2 LoginPage Page Object

```typescript
// tests/e2e/page-objects/LoginPage.ts
export class LoginPage {
  readonly usernameInput = page.locator('#username')
  readonly passwordInput = page.locator('#password')
  readonly submitButton = page.locator('button[type="submit"]')
  readonly errorMessage = page.locator('[role="alert"]')
  readonly forgotPasswordLink = page.locator('a[href="/forgot-password"]')

  async goto() {
    await page.goto('/login')
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
```

### 2.3 Auth API Helper

```typescript
// tests/e2e/api/auth.api.ts
export class AuthApi {
  async login(username: string, password: string, cookies?: string[]) {
    const response = await apiContext.post('/api/auth/login', {
      data: { username, password },
      headers: cookies ? { Cookie: cookies.join('; ') } : {}
    })
    return response
  }

  async logout(cookies: string[]) {
    return apiContext.post('/api/auth/logout', {
      headers: { Cookie: cookies.join('; ') }
    })
  }

  async me(cookies: string[]) {
    return apiContext.post('/api/auth/me', {
      headers: { Cookie: cookies.join('; ') }
    })
  }
}
```

---

## 3. Test Cases

### TC-E2E-001: Login with Valid Credentials (UI)
**Priority:** P0
**Type:** E2E UI Flow
**Estimated Time:** 8s

| Field | Value |
|-------|-------|
| Description | Verify user can login via UI and reach dashboard |
| Pre-condition | User exists: username=`admin`, password=`admin123` |
| Steps | 1. Navigate to `/login` |
| | 2. Enter username `admin` |
| | 3. Enter password `admin123` |
| | 4. Click submit button |
| | 5. Verify redirect to `/admin/dashboard` |
| Selectors | `#username`, `#password`, `button[type="submit"]` |
| Assertions | - URL contains `/admin/dashboard` |
| | - No error message displayed |
| Notes | UI mock validation - username containing "admin" redirects to admin dashboard |

---

### TC-E2E-002: Login with Non-Admin User (UI)
**Priority:** P0
**Type:** E2E UI Flow
**Estimated Time:** 8s

| Field | Value |
|-------|-------|
| Description | Non-admin user should redirect to regular dashboard |
| Pre-condition | User account with username=`john`, password=`pass123` |
| Steps | 1. Navigate to `/login` |
| | 2. Enter username `john` |
| | 3. Enter password `pass123` |
| | 4. Click submit |
| | 5. Verify redirect to `/dashboard` |
| Selectors | `#username`, `#password`, `button[type="submit"]` |
| Assertions | - URL contains `/dashboard` (not `/admin/dashboard`) |

---

### TC-E2E-003: Login with Invalid Password (UI)
**Priority:** P1
**Type:** E2E UI Validation
**Estimated Time:** 6s

| Field | Value |
|-------|-------|
| Description | UI should show error for short passwords |
| Pre-condition | None |
| Steps | 1. Navigate to `/login` |
| | 2. Enter username `admin` |
| | 3. Enter password `abc` (less than 4 chars) |
| | 4. Click submit |
| | 5. Verify error message appears |
| Selectors | `#username`, `#password`, `[role="alert"]` |
| Assertions | - Error message: "Mật khẩu phải có ít nhất 4 ký tự" |
| | - URL stays on `/login` |

---

### TC-E2E-004: Login with Empty Fields (UI)
**Priority:** P1
**Type:** E2E UI Validation
**Estimated Time:** 5s

| Field | Value |
|-------|-------|
| Description | Browser native validation prevents empty submit |
| Steps | 1. Navigate to `/login` |
| | 2. Leave both fields empty |
| | 3. Click submit |
| Selectors | `#username`, `#password` (both have `required` attribute) |
| Assertions | - Browser shows validation popup |
| | - No network request made |

---

### TC-E2E-005: UI Loading State
**Priority:** P2
**Type:** UI UX
**Estimated Time:** 5s

| Field | Value |
|-------|-------|
| Description | Submit button should show loading state during navigation |
| Steps | 1. Navigate to `/login` |
| | 2. Enter valid credentials |
| | 3. Click submit |
| | 4. Immediately check button state |
| Selectors | `button[type="submit"]` |
| Assertions | - Button shows press effect (`.press-effect` class) during click |
| | - No spinner (mock navigation is instant) |

---

### TC-E2E-006: Forgot Password Link
**Priority:** P2
**Type:** UI Navigation
**Estimated Time:** 4s

| Field | Value |
|-------|-------|
| Description | Forgot password link navigates correctly |
| Steps | 1. Navigate to `/login` |
| | 2. Click "Quên mật khẩu?" link |
| Selectors | `a[href="/forgot-password"]` |
| Assertions | - Navigates to `/forgot-password` |

---

### TC-E2E-007: API Login with Valid Credentials
**Priority:** P0
**Type:** API E2E
**Estimated Time:** 6s

| Field | Value |
|-------|-------|
| Description | API returns user data and sets token cookie |
| Pre-condition | User in database: username=`admin`, password=`admin123` |
| Steps | 1. POST `/api/auth/login` with `{"username": "admin", "password": "admin123"}` |
| Expected Response | `200 OK` |
| Response Body | `{"user": {"id": "...", "username": "admin", "name": "...", "role": "admin"}}` |
| Cookies | `token` cookie set with `httpOnly`, `sameSite: lax`, `maxAge: 604800` |
| Assertions | - `token` cookie exists |
| | - `user.role` = "admin" |

---

### TC-E2E-008: API Login with Invalid Username
**Priority:** P1
**Type:** API Security
**Estimated Time:** 5s

| Field | Value |
|-------|-------|
| Description | API returns 401 for non-existent user |
| Steps | 1. POST `/api/auth/login` with `{"username": "nonexistent", "password": "any"}` |
| Expected Response | `401 Unauthorized` |
| Response Body | `{"error": "Invalid credentials"}` |
| Assertions | - No token cookie set |
| | - Response time < 500ms |

---

### TC-E2E-009: API Login with Invalid Password
**Priority:** P1
**Type:** API Security
**Estimated Time:** 5s

| Field | Value |
|-------|-------|
| Description | API returns 401 for wrong password |
| Pre-condition | User exists with password=`admin123` |
| Steps | 1. POST `/api/auth/login` with `{"username": "admin", "password": "wrongpassword"}` |
| Expected Response | `401 Unauthorized` |
| Response Body | `{"error": "Invalid credentials"}` |
| Assertions | - No token cookie set |

---

### TC-E2E-010: API Login with Missing Fields
**Priority:** P1
**Type:** API Validation
**Estimated Time:** 5s

| Field | Value |
|-------|-------|
| Description | API validates required fields |
| Steps | 1. POST `/api/auth/login` with `{}` |
| Expected Response | `400 Bad Request` |
| Response Body | `{"error": "Missing username or password"}` |
| Assertions | - No token cookie set |

---

### TC-E2E-011: API Logout
**Priority:** P0
**Type:** API E2E
**Estimated Time:** 6s

| Field | Value |
|-------|-------|
| Description | Logout clears token cookie |
| Pre-condition | User logged in with valid token |
| Steps | 1. Login to get token cookie |
| | 2. POST `/api/auth/logout` with token cookie |
| Expected Response | `200 OK` |
| Assertions | - `token` cookie cleared (deleted) |
| | - `Set-Cookie: token=; Max-Age=0` or similar |

---

### TC-E2E-012: API Get Current User
**Priority:** P0
**Type:** API E2E
**Estimated Time:** 6s

| Field | Value |
|-------|-------|
| Description | Authenticated user can fetch their profile |
| Pre-condition | User logged in with valid token |
| Steps | 1. Login to get token cookie |
| | 2. GET `/api/auth/me` with token cookie |
| Expected Response | `200 OK` |
| Response Body | `{"user": {"id": "...", "username": "...", "name": "...", "role": "..."}}` |
| Assertions | - `user.id` matches logged-in user |

---

### TC-E2E-013: API Get Profile Without Auth
**Priority:** P1
**Type:** API Security
**Estimated Time:** 5s

| Field | Value |
|-------|-------|
| Description | Unauthenticated request rejected |
| Steps | 1. GET `/api/auth/me` without cookie |
| Expected Response | `401 Unauthorized` |
| Response Body | `{"error": "Unauthorized"}` |

---

### TC-E2E-014: API Get Profile with Invalid Token
**Priority:** P1
**Type:** API Security
**Estimated Time:** 5s

| Field | Value |
|-------|-------|
| Description | Invalid token rejected |
| Steps | 1. GET `/api/auth/me` with cookie `token=invalid_token` |
| Expected Response | `401 Unauthorized` |
| Response Body | `{"error": "Invalid token"}` |

---

### TC-E2E-015: Rate Limit After Failed Attempts
**Priority:** P0
**Type:** API Security
**Estimated Time:** 30s

| Field | Value |
|-------|-------|
| Description | Rate limiter blocks after 5 failed login attempts |
| Steps | 1. Attempt 5 failed logins with wrong password |
| | 2. On 6th attempt, send valid login |
| Input | username=`admin`, password=`wrong` (x5), then `admin123` |
| Expected Response (attempts 1-5) | `401 Unauthorized` |
| Expected Response (attempt 6) | `429 Too Many Requests` |
| Response Body | `{"error": "Too many failed attempts. Please try again after 15 minutes.", "retryAfter": ...}` |
| Assertions | - All 401 responses have no token cookie |
| | - 429 response blocked, no auth bypass |

---

### TC-E2E-016: Rate Limit Window Resets on Success
**Priority:** P1
**Type:** API Security
**Estimated Time:** 20s

| Field | Value |
|-------|-------|
| Description | Successful login resets failed attempt counter |
| Steps | 1. Fail login 3 times |
| | 2. Login successfully with valid credentials |
| | 3. Fail login 3 more times |
| | 4. Verify 6th attempt NOT blocked (counter reset) |
| Assertions | - 6th attempt returns `401`, not `429` (counter was reset) |

---

### TC-E2E-017: SQL Injection Prevention
**Priority:** P0
**Type:** Security
**Estimated Time:** 6s

| Field | Value |
|-------|-------|
| Description | SQL injection in username/password is sanitized |
| Steps | 1. POST `/api/auth/login` with payload `{"username": "' OR 1=1 --", "password": "any"}` |
| Expected Response | `401 Unauthorized` or `400 Bad Request` |
| Assertions | - No SQL error in response |
| | - No data leakage |
| | - Application does not crash |

---

### TC-E2E-018: XSS Prevention (UI)
**Priority:** P1
**Type:** Security
**Estimated Time:** 6s

| Field | Value |
|-------|-------|
| Description | XSS payloads in input fields are escaped |
| Steps | 1. Navigate to `/login` |
| | 2. Enter `<script>alert('xss')</script>` in username |
| | 3. Enter password `test1234` |
| | 4. Submit form |
| Assertions | - Page does not execute script |
| | - No alert popup |

---

### TC-E2E-019: Session Persistence (Cookie)
**Priority:** P0
**Type:** E2E Session
**Estimated Time:** 10s

| Field | Value |
|-------|-------|
| Description | Session persists across page reloads |
| Steps | 1. Login via API to get token |
| | 2. Reload page |
| | 3. Call GET `/api/auth/me` with persisted cookie |
| Assertions | - User remains authenticated after reload |
| | - Token cookie is not cleared on navigation |

---

### TC-E2E-020: Multiple Concurrent Sessions
**Priority:** P2
**Type:** Security
**Estimated Time:** 15s

| Field | Value |
|-------|-------|
| Description | Multiple browser contexts can maintain separate sessions |
| Steps | 1. Login as user A in context 1 |
| | 2. Login as user B in context 2 |
| | 3. Verify context 1 sees user A |
| | 4. Verify context 2 sees user B |
| Assertions | - Sessions are isolated |
| | - Tokens do not conflict |

---

## 4. Test Execution Matrix

| Test ID | Priority | Type | Estimated Time | Dependencies |
|---------|----------|------|----------------|--------------|
| TC-E2E-001 | P0 | UI E2E | 8s | - |
| TC-E2E-002 | P0 | UI E2E | 8s | - |
| TC-E2E-003 | P1 | UI Validation | 6s | - |
| TC-E2E-004 | P1 | UI Validation | 5s | - |
| TC-E2E-005 | P2 | UI UX | 5s | - |
| TC-E2E-006 | P2 | UI Navigation | 4s | - |
| TC-E2E-007 | P0 | API E2E | 6s | DB with user |
| TC-E2E-008 | P1 | API Security | 5s | - |
| TC-E2E-009 | P1 | API Security | 5s | DB with user |
| TC-E2E-010 | P1 | API Validation | 5s | - |
| TC-E2E-011 | P0 | API E2E | 6s | Login first |
| TC-E2E-012 | P0 | API E2E | 6s | Login first |
| TC-E2E-013 | P1 | API Security | 5s | - |
| TC-E2E-014 | P1 | API Security | 5s | - |
| TC-E2E-015 | P0 | API Security | 30s | - |
| TC-E2E-016 | P1 | API Security | 20s | DB with user |
| TC-E2E-017 | P0 | Security | 6s | - |
| TC-E2E-018 | P1 | Security | 6s | - |
| TC-E2E-019 | P0 | Session | 10s | - |
| TC-E2E-020 | P2 | Security | 15s | Two users |

**Total Estimated Time:** ~167 seconds (~2.8 minutes)

---

## 5. Test Setup Requirements

### 5.1 Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

### 5.2 Test Data Setup
```typescript
// tests/e2e/api/setup.ts
export async function setupTestUser() {
  // Create test user in DB via Prisma
  const user = await prisma.user.create({
    data: {
      username: 'testuser',
      password: await hashPassword('testpass123'),
      name: 'Test User',
      role: 'user',
      isActive: true
    }
  })
  return user
}
```

### 5.3 Required Environment Variables
```
DATABASE_URL=file:./dev.db
NODE_ENV=test
```

---

## 6. Test Execution Checklist

| Test ID | Description | Status | Executor | Date | Notes |
|---------|-------------|--------|----------|------|-------|
| TC-E2E-001 | Valid admin login | [ ] | | | |
| TC-E2E-002 | Non-admin login | [ ] | | | |
| TC-E2E-003 | Invalid password length | [ ] | | | |
| TC-E2E-004 | Empty fields | [ ] | | | |
| TC-E2E-005 | Loading state | [ ] | | | |
| TC-E2E-006 | Forgot password link | [ ] | | | |
| TC-E2E-007 | API valid login | [ ] | | | |
| TC-E2E-008 | API invalid username | [ ] | | | |
| TC-E2E-009 | API invalid password | [ ] | | | |
| TC-E2E-010 | API missing fields | [ ] | | | |
| TC-E2E-011 | API logout | [ ] | | | |
| TC-E2E-012 | API get profile | [ ] | | | |
| TC-E2E-013 | API no auth | [ ] | | | |
| TC-E2E-014 | API invalid token | [ ] | | | |
| TC-E2E-015 | Rate limit enforcement | [ ] | | | |
| TC-E2E-016 | Rate limit reset | [ ] | | | |
| TC-E2E-017 | SQL injection | [ ] | | | |
| TC-E2E-018 | XSS prevention | [ ] | | | |
| TC-E2E-019 | Session persistence | [ ] | | | |
| TC-E2E-020 | Concurrent sessions | [ ] | | | |

---

## 7. Summary

- **Total Test Cases:** 20
- **P0 (Critical):** 8
- **P1 (High):** 8
- **P2 (Medium):** 4
- **Total Estimated Time:** ~167 seconds

### Coverage Areas
| Area | Test Count |
|------|------------|
| UI Login Flow | 4 |
| API Login | 4 |
| API Logout/Me | 2 |
| Rate Limiting | 2 |
| Security (SQL/XSS) | 2 |
| Session Management | 2 |
| UI Validation | 4 |