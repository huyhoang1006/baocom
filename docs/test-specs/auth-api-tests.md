# Auth API Test Specifications
**Module:** Authentication  
**Document ID:** BAOCOM-TEST-AUTH-001  
**Version:** 1.0  
**Date:** 2026-05-13

---

## 1. API Summary

| Endpoint | Method | Auth Required | Role |
|----------|--------|---------------|------|
| POST /api/auth/login | POST | No | Public |
| POST /api/auth/logout | POST | No | Public |
| GET /api/auth/me | GET | Yes | Any |

---

## 2. Test Cases

### TC-AUTH-001: Login with Valid Credentials
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify user can login with valid username and password |
| Pre-condition | User account exists with username: `admin`, password: `admin123` |
| Steps | 1. Send POST /api/auth/login with `{"username": "admin", "password": "admin123"}` |
| Input | `{"username": "admin", "password": "admin123"}` |
| Expected Output | `200 OK` with `{"user": {"id": "...", "username": "admin", "name": "...", "role": "admin"}}` and `Set-Cookie: token=...` |
| Test Type | API |

---

### TC-AUTH-002: Login with Invalid Username
**Priority:** High  
**Type:** Unit, Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify login fails with non-existent username |
| Pre-condition | User account does not exist |
| Steps | 1. Send POST /api/auth/login with `{"username": "nonexistent", "password": "any"}` |
| Input | `{"username": "nonexistent", "password": "any"}` |
| Expected Output | `401 Unauthorized` with `{"error": "Invalid credentials"}` |
| Test Type | API, Security |

---

### TC-AUTH-003: Login with Invalid Password
**Priority:** High  
**Type:** Unit, Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify login fails with wrong password |
| Pre-condition | User account exists with password `admin123` |
| Steps | 1. Send POST /api/auth/login with `{"username": "admin", "password": "wrongpassword"}` |
| Input | `{"username": "admin", "password": "wrongpassword"}` |
| Expected Output | `401 Unauthorized` with `{"error": "Invalid credentials"}` |
| Test Type | API, Security |

---

### TC-AUTH-004: Login with Missing Username
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify login fails when username is missing |
| Steps | 1. Send POST /api/auth/login with `{"password": "admin123"}` |
| Input | `{"password": "admin123"}` |
| Expected Output | `400 Bad Request` with `{"error": "Missing username or password"}` |
| Test Type | API |

---

### TC-AUTH-005: Login with Missing Password
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify login fails when password is missing |
| Steps | 1. Send POST /api/auth/login with `{"username": "admin"}` |
| Input | `{"username": "admin"}` |
| Expected Output | `400 Bad Request` with `{"error": "Missing username or password"}` |
| Test Type | API |

---

### TC-AUTH-006: Login with Empty Body
**Priority:** Medium  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify login fails with empty JSON body |
| Steps | 1. Send POST /api/auth/login with `{}` |
| Input | `{}` |
| Expected Output | `400 Bad Request` with `{"error": "Missing username or password"}` |
| Test Type | API |

---

### TC-AUTH-007: Logout Successfully
**Priority:** High  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify user can logout successfully |
| Pre-condition | User is logged in with valid token |
| Steps | 1. Send POST /api/auth/logout with cookie |
| Input | Cookie header with valid token |
| Expected Output | `200 OK` and token cookie cleared |
| Test Type | API |

---

### TC-AUTH-008: Get Current User Profile
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify authenticated user can get their profile |
| Pre-condition | User is logged in with valid token |
| Steps | 1. Send GET /api/auth/me with cookie |
| Input | Cookie header with valid token |
| Expected Output | `200 OK` with `{"user": {"id": "...", "username": "...", "name": "...", "role": "..."}}` |
| Test Type | API |

---

### TC-AUTH-009: Get Profile Without Auth
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify unauthenticated request is rejected |
| Steps | 1. Send GET /api/auth/me without cookie |
| Input | No cookie header |
| Expected Output | `401 Unauthorized` with `{"error": "Unauthorized"}` |
| Test Type | API, Security |

---

### TC-AUTH-010: Get Profile with Invalid Token
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify invalid token is rejected |
| Steps | 1. Send GET /api/auth/me with invalid cookie |
| Input | Cookie with `token=invalid_token` |
| Expected Output | `401 Unauthorized` with `{"error": "Invalid token"}` |
| Test Type | API, Security |

---

## 3. Security Test Cases

### TC-AUTH-SEC-001: SQL Injection in Login
**Priority:** Critical  
**Type:** Security

| Field | Value |
|-------|-------|
| Description | Verify SQL injection attempts are sanitized |
| Steps | 1. Send POST /api/auth/login with `{"username": "' OR 1=1 --", "password": "any"}` |
| Input | SQL injection payload |
| Expected Output | `401 Unauthorized` - no data access |
| Test Type | Security |

---

### TC-AUTH-SEC-002: Brute Force Attack Prevention
**Priority:** Critical  
**Type:** Security

| Field | Value |
|-------|-------|
| Description | Verify multiple failed logins don't expose data |
| Steps | 1. Attempt 10 failed logins rapidly |
| Input | Wrong passwords each time |
| Expected Output | All return `401`, no information leakage about which fields are valid |
| Test Type | Security |

---

## 4. Test Execution Checklist

| Test Case | Status | Executed By | Date |
|-----------|--------|-------------|------|
| TC-AUTH-001 | [ ] | | |
| TC-AUTH-002 | [ ] | | |
| TC-AUTH-003 | [ ] | | |
| TC-AUTH-004 | [ ] | | |
| TC-AUTH-005 | [ ] | | |
| TC-AUTH-006 | [ ] | | |
| TC-AUTH-007 | [ ] | | |
| TC-AUTH-008 | [ ] | | |
| TC-AUTH-009 | [ ] | | |
| TC-AUTH-010 | [ ] | | |
| TC-AUTH-SEC-001 | [ ] | | |
| TC-AUTH-SEC-002 | [ ] | | |

---

**Test Summary:**
- Total Test Cases: 12
- Critical: 4
- High: 6
- Medium: 2