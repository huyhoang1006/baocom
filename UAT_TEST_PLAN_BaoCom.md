# UAT Test Plan - BaoCom Lunch Registration System
**Document ID:** BAOCOM-UAT-2026-001
**Version:** 1.0
**Date:** 2026-05-14
**Author:** AI Test Engineer
**IEEE Standard:** IEEE 829-2008

---

## 1. Introduction

### 1.1 Purpose
This UAT Test Plan documents the acceptance testing approach for the BaoCom Lunch Registration System - a web application enabling employees to register daily lunch attendance and administrators to manage meals, menus, and reports.

### 1.2 Scope
- **In Scope:** Web UI (employee & admin), REST API endpoints, authentication, authorization, data integrity
- **Out of Scope:** Performance testing, security penetration testing, infrastructure validation

### 1.3 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    BaoCom System Architecture               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Employee│    │ Employee│    │  Admin  │    │   API   │  │
│  │  Login  │    │  Book   │    │ Dashboard│   │  Layer  │  │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘  │
│       │              │              │              │        │
│  ┌────┴──────────────┴──────────────┴──────────────┴────┐ │
│  │                   Next.js App                         │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │               API Routes                          │ │ │
│  │  │  /api/auth/*  /api/registrations/*  /api/admin/* │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └────────────────────┬──────────────────────────────────┘ │
│                       │                                     │
│  ┌────────────────────┴──────────────────────────────────┐ │
│  │                  Prisma ORM                             │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │              SQLite Database                     │  │ │
│  │  │  Users │ Registrations │ Meals │ DailyMenus      │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 Test Environment Configuration

| Component | Version | Configuration |
|-----------|---------|---------------|
| Runtime | Node.js 20+ | - |
| Framework | Next.js 16.2.6 | App Router, TypeScript |
| Database | SQLite | Prisma ORM with libsql adapter |
| Test Framework | Playwright 1.60 | E2E testing |
| Auth | JWT (HS256) | 7-day expiry, httpOnly cookies |

---

## 2. Test Items

### 2.1 Module: Authentication (AUTH)

| Test Item ID | Description | Priority |
|--------------|-------------|----------|
| AUTH-001 | Login with valid credentials | P0 |
| AUTH-002 | Login with invalid username | P1 |
| AUTH-003 | Login with invalid password | P1 |
| AUTH-004 | Login with missing fields | P1 |
| AUTH-005 | Logout functionality | P1 |
| AUTH-006 | Session persistence (token validity) | P1 |
| AUTH-007 | Rate limiting (brute force protection) | P0 |

### 2.2 Module: Authorization (AUTHZ)

| Test Item ID | Description | Priority |
|--------------|-------------|----------|
| AUTHZ-001 | Non-admin access to admin endpoints returns 403 | P0 |
| AUTHZ-002 | Admin access to admin endpoints returns 200 | P0 |
| AUTHZ-003 | Role field cannot be modified by users | P1 |
| AUTHZ-004 | Deactivated user login rejected | P2 |

### 2.3 Module: Employee Registration (REG)

| Test Item ID | Description | Priority |
|--------------|-------------|----------|
| REG-001 | Create registration (eating) | P0 |
| REG-002 | Create registration (not eating) | P1 |
| REG-003 | Update registration status | P1 |
| REG-004 | View own registrations | P1 |
| REG-005 | IDOR protection - cannot access other users' registrations | P0 |

### 2.4 Module: Admin Dashboard (ADMIN)

| Test Item ID | Description | Priority |
|--------------|-------------|----------|
| ADMIN-001 | View dashboard statistics | P0 |
| ADMIN-002 | List all employees | P1 |
| ADMIN-003 | Search employees | P1 |
| ADMIN-004 | Create new employee | P1 |
| ADMIN-005 | Update employee | P1 |
| ADMIN-006 | Deactivate employee | P1 |
| ADMIN-007 | Generate reports | P1 |
| ADMIN-008 | Export report to Excel | P2 |

### 2.5 Module: Meal Management (MEAL)

| Test Item ID | Description | Priority |
|--------------|-------------|----------|
| MEAL-001 | List active meals | P1 |
| MEAL-002 | Admin creates new meal | P1 |
| MEAL-003 | Admin updates meal | P2 |
| MEAL-004 | Admin deactivates meal | P2 |
| MEAL-005 | Non-admin cannot modify meals | P1 |

### 2.6 Module: Daily Menu (MENU)

| Test Item ID | Description | Priority |
|--------------|-------------|----------|
| MENU-001 | List daily menus | P1 |
| MENU-002 | Create daily menu with valid meals | P1 |
| MENU-003 | Create daily menu with invalid meal ID | P1 |
| MENU-004 | Update daily menu | P2 |
| MENU-005 | Non-admin cannot modify menus | P1 |

---

## 3. Feature Summary

### 3.1 Authentication Features

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Login | User authenticates with username/password | Returns JWT token as httpOnly cookie |
| Logout | User terminates session | Token cookie cleared (Max-Age=0) |
| Session Check | Verify current user | Returns user data with id, username, name, role |
| Rate Limiting | Prevent brute force attacks | 5 failed attempts → 15 min lockout (429) |

### 3.2 Employee Features

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Book Lunch | Toggle eating/not-eating per day | Registration upserted by userId+date |
| View Menu | See weekly menu | Displays main, vegetables, dessert per day |
| View History | Calendar of past registrations | Shows eating/not-eating status per day |

### 3.3 Admin Features

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Dashboard | Real-time stats | totalEmployees, eatingToday, notEatingToday, registrationRate |
| Employee Management | CRUD operations | Create/read/update/deactivate employees |
| Reports | Registration reports by date range | STT, name, phone, date columns |

### 3.4 Security Features

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| JWT Auth | Stateless session management | 7-day expiry, httpOnly, sameSite=lax |
| Role-based Access | Admin vs Employee | Admin endpoints require role='admin' |
| IDOR Protection | Prevent unauthorized data access | 403 when user tries to access other user's data |
| Password Security | Bcrypt hashing | Salt rounds = 12 |

---

## 4. Test Cases

### 4.1 Authentication Test Cases

#### TC-AUTH-001: Valid Login
```
Test ID: TC-AUTH-001
Module: Authentication
Priority: P0

Objective: Verify user can login with valid credentials

Pre-conditions:
- User exists in database (admin/admin123)

Test Steps:
1. POST /api/auth/login with {"username": "admin", "password": "admin123"}
2. Capture response status and body
3. Verify Set-Cookie header contains token

Expected Results:
- Status: 200
- Body: {"user": {"id": "...", "username": "admin", "name": "...", "role": "admin"}}
- Cookie: token=<JWT>; HttpOnly; SameSite=Lax; Max-Age=604800

Pass Criteria: All assertions pass
```

#### TC-AUTH-002: Invalid Username
```
Test ID: TC-AUTH-002
Module: Authentication
Priority: P1

Objective: Verify login fails with invalid username

Test Steps:
1. POST /api/auth/login with {"username": "nonexistent", "password": "anypassword"}

Expected Results:
- Status: 401
- Body: {"error": "Invalid credentials"}

Pass Criteria: Status = 401 and error message matches
```

#### TC-AUTH-003: Invalid Password
```
Test ID: TC-AUTH-003
Module: Authentication
Priority: P1

Objective: Verify login fails with wrong password

Pre-conditions:
- User "admin" exists with password "admin123"

Test Steps:
1. POST /api/auth/login with {"username": "admin", "password": "wrongpassword"}

Expected Results:
- Status: 401
- Body: {"error": "Invalid credentials"}

Pass Criteria: Status = 401 and error message matches
```

#### TC-AUTH-004: Missing Credentials
```
Test ID: TC-AUTH-004
Module: Authentication
Priority: P1

Objective: Verify login fails with missing fields

Test Steps:
1. POST /api/auth/login with {}

Expected Results:
- Status: 400
- Body: {"error": "Missing username or password"}

Pass Criteria: Status = 400 and error message matches
```

#### TC-AUTH-005: Logout Clears Cookie
```
Test ID: TC-AUTH-005
Module: Authentication
Priority: P1

Objective: Verify logout clears the session token

Pre-conditions:
- User logged in, token cookie exists

Test Steps:
1. Login to get token cookie
2. POST /api/auth/logout with token cookie
3. Verify response Set-Cookie has Max-Age=0

Expected Results:
- Status: 200
- Set-Cookie: token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax

Pass Criteria: Cookie maxAge equals 0
```

#### TC-AUTH-006: Session Token Validation
```
Test ID: TC-AUTH-006
Module: Authentication
Priority: P1

Objective: Verify /api/auth/me returns user data for valid token

Test Steps:
1. Login to get token cookie
2. GET /api/auth/me with token cookie
3. Verify response contains user data

Expected Results:
- Status: 200
- Body: {"user": {"id": "...", "username": "...", "name": "...", "role": "..."}}

Pass Criteria: User object returned with all fields
```

#### TC-AUTH-007: Invalid Token Rejected
```
Test ID: TC-AUTH-007
Module: Authentication
Priority: P1

Objective: Verify invalid tokens are rejected

Test Steps:
1. GET /api/auth/me with Cookie: token=invalid_token_here

Expected Results:
- Status: 401
- Body: {"error": "Invalid token"}

Pass Criteria: Status = 401 and error message matches
```

#### TC-AUTH-008: Rate Limit After Failed Attempts
```
Test ID: TC-AUTH-008
Module: Authentication
Priority: P0

Objective: Verify rate limiting after 5 failed login attempts

Pre-conditions:
- RATE_LIMIT_BYPASS=false (disabled for this test)

Test Steps:
1. Attempt 5 failed logins with wrong password
2. Attempt 6th login with wrong password

Expected Results:
- 1st-5th attempts: Status 401
- 6th attempt: Status 429
- Body: {"error": "...", "retryAfter": > 800}

Pass Criteria: 6th attempt returns 429 with retryAfter > 800 seconds
```

### 4.2 Authorization Test Cases

#### TC-AUTHZ-001: Non-Admin Blocked from Admin Endpoints
```
Test ID: TC-AUTHZ-001
Module: Authorization
Priority: P0

Objective: Verify non-admin users receive 403 on admin-only endpoints

Pre-conditions:
- Employee user "nguyenvana" exists with role="employee"

Test Steps:
1. Login as nguyenvana (employee)
2. GET /api/admin/stats with employee cookie
3. Verify response status

Expected Results:
- Status: 403
- Body: {"error": "Forbidden"}

Pass Criteria: Status = 403
```

#### TC-AUTHZ-002: Admin Can Access Admin Endpoints
```
Test ID: TC-AUTHZ-002
Module: Authorization
Priority: P0

Objective: Verify admin users can access admin-only endpoints

Pre-conditions:
- Admin user "admin" exists with role="admin"

Test Steps:
1. Login as admin
2. GET /api/admin/stats with admin cookie
3. Verify response status

Expected Results:
- Status: 200
- Body contains: totalEmployees, eatingToday, notEatingToday, registrationRate

Pass Criteria: Status = 200 and stats object present
```

#### TC-AUTHZ-003: IDOR Protection on Registrations
```
Test ID: TC-AUTHZ-003
Module: Authorization
Priority: P0

Objective: Verify User A cannot access User B's registrations

Pre-conditions:
- Two users: nguyenvana (A) and tranthib (B) exist

Test Steps:
1. Login as User A (nguyenvana)
2. User B creates registration
3. User A attempts GET /api/registrations/{B's registration ID}
4. Verify response status

Expected Results:
- Status: 403 (Forbidden) - because route is withAdmin only
- OR if route uses withAuth: returns filtered data (not the specific ID)

Pass Criteria: User A cannot see User B's registration data
```

### 4.3 Employee Registration Test Cases

#### TC-REG-001: Create Eating Registration
```
Test ID: TC-REG-001
Module: Registration
Priority: P0

Objective: Verify employee can create eating registration

Pre-conditions:
- Employee logged in

Test Steps:
1. POST /api/registrations with {"date": "2026-05-20", "status": "eating"}

Expected Results:
- Status: 201
- Body: {"registration": {"id": "...", "userId": "...", "date": "...", "status": "eating"}}

Pass Criteria: Registration created with eating status
```

#### TC-REG-002: Create Not-Eating Registration
```
Test ID: TC-REG-002
Module: Registration
Priority: P1

Objective: Verify employee can create not-eating registration

Test Steps:
1. POST /api/registrations with {"date": "2026-05-20", "status": "not_eating"}

Expected Results:
- Status: 201
- Body: {"registration": {"status": "not_eating"}}

Pass Criteria: Registration created with not_eating status
```

#### TC-REG-003: Upsert Registration
```
Test ID: TC-REG-003
Module: Registration
Priority: P1

Objective: Verify registration is updated if already exists for date

Test Steps:
1. Create registration for 2026-05-20 (eating)
2. Create registration for 2026-05-20 (not_eating)
3. Verify only one registration exists for that date

Expected Results:
- Status: 201 (or 200 on update)
- Only one registration per userId+date unique constraint

Pass Criteria: No duplicate registrations
```

#### TC-REG-004: View Own Registrations
```
Test ID: TC-REG-004
Module: Registration
Priority: P1

Objective: Verify employee sees only their own registrations

Test Steps:
1. Login as employee
2. GET /api/registrations
3. Verify all registrations belong to logged-in user

Expected Results:
- Status: 200
- Body: {"registrations": [...]}
- All items have userId matching logged-in user

Pass Criteria: No other users' registrations returned
```

### 4.4 Admin Dashboard Test Cases

#### TC-ADMIN-001: View Statistics
```
Test ID: TC-ADMIN-001
Module: Admin Dashboard
Priority: P0

Objective: Verify admin dashboard returns correct statistics

Pre-conditions:
- Admin logged in

Test Steps:
1. GET /api/admin/stats
2. Verify response structure

Expected Results:
- Status: 200
- Body: {
    "stats": {
      "totalEmployees": <number>,
      "eatingToday": <number>,
      "notEatingToday": <number>,
      "registered": <number>,
      "notRegistered": <number>,
      "registrationRate": <number>
    }
  }

Pass Criteria: All stats fields present and numeric
```

#### TC-ADMIN-002: List Employees
```
Test ID: TC-ADMIN-002
Module: Admin Dashboard
Priority: P1

Objective: Verify admin can list all employees

Test Steps:
1. Login as admin
2. GET /api/users

Expected Results:
- Status: 200
- Body: {"users": [...]}
- Each user has: id, username, name, role, createdAt

Pass Criteria: Array of user objects returned
```

#### TC-ADMIN-003: Create Employee
```
Test ID: TC-ADMIN-003
Module: Admin Dashboard
Priority: P1

Objective: Verify admin can create new employee

Test Steps:
1. Login as admin
2. POST /api/users with {"username": "newemployee", "password": "pass123", "name": "New Employee"}

Expected Results:
- Status: 201
- Body: {"user": {"id": "...", "username": "newemployee", "name": "New Employee", "role": "employee"}}

Pass Criteria: New user created with correct fields
```

#### TC-ADMIN-004: Search Employees
```
Test ID: TC-ADMIN-004
Module: Admin Dashboard
Priority: P1

Objective: Verify admin can search employees

Test Steps:
1. Login as admin
2. GET /api/users?search=admin

Expected Results:
- Status: 200
- Body: {"users": [...]} containing matching users

Pass Criteria: Filtered results returned
```

#### TC-ADMIN-005: Generate Report
```
Test ID: TC-ADMIN-005
Module: Admin Dashboard
Priority: P1

Objective: Verify admin can generate registration report

Test Steps:
1. Login as admin
2. GET /api/admin/reports?startDate=2026-05-01&endDate=2026-05-31

Expected Results:
- Status: 200
- Body: {
    "reportData": [{"stt": 1, "name": "...", "phone": "...", "date": "..."}],
    "stats": {"total": <number>, "byDate": {...}}
  }

Pass Criteria: Report data with STT, name, phone, date columns
```

### 4.5 Cookie Security Test Cases

#### TC-COOKIE-001: HttpOnly Flag Set
```
Test ID: TC-COOKIE-001
Module: Cookie Security
Priority: P1

Objective: Verify token cookie has HttpOnly flag

Test Steps:
1. Login and capture Set-Cookie header
2. Verify HttpOnly flag is present

Expected Results:
- Set-Cookie contains: HttpOnly

Pass Criteria: HttpOnly flag present
```

#### TC-COOKIE-002: SameSite Attribute Set
```
Test ID: TC-COOKIE-002
Module: Cookie Security
Priority: P1

Objective: Verify token cookie has SameSite attribute

Test Steps:
1. Login and capture Set-Cookie header
2. Verify SameSite=(Lax|Strict)

Expected Results:
- Set-Cookie contains: SameSite=Lax or SameSite=Strict

Pass Criteria: SameSite attribute present
```

#### TC-COOKIE-003: Token Expiry
```
Test ID: TC-COOKIE-003
Module: Cookie Security
Priority: P1

Objective: Verify token cookie has correct Max-Age (7 days)

Test Steps:
1. Login and capture Set-Cookie header
2. Verify Max-Age=604800 (7 days in seconds)

Expected Results:
- Set-Cookie contains: Max-Age=604800

Pass Criteria: Max-Age equals 604800 seconds
```

---

## 5. Test Schedule

### 5.1 Phases

| Phase | Description | Duration | Deliverables |
|-------|-------------|----------|--------------|
| Phase 1 | Authentication & Authorization | 2 hours | TC-AUTH-001 to TC-AUTHZ-003 |
| Phase 2 | Employee Registration | 2 hours | TC-REG-001 to TC-REG-004 |
| Phase 3 | Admin Dashboard & Reports | 2 hours | TC-ADMIN-001 to TC-ADMIN-005 |
| Phase 4 | Meal & Menu Management | 1 hour | TC-MEAL-*, TC-MENU-* |
| Phase 5 | Security Validation | 1 hour | TC-COOKIE-001 to TC-COOKIE-003 |

### 5.2 Total Duration
**Estimated Total: 8 hours**

---

## 6. Resource Requirements

### 6.1 Human Resources

| Role | Count | Responsibility |
|------|-------|----------------|
| Test Lead | 1 | Test planning, UAT coordination |
| Test Analyst | 2 | Test case execution, defect logging |
| Developer | 1 | Fix support, environment setup |

### 6.2 Environment Requirements

| Resource | Specification |
|----------|---------------|
| Test Database | SQLite with seed data (admin, 5 employees, 20 meals) |
| Browser | Chromium (Playwright) |
| API Client | Postman or curl |

---

## 7. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Test data pollution | Medium | Medium | Use unique usernames per test |
| Rate limiter interference | Medium | Low | Ensure RATE_LIMIT_BYPASS=true for tests |
| Token expiry during test | Low | Medium | Refresh token before each test |
| UI selector mismatch | Medium | High | Use data-testid attributes in components |

---

## 8. Acceptance Criteria

### 8.1 Authentication Acceptance
- [ ] Valid login returns 200 with user object and token cookie
- [ ] Invalid credentials return 401
- [ ] Missing fields return 400
- [ ] Logout clears token cookie (Max-Age=0)
- [ ] Invalid token returns 401
- [ ] Rate limiting triggers after 5 failed attempts (429)

### 8.2 Authorization Acceptance
- [ ] Non-admin receives 403 on admin endpoints
- [ ] Admin receives 200 on admin endpoints
- [ ] IDOR protection prevents cross-user data access

### 8.3 Registration Acceptance
- [ ] Employee can create eating/not_eating registration
- [ ] Registration upserts correctly (no duplicates)
- [ ] Employee sees only own registrations

### 8.4 Admin Acceptance
- [ ] Stats endpoint returns correct counts
- [ ] Employee CRUD operations work
- [ ] Report generation produces correct format

### 8.5 Security Acceptance
- [ ] Cookie has HttpOnly flag
- [ ] Cookie has SameSite attribute
- [ ] Token has 7-day expiry (Max-Age=604800)
- [ ] Passwords hashed with bcrypt (12 rounds)

---

## 9. Test Deliverables

| Deliverable | Description | Format |
|-------------|-------------|--------|
| Test Plan | This document | Markdown |
| Test Cases | 25+ test cases | Markdown |
| Test Results | Execution log with pass/fail | JSON |
| Defect Report | Failed test evidence | Markdown |

---

## 10. Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Test Lead | | | |
| Project Manager | | | |
| Business Owner | | | |

---

**Document End**