# BaoCom API Authentication & Authorization Test Specification
**Document ID:** BAOCOM-API-AUTH-2026-001
**Version:** 1.0
**Date:** 2026-05-14
**Standard:** IEEE 829-2008
**Author:** AI Test Engineer

---

## 1. Test Plan Overview

### 1.1 Scope

| Category | Description |
|----------|-------------|
| **Test Items** | All 16 API endpoints in `app/api/` |
| **Feature Under Test** | Authentication middleware (`withAuth`) and Authorization middleware (`withAdmin`) |
| **Objectives** | Verify HTTP status codes (401/403/200), response bodies, role-based access control |
| **Not in Scope** | Database integrity, E2E UI flows, performance/load testing |

### 1.2 Test Environment

```
Base URL: http://localhost:3000
Environment: Development (dev.db SQLite)
```

### 1.3 Test Accounts

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| Admin | admin | admin123 | Test admin-only endpoints, verify 403 for employee |
| Employee | nguyenvana | employee123 | Test user endpoints, verify 403 for non-admin |

### 1.4 Test Approach

```
┌─────────────────────────────────────────────────────────────┐
│                  BLACK-BOX API TESTING                       │
├─────────────────────────────────────────────────────────────┤
│  curl/bash scripts → HTTP requests → Verify responses       │
│  No knowledge of internal implementation                     │
│  Test authentication (who) and authorization (what)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. API Endpoint Inventory

### 2.1 Public Endpoints (No Auth Required)

| ID | Method | Path | Description |
|----|--------|------|-------------|
| AUTH-01 | POST | `/api/auth/login` | User login |
| AUTH-02 | GET | `/api/auth` | Auth API health check |

### 2.2 Authenticated User Endpoints (Any Role)

| ID | Method | Path | Auth Required | Admin Only |
|----|--------|------|---------------|------------|
| USER-01 | POST | `/api/auth/logout` | ✅ | ❌ |
| USER-02 | GET | `/api/auth/me` | ✅ | ❌ |
| MENU-01 | GET | `/api/daily-menus` | ✅ | ❌ |
| REG-01 | GET | `/api/registrations` | ✅ | ❌ |
| REG-02 | POST | `/api/registrations` | ✅ | ❌ |
| MEAL-01 | GET | `/api/meals` | ✅ | ❌ |

### 2.3 Admin-Only Endpoints

| ID | Method | Path | Description |
|----|--------|------|-------------|
| ADMIN-01 | POST | `/api/daily-menus` | Create daily menu |
| ADMIN-02 | PUT | `/api/daily-menus/[date]` | Update menu by date |
| ADMIN-03 | GET | `/api/holidays` | List holidays |
| ADMIN-04 | POST | `/api/holidays` | Create holiday |
| ADMIN-05 | PATCH | `/api/holidays/[id]` | Update holiday |
| ADMIN-06 | DELETE | `/api/holidays/[id]` | Delete holiday |
| ADMIN-07 | POST | `/api/meals` | Create meal |
| ADMIN-08 | GET | `/api/meals/[id]` | Get meal by ID |
| ADMIN-09 | PATCH | `/api/meals/[id]` | Update meal |
| ADMIN-10 | DELETE | `/api/meals/[id]` | Delete meal |
| ADMIN-11 | GET | `/api/users` | List all users |
| ADMIN-12 | POST | `/api/users` | Create user |
| ADMIN-13 | GET | `/api/users/[id]` | Get user by ID |
| ADMIN-14 | PATCH | `/api/users/[id]` | Update user |
| ADMIN-15 | DELETE | `/api/users/[id]` | Delete user |
| ADMIN-16 | GET | `/api/admin/stats` | Get admin statistics |
| ADMIN-17 | GET | `/api/admin/reports` | Get admin reports |
| ADMIN-18 | GET | `/api/registrations/[id]` | Get registration by ID (admin) |
| ADMIN-19 | DELETE | `/api/registrations/[id]` | Delete registration (admin) |

---

## 3. Test Cases

### 3.1 Authentication Tests (Public Endpoints)

#### TC-AUTH-001: Login Success - Admin
```
Test ID: TC-AUTH-001
Priority: P0

Objective: Verify admin can login with valid credentials

Pre-condition: Admin account exists (admin/admin123)

Procedure:
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'

Expected Results:
  - HTTP 200
  - Response contains: {"user":{"id":"...","username":"admin","role":"admin"}}
  - Set-Cookie: token=... (httpOnly, secure, sameSite=lax)

Pass Criteria: HTTP 200 and token cookie present
```

#### TC-AUTH-002: Login Success - Employee
```
Test ID: TC-AUTH-002
Priority: P0

Objective: Verify employee can login with valid credentials

Pre-condition: Employee account exists (nguyenvana/employee123)

Procedure:
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"nguyenvana","password":"employee123"}'

Expected Results:
  - HTTP 200
  - Response contains: {"user":{"id":"...","username":"nguyenvana","role":"employee"}}
  - Set-Cookie: token=...

Pass Criteria: HTTP 200 and employee role in response
```

#### TC-AUTH-003: Login Failure - Invalid Password
```
Test ID: TC-AUTH-003
Priority: P0

Objective: Verify 401 returned for invalid password

Procedure:
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrongpassword"}'

Expected Results:
  - HTTP 401
  - Response contains: {"error":"Invalid credentials"}

Pass Criteria: HTTP 401 and error message
```

#### TC-AUTH-004: Login Failure - Missing Fields
```
Test ID: TC-AUTH-004
Priority: P1

Objective: Verify 400 returned when username/password missing

Procedure:
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin"}'

Expected Results:
  - HTTP 400
  - Response contains: {"error":"Missing username or password"}

Pass Criteria: HTTP 400
```

#### TC-AUTH-005: Auth Health Check
```
Test ID: TC-AUTH-005
Priority: P2

Objective: Verify public auth endpoint is accessible

Procedure:
  curl -X GET http://localhost:3000/api/auth

Expected Results:
  - HTTP 200
  - Response: {"message":"Auth API"}

Pass Criteria: HTTP 200
```

---

### 3.2 Authentication Enforcement Tests (401 Errors)

#### TC-AUTH-401-001: No Token
```
Test ID: TC-AUTH-401-001
Priority: P0

Objective: Verify 401 when no token cookie provided

Procedure:
  curl -X GET http://localhost:3000/api/auth/me

Expected Results:
  - HTTP 401
  - Response contains: {"error":"Unauthorized"}

Pass Criteria: HTTP 401
```

#### TC-AUTH-401-002: Invalid Token Format
```
Test ID: TC-AUTH-401-002
Priority: P0

Objective: Verify 401 when token is malformed

Procedure:
  curl -X GET http://localhost:3000/api/auth/me \
    -H "Cookie: token=invalid-token-format"

Expected Results:
  - HTTP 401
  - Response contains: {"error":"Invalid token"}

Pass Criteria: HTTP 401
```

#### TC-AUTH-401-003: Expired Token
```
Test ID: TC-AUTH-401-003
Priority: P0

Objective: Verify 401 when token is expired (if applicable)

Procedure:
  # Use a token that is known to be expired
  curl -X GET http://localhost:3000/api/auth/me \
    -H "Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwidmFsdWUiOiJ0b2tlbiJ9.ExpiredSignature"

Expected Results:
  - HTTP 401
  - Response contains: {"error":"Invalid token"}

Pass Criteria: HTTP 401
```

---

### 3.3 Authorization Tests (Role-Based Access Control)

#### TC-AUTH-403-001: Employee Access Admin Stats
```
Test ID: TC-AUTH-403-001
Priority: P0

Objective: Verify employee gets 403 when accessing admin-only endpoint

Pre-condition: Employee logged in with valid token

Procedure:
  EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"nguyenvana","password":"employee123"}' \
    -c - | grep token | awk '{print $7}')

  curl -X GET http://localhost:3000/api/admin/stats \
    -H "Cookie: token=$EMPLOYEE_TOKEN"

Expected Results:
  - HTTP 403
  - Response contains: {"error":"Forbidden"}

Pass Criteria: HTTP 403
```

#### TC-AUTH-403-002: Employee Access Admin Users
```
Test ID: TC-AUTH-403-002
Priority: P0

Objective: Verify employee gets 403 when accessing admin user management

Procedure:
  EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"nguyenvana","password":"employee123"}' \
    -c - | grep token | awk '{print $7}')

  curl -X GET http://localhost:3000/api/users \
    -H "Cookie: token=$EMPLOYEE_TOKEN"

Expected Results:
  - HTTP 403
  - Response contains: {"error":"Forbidden"}

Pass Criteria: HTTP 403
```

#### TC-AUTH-403-003: Employee Access Admin POST
```
Test ID: TC-AUTH-403-003
Priority: P0

Objective: Verify employee gets 403 when posting to admin-only endpoint

Procedure:
  EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"nguyenvana","password":"employee123"}' \
    -c - | grep token | awk '{print $7}')

  curl -X POST http://localhost:3000/api/daily-menus \
    -H "Cookie: token=$EMPLOYEE_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"date":"2026-05-20","meals":[{"mealId":"1","available":true}]}'

Expected Results:
  - HTTP 403
  - Response contains: {"error":"Forbidden"}

Pass Criteria: HTTP 403
```

---

### 3.4 Authenticated User Endpoint Tests

#### TC-USER-001: Get Current User (Me)
```
Test ID: TC-USER-001
Priority: P0

Objective: Verify authenticated user can get their own info

Procedure:
  ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    -c - | grep token | awk '{print $7}')

  curl -X GET http://localhost:3000/api/auth/me \
    -H "Cookie: token=$ADMIN_TOKEN"

Expected Results:
  - HTTP 200
  - Response contains: {"user":{"id":"...","username":"admin","role":"admin","name":"..."}}

Pass Criteria: HTTP 200 and user data returned
```

#### TC-USER-002: Get Daily Menus
```
Test ID: TC-USER-002
Priority: P0

Objective: Verify authenticated user can get daily menus

Procedure:
  EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"nguyenvana","password":"employee123"}' \
    -c - | grep token | awk '{print $7}')

  curl -X GET http://localhost:3000/api/daily-menus \
    -H "Cookie: token=$EMPLOYEE_TOKEN"

Expected Results:
  - HTTP 200
  - Response is array of daily menus

Pass Criteria: HTTP 200
```

#### TC-USER-003: Get Daily Menu by Date
```
Test ID: TC-USER-003
Priority: P1

Objective: Verify authenticated user can get menu for specific date

Procedure:
  EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"nguyenvana","password":"employee123"}' \
    -c - | grep token | awk '{print $7}')

  curl -X GET "http://localhost:3000/api/daily-menus/2026-05-20" \
    -H "Cookie: token=$EMPLOYEE_TOKEN"

Expected Results:
  - HTTP 200 (menu exists) or HTTP 404 (menu not found)
  - Response structure depends on data

Pass Criteria: HTTP 200 or 404
```

#### TC-USER-004: Get Registrations
```
Test ID: TC-USER-004
Priority: P0

Objective: Verify authenticated user can get their registrations

Procedure:
  EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"nguyenvana","password":"employee123"}' \
    -c - | grep token | awk '{print $7}')

  curl -X GET http://localhost:3000/api/registrations \
    -H "Cookie: token=$EMPLOYEE_TOKEN"

Expected Results:
  - HTTP 200
  - Response is array of registrations

Pass Criteria: HTTP 200
```

#### TC-USER-005: Logout
```
Test ID: TC-USER-005
Priority: P1

Objective: Verify user can logout and token is cleared

Procedure:
  ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    -c - | grep token | awk '{print $7}')

  curl -X POST http://localhost:3000/api/auth/logout \
    -H "Cookie: token=$ADMIN_TOKEN"

Expected Results:
  - HTTP 200
  - Response contains: Set-Cookie: token=...; Max-Age=0 (cookie cleared)

Pass Criteria: HTTP 200 and logout cookie
```

---

### 3.5 Admin-Only Endpoint Tests

#### TC-ADMIN-001: Admin Get Stats
```
Test ID: TC-ADMIN-001
Priority: P0

Objective: Verify admin can access stats endpoint

Procedure:
  ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    -c - | grep token | awk '{print $7}')

  curl -X GET http://localhost:3000/api/admin/stats \
    -H "Cookie: token=$ADMIN_TOKEN"

Expected Results:
  - HTTP 200
  - Response contains stats data

Pass Criteria: HTTP 200
```

#### TC-ADMIN-002: Admin Get Users
```
Test ID: TC-ADMIN-002
Priority: P0

Objective: Verify admin can access user management

Procedure:
  ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    -c - | grep token | awk '{print $7}')

  curl -X GET http://localhost:3000/api/users \
    -H "Cookie: token=$ADMIN_TOKEN"

Expected Results:
  - HTTP 200
  - Response is array of users

Pass Criteria: HTTP 200
```

#### TC-ADMIN-003: Admin Get Holidays
```
Test ID: TC-ADMIN-003
Priority: P1

Objective: Verify admin can list holidays

Procedure:
  ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    -c - | grep token | awk '{print $7}')

  curl -X GET http://localhost:3000/api/holidays \
    -H "Cookie: token=$ADMIN_TOKEN"

Expected Results:
  - HTTP 200
  - Response is array of holidays

Pass Criteria: HTTP 200
```

---

## 4. Test Execution Scripts

### 4.1 Bash Test Script - Authentication Tests

```bash
#!/bin/bash
# ============================================================
# BaoCom API Authentication Test Suite
# Standard: IEEE 829-2008
# Version: 1.0
# ============================================================

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function
check_response() {
  local test_name="$1"
  local expected_status="$2"
  local actual_status="$3"
  local response="$4"

  echo "Testing: $test_name"
  echo "  Expected: HTTP $expected_status"
  echo "  Actual:   HTTP $actual_status"

  if [ "$actual_status" == "$expected_status" ]; then
    echo -e "  ${GREEN}✓ PASS${NC}"
    ((PASS++))
  else
    echo -e "  ${RED}✗ FAIL${NC}"
    echo "  Response: $response"
    ((FAIL++))
  fi
  echo "---"
}

# ============================================================
# TC-AUTH-001: Login Success - Admin
# ============================================================
echo "=== TC-AUTH-001: Login Success - Admin ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-AUTH-001" "200" "$HTTP_STATUS" "$BODY"

# Extract admin token for further tests
ADMIN_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Admin token extracted: ${ADMIN_TOKEN:0:20}..."

# ============================================================
# TC-AUTH-002: Login Success - Employee
# ============================================================
echo "=== TC-AUTH-002: Login Success - Employee ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"nguyenvana","password":"employee123"}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-AUTH-002" "200" "$HTTP_STATUS" "$BODY"

# Extract employee token
EMPLOYEE_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Employee token extracted: ${EMPLOYEE_TOKEN:0:20}..."

# ============================================================
# TC-AUTH-003: Login Failure - Invalid Password
# ============================================================
echo "=== TC-AUTH-003: Login Failure - Invalid Password ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-AUTH-003" "401" "$HTTP_STATUS" "$BODY"

# ============================================================
# TC-AUTH-401-001: No Token
# ============================================================
echo "=== TC-AUTH-401-001: No Token ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/auth/me")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-AUTH-401-001" "401" "$HTTP_STATUS" "$BODY"

# ============================================================
# TC-AUTH-401-002: Invalid Token
# ============================================================
echo "=== TC-AUTH-401-002: Invalid Token ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/auth/me" \
  -H "Cookie: token=invalid-token-format")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-AUTH-401-002" "401" "$HTTP_STATUS" "$BODY"

# ============================================================
# TC-AUTH-403-001: Employee Access Admin Stats (403)
# ============================================================
echo "=== TC-AUTH-403-001: Employee Access Admin Stats ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/admin/stats" \
  -H "Cookie: token=$EMPLOYEE_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-AUTH-403-001" "403" "$HTTP_STATUS" "$BODY"

# ============================================================
# TC-AUTH-403-002: Employee Access Admin Users (403)
# ============================================================
echo "=== TC-AUTH-403-002: Employee Access Admin Users ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/users" \
  -H "Cookie: token=$EMPLOYEE_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-AUTH-403-002" "403" "$HTTP_STATUS" "$BODY"

# ============================================================
# TC-USER-001: Get Current User (Me)
# ============================================================
echo "=== TC-USER-001: Get Current User ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/auth/me" \
  -H "Cookie: token=$ADMIN_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-USER-001" "200" "$HTTP_STATUS" "$BODY"

# ============================================================
# TC-USER-002: Get Daily Menus
# ============================================================
echo "=== TC-USER-002: Get Daily Menus ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/daily-menus" \
  -H "Cookie: token=$EMPLOYEE_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-USER-002" "200" "$HTTP_STATUS" "$BODY"

# ============================================================
# TC-USER-004: Get Registrations
# ============================================================
echo "=== TC-USER-004: Get Registrations ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/registrations" \
  -H "Cookie: token=$EMPLOYEE_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-USER-004" "200" "$HTTP_STATUS" "$BODY"

# ============================================================
# TC-USER-005: Logout
# ============================================================
echo "=== TC-USER-005: Logout ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/auth/logout" \
  -H "Cookie: token=$ADMIN_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-USER-005" "200" "$HTTP_STATUS" "$BODY"

# ============================================================
# TC-ADMIN-001: Admin Get Stats
# ============================================================
echo "=== TC-ADMIN-001: Admin Get Stats ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/admin/stats" \
  -H "Cookie: token=$ADMIN_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-ADMIN-001" "200" "$HTTP_STATUS" "$BODY"

# ============================================================
# TC-ADMIN-002: Admin Get Users
# ============================================================
echo "=== TC-ADMIN-002: Admin Get Users ==="
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$BASE_URL/api/users" \
  -H "Cookie: token=$ADMIN_TOKEN")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS.*//')

check_response "TC-ADMIN-002" "200" "$HTTP_STATUS" "$BODY"

# ============================================================
# Summary
# ============================================================
echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi
```

---

## 5. Traceability Matrix

| Test Case ID | Requirement | Priority | Status |
|--------------|-------------|----------|--------|
| TC-AUTH-001 | FR-AUTH-01 | P0 | ⬜ |
| TC-AUTH-002 | FR-AUTH-01 | P0 | ⬜ |
| TC-AUTH-003 | FR-AUTH-01 | P0 | ⬜ |
| TC-AUTH-004 | FR-AUTH-01 | P1 | ⬜ |
| TC-AUTH-005 | FR-AUTH-01 | P2 | ⬜ |
| TC-AUTH-401-001 | FR-AUTH-04 | P0 | ⬜ |
| TC-AUTH-401-002 | FR-AUTH-04 | P0 | ⬜ |
| TC-AUTH-401-003 | FR-AUTH-04 | P0 | ⬜ |
| TC-AUTH-403-001 | FR-AUTH-01 | P0 | ⬜ |
| TC-AUTH-403-002 | FR-AUTH-01 | P0 | ⬜ |
| TC-AUTH-403-003 | FR-AUTH-01 | P0 | ⬜ |
| TC-USER-001 | FR-AUTH-02 | P0 | ⬜ |
| TC-USER-002 | FR-EMP-05 | P0 | ⬜ |
| TC-USER-003 | FR-EMP-05 | P1 | ⬜ |
| TC-USER-004 | FR-EMP-03 | P0 | ⬜ |
| TC-USER-005 | FR-AUTH-04 | P1 | ⬜ |
| TC-ADMIN-001 | FR-ADMIN-01 | P0 | ⬜ |
| TC-ADMIN-002 | FR-ADMIN-02 | P0 | ⬜ |
| TC-ADMIN-003 | FR-ADMIN-02 | P1 | ⬜ |

---

## 6. Entry and Exit Criteria

### 6.1 Entry Criteria
- [ ] Dev server running at `http://localhost:3000`
- [ ] Database seeded with test accounts (admin, nguyenvana)
- [ ] Test script executable permissions set (`chmod +x`)

### 6.2 Exit Criteria
- [ ] All P0 test cases pass (100%)
- [ ] P1 test cases pass ≥ 90%
- [ ] No critical failures in P2 tests
- [ ] Test execution report generated

---

## 7. Deliverables

| Item | Description | Location |
|------|-------------|----------|
| Test Specification | This document | `docs/test-specs/api-auth-test-spec.md` |
| Test Script | Bash script with curl commands | `tests/bash/api-auth-tests.sh` |
| Test Report | Execution results | `test-results/api-auth-test-report.md` |

---

## 8. Appendices

### Appendix A: HTTP Status Code Reference

| Code | Meaning | When Expected |
|------|---------|---------------|
| 200 | OK | Successful GET/POST |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | No token / Invalid token |
| 403 | Forbidden | Wrong role (employee accessing admin) |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected error |

### Appendix B: Sample curl Commands Quick Reference

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get current user
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: token=<token>"

# Access admin endpoint
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Cookie: token=<token>"

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: token=<token>"
```

---

**Document End**