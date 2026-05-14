# UAT: Authentication & Login Flows
**Project:** BaoCom    **Date:** 2026-05-14    **Type:** Black Box Acceptance Testing

---

## 1. System Overview

### Auth Architecture
- **Login API:** `POST /api/auth/login` — validates credentials, sets `token` cookie (httpOnly, 7-day expiry)
- **Logout API:** `POST /api/auth/logout` — clears `token` cookie
- **Session API:** `GET /api/auth/me` — returns current user from JWT payload
- **Middleware:** `withAuth` decorator protects routes; `withAdmin` requires admin role
- **Rate Limiter:** 5 attempts per 15 minutes; 15-minute lockout after threshold

### Supported Roles
| Role | Dashboard Route | Access Level |
|------|----------------|--------------|
| `admin` | `/admin/dashboard` | Full |
| `user` (default) | `/dashboard` | Standard |

---

## 2. Test Data Requirements

### Valid Credentials
| Username | Password | Role | Status |
|----------|----------|------|--------|
| `admin` | `admin123` | admin | Active |
| Any username containing `admin` | Valid password | admin | Active |
| `testuser` | `password` | user | Active |
| `inactive_user` | `password` | user | **Inactive** |

### Invalid Credentials
| Username | Password | Expected Error |
|----------|----------|-----------------|
| `nonexistent` | any | `Invalid credentials` |
| `admin` | `wrongpassword` | `Invalid credentials` |
| `` | any | `Missing username or password` |
| `admin` | `` | `Missing username or password` |
| `<script>` | `admin123` | `Invalid credentials` (sanitized via length check >255) |

---

## 3. Test Cases

### TC-UAT-001: Login with Valid Credentials
**Priority:** P0 | **Flow:** Login

**Pre-conditions:** User exists, is active, valid credentials known

**Steps:**
1. Navigate to `/login`
2. Enter valid username and password
3. Click "Đăng nhập"

**Expected Results:**
- HTTP 200 returned from `/api/auth/login`
- Response body contains `user` object with `id`, `username`, `name`, `role`
- `token` cookie set with httpOnly, sameSite=lax
- Page redirects to `/dashboard` (or `/admin/dashboard` if role=admin)
- Error message NOT displayed

**Pass Criteria:** User lands on correct dashboard; no error displayed

---

### TC-UAT-002: Login with Invalid Username
**Priority:** P0 | **Flow:** Login

**Steps:**
1. Navigate to `/login`
2. Enter nonexistent username
3. Enter any password
4. Click "Đăng nhập"

**Expected Results:**
- HTTP 401 returned
- Response: `{ "error": "Invalid credentials" }`
- Rate limit counter incremented
- Page displays error: "Sai tên đăng nhập hoặc mật khẩu"
- No redirect occurs

**Pass Criteria:** Error message visible; no session created

---

### TC-UAT-003: Login with Invalid Password
**Priority:** P0 | **Flow:** Login

**Steps:**
1. Navigate to `/login`
2. Enter valid username
3. Enter wrong password
4. Click "Đăng nhập"

**Expected Results:**
- HTTP 401 returned
- Response: `{ "error": "Invalid credentials" }`
- Rate limit counter incremented
- Page displays error: "Sai tên đăng nhập hoặc mật khẩu"

**Pass Criteria:** Error message visible; no session created

---

### TC-UAT-004: Login with Missing Username
**Priority:** P1 | **Flow:** Login

**Steps:**
1. Navigate to `/login`
2. Leave username empty
3. Enter any password
4. Click "Đăng nhập"

**Expected Results:**
- HTTP 400 returned
- Response: `{ "error": "Missing username or password" }`

**Pass Criteria:** Appropriate error returned before API call (client-side validation may block)

---

### TC-UAT-005: Login with Missing Password
**Priority:** P1 | **Flow:** Login

**Steps:**
1. Navigate to `/login`
2. Enter username
3. Leave password empty
4. Click "Đăng nhập"

**Expected Results:**
- HTTP 400 returned (if client validation passes)
- Response: `{ "error": "Missing username or password" }`

**UI Validation:** Client-side check shows "Mật khẩu phải có ít nhất 4 ký tự" if password < 4 chars

**Pass Criteria:** Error shown; no request to API with empty password

---

### TC-UAT-006: Login with Short Password (Client-Side Validation)
**Priority:** P2 | **Flow:** Login

**Steps:**
1. Navigate to `/login`
2. Enter username
3. Enter password with 1-3 characters
4. Click "Đăng nhập"

**Expected Results:**
- Client-side validation: "Mật khẩu phải có ít nhất 4 ký tự" displayed
- No API call made

**Pass Criteria:** Client blocks submission; no API request

---

### TC-UAT-007: Login with Inactive User
**Priority:** P0 | **Flow:** Login

**Steps:**
1. Login with user whose `isActive = false`
2. Submit valid credentials

**Expected Results:**
- HTTP 401 returned
- Response: `{ "error": "Invalid credentials" }`
- Same error as invalid credentials (timing attack mitigation)
- No session created

**Pass Criteria:** Inactive user cannot login; error does not reveal user exists

---

### TC-UAT-008: Login Rate Limiting — Approach Lockout Threshold
**Priority:** P0 | **Flow:** Login

**Pre-conditions:** No prior failed attempts from test IP

**Steps:**
1. Attempt login with wrong password 5 times in succession
2. Use invalid username on each attempt (to avoid account lockout confusion)

**Expected Results:**
- After 5th failed attempt: HTTP 429 returned
- Response: `{ "error": "Too many failed attempts. Please try again after 15 minutes.", "retryAfter": 900 }`
- Subsequent login attempts blocked for 15 minutes
- Rate limit resets on successful login

**Pass Criteria:** Lockout enforced; retry-after time returned

---

### TC-UAT-009: Login After Lockout Expires
**Priority:** P1 | **Flow:** Login

**Steps:**
1. Get locked out via 5 failed attempts
2. Wait 15 minutes (or verify lockout expired)
3. Attempt login with valid credentials

**Expected Results:**
- Lockout cleared
- Login succeeds if credentials valid

**Pass Criteria:** Previously locked user can login after lockout expires

---

### TC-UAT-010: Session Persistence — Valid Token
**Priority:** P0 | **Flow:** Session

**Steps:**
1. Login successfully; capture `token` cookie
2. Call `GET /api/auth/me` with `Cookie: token=<value>`

**Expected Results:**
- HTTP 200 returned
- Response: `{ "user": { "id", "username", "name", "role" } }`

**Pass Criteria:** Authenticated user data returned

---

### TC-UAT-011: Session Persistence — Missing Token
**Priority:** P0 | **Flow:** Session

**Steps:**
1. Call `GET /api/auth/me` without any cookies

**Expected Results:**
- HTTP 401 returned
- Response: `{ "error": "Unauthorized" }`

**Pass Criteria:** Unauthenticated request rejected

---

### TC-UAT-012: Session Persistence — Invalid Token
**Priority:** P0 | **Flow:** Session

**Steps:**
1. Call `GET /api/auth/me` with `Cookie: token=invalid_token_string`

**Expected Results:**
- HTTP 401 returned
- Response: `{ "error": "Invalid token" }`

**Pass Criteria:** Tampered token rejected

---

### TC-UAT-013: Session Persistence — Expired Token
**Priority:** P0 | **Flow:** Session

**Pre-conditions:** JWT configured with 7d expiry

**Steps:**
1. Obtain token with near-expiry or wait 7 days
2. Call `GET /api/auth/me` with expired cookie

**Expected Results:**
- HTTP 401 returned
- Response: `{ "error": "Invalid token" }` (JWT verification fails)

**Pass Criteria:** Expired token rejected; must re-login

---

### TC-UAT-014: Logout — Clears Session
**Priority:** P0 | **Flow:** Logout

**Steps:**
1. Login successfully
2. Call `POST /api/auth/logout` with token cookie

**Expected Results:**
- HTTP 200 returned
- `token` cookie set to empty with `maxAge=0`
- Subsequent call to `/api/auth/me` returns 401

**Pass Criteria:** Session terminated; token cookie cleared

---

### TC-UAT-015: Role-Based Routing — Admin Redirect
**Priority:** P0 | **Flow:** Login

**Steps:**
1. Login with user whose role is `admin`
2. Observe redirect destination

**Expected Results:**
- Redirects to `/admin/dashboard`

**Pass Criteria:** Admin lands on admin dashboard

---

### TC-UAT-016: Role-Based Routing — Regular User Redirect
**Priority:** P0 | **Flow:** Login

**Steps:**
1. Login with user whose role is `user` (default)
2. Observe redirect destination

**Expected Results:**
- Redirects to `/dashboard`

**Pass Criteria:** Regular user lands on standard dashboard

---

### TC-UAT-017: Protected Route Access Without Auth
**Priority:** P1 | **Flow:** Authorization

**Steps:**
1. Attempt to access `/admin/dashboard` without prior login (no token cookie)

**Expected Results:**
- Redirect to `/login` (or 403/401 depending on implementation)

**Pass Criteria:** Protected route inaccessible without auth

---

### TC-UAT-018: Admin Route Access with Regular User Token
**Priority:** P0 | **Flow:** Authorization

**Steps:**
1. Login as non-admin user
2. Attempt to access `/admin/dashboard`

**Expected Results:**
- HTTP 403 Forbidden (via `withAdmin` middleware)
- OR redirect to `/dashboard` with error

**Pass Criteria:** Regular user cannot access admin routes

---

### TC-UAT-019: Login Cookie Security Properties
**Priority:** P1 | **Flow:** Security

**Steps:**
1. Login and inspect `Set-Cookie` header

**Expected Results:**
- `HttpOnly: true` — not accessible via JavaScript
- `SameSite: Lax` — CSRF protection
- `Secure: true` (in production with HTTPS)
- `Max-Age: 604800` (7 days in seconds)

**Pass Criteria:** Cookie has appropriate security flags

---

### TC-UAT-020: Username Length Validation (Abuse Prevention)
**Priority:** P2 | **Flow:** Security

**Steps:**
1. Attempt login with username > 255 characters

**Expected Results:**
- HTTP 401 returned
- Response: `{ "error": "Invalid credentials" }` (generic, not revealing validation failure)

**Pass Criteria:** Oversized input rejected gracefully

---

### TC-UAT-021: Concurrent Session Handling
**Priority:** P2 | **Flow:** Session

**Steps:**
1. Login on Device A; note token
2. Login on Device B with same credentials; note new token
3. Use Device A token to call `/api/auth/me`

**Expected Results:**
- Both tokens valid (no single-session enforcement observed)
- OR previous token invalidated (single-session mode)

**Pass Criteria:** Behavior matches system requirements

---

### TC-UAT-022: Login API Root Endpoint
**Priority:** P2 | **Flow:** Login

**Steps:**
1. Call `GET /api/auth`

**Expected Results:**
- HTTP 200 returned
- Response: `{ "message": "Auth API" }`

**Pass Criteria:** Health check returns expected response

---

### TC-UAT-023: Forgot Password Link Present
**Priority:** P3 | **Flow:** Login

**Steps:**
1. Navigate to `/login`
2. Locate "Quên mật khẩu?" link

**Expected Results:**
- Link present and points to `/forgot-password`

**Pass Criteria:** Recovery path available

---

### TC-UAT-024: Error Message Does Not Reveal User Existence
**Priority:** P1 | **Flow:** Security

**Steps:**
1. Attempt login with valid username but wrong password
2. Attempt login with nonexistent username

**Expected Results:**
- Both return identical error: `Invalid credentials`
- Error does NOT reveal whether username exists

**Pass Criteria:** Timing/semantic attack mitigated

---

### TC-UAT-025: Password Field Masking
**Priority:** P3 | **Flow:** UI

**Steps:**
1. Navigate to `/login`
2. Enter password

**Expected Results:**
- Password characters masked (dots/asterisks)
- Toggle to reveal not present (may be enhancement)

**Pass Criteria:** Password not visible while typing

---

## 4. Test Summary Matrix

| ID | Test Case | Priority | Flow | Status |
|----|-----------|----------|------|--------|
| TC-UAT-001 | Valid login | P0 | Login | |
| TC-UAT-002 | Invalid username | P0 | Login | |
| TC-UAT-003 | Invalid password | P0 | Login | |
| TC-UAT-004 | Missing username | P1 | Login | |
| TC-UAT-005 | Missing password | P1 | Login | |
| TC-UAT-006 | Short password (client) | P2 | Login | |
| TC-UAT-007 | Inactive user | P0 | Login | |
| TC-UAT-008 | Rate limit lockout | P0 | Login | |
| TC-UAT-009 | Post-lockout login | P1 | Login | |
| TC-UAT-010 | Valid session | P0 | Session | |
| TC-UAT-011 | Missing token | P0 | Session | |
| TC-UAT-012 | Invalid token | P0 | Session | |
| TC-UAT-013 | Expired token | P0 | Session | |
| TC-UAT-014 | Logout clears session | P0 | Logout | |
| TC-UAT-015 | Admin redirect | P0 | Routing | |
| TC-UAT-016 | User redirect | P0 | Routing | |
| TC-UAT-017 | Protected route no auth | P1 | Auth | |
| TC-UAT-018 | Admin route as user | P0 | Auth | |
| TC-UAT-019 | Cookie security flags | P1 | Security | |
| TC-UAT-020 | Username length limit | P2 | Security | |
| TC-UAT-021 | Concurrent sessions | P2 | Session | |
| TC-UAT-022 | Auth API root | P2 | Health | |
| TC-UAT-023 | Forgot password link | P3 | UI | |
| TC-UAT-024 | Error message uniformity | P1 | Security | |
| TC-UAT-025 | Password masking | P3 | UI | |

---

## 5. Priority Definitions

| Priority | Definition | Test Count |
|----------|------------|------------|
| **P0** | Critical path — must pass for release | 14 |
| **P1** | Important — should pass | 6 |
| **P2** | Moderate —nice to have | 4 |
| **P3** | Low — cosmetic/enhancement | 2 |

---

## 6. Environment Requirements

- **Base URL:** `http://localhost:3000` (dev)
- **Database:** Prisma with SQLite (dev); PostgreSQL (staging)
- **Environment Vars:** `JWT_SECRET` required
- **Test Users:** Seed script creates admin + regular users
- **Rate Limiter:** Bypassed in test environment (NODE_ENV=test)

---

## 7. Related Documents

- Specification: `docs/api-auth-test-spec.md`
- E2E Tests: `tests/e2e/auth-flows.spec.ts`
- Authorization Tests: `tests/e2e/authorization.spec.ts`