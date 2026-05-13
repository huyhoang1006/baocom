# Users API Test Specifications
**Module:** User Management  
**Document ID:** BAOCOM-TEST-USER-001  
**Version:** 1.0  
**Date:** 2026-05-13

---

## 1. API Summary

| Endpoint | Method | Auth Required | Role |
|----------|--------|---------------|------|
| GET /api/users | GET | Yes | Admin |
| GET /api/users/[id] | GET | Yes | Admin |
| POST /api/users | POST | Yes | Admin |
| PATCH /api/users/[id] | PATCH | Yes | Admin |
| DELETE /api/users/[id] | DELETE | Yes | Admin |

---

## 2. Test Cases

### TC-USER-001: List All Users (Admin)
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can list all users |
| Pre-condition | Logged in as admin |
| Steps | 1. Send GET /api/users with admin cookie |
| Input | Admin auth cookie |
| Expected Output | `200 OK` with `{"users": [...]}` |
| Test Type | API |

---

### TC-USER-002: List Users Without Auth
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify unauthenticated request is rejected |
| Steps | 1. Send GET /api/users without cookie |
| Expected Output | `401 Unauthorized` |
| Test Type | API, Security |

---

### TC-USER-003: List Users as Employee
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify non-admin user is forbidden |
| Pre-condition | Logged in as employee |
| Steps | 1. Send GET /api/users with employee cookie |
| Expected Output | `403 Forbidden` |
| Test Type | API, Security |

---

### TC-USER-004: Get User by ID
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can get specific user |
| Pre-condition | Logged in as admin, user ID exists |
| Steps | 1. Send GET /api/users/[id] with admin cookie |
| Expected Output | `200 OK` with user data |
| Test Type | API |

---

### TC-USER-005: Get Non-existent User
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify 404 for non-existent user |
| Steps | 1. Send GET /api/users/nonexistent-id |
| Expected Output | `404 Not Found` |
| Test Type | API |

---

### TC-USER-006: Create User Successfully
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can create new user |
| Pre-condition | Logged in as admin |
| Steps | 1. Send POST /api/users with valid data |
| Input | `{"username": "newuser", "password": "pass123", "name": "New User", "role": "employee"}` |
| Expected Output | `201 Created` with created user data |
| Test Type | API |

---

### TC-USER-007: Create User with Duplicate Username
**Priority:** High  
**Type:** Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify error when username already exists |
| Pre-condition | User with username `admin` exists |
| Steps | 1. Send POST /api/users with `{"username": "admin", ...}` |
| Expected Output | `409 Conflict` or error message |
| Test Type | API |

---

### TC-USER-008: Create User with Missing Fields
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify validation errors for missing required fields |
| Steps | 1. Send POST /api/users with `{"username": "test"}` (missing password, name) |
| Expected Output | `400 Bad Request` with validation error |
| Test Type | API |

---

### TC-USER-009: Update User Successfully
**Priority:** Critical  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can update user details |
| Pre-condition | User exists |
| Steps | 1. Send PATCH /api/users/[id] with `{"name": "Updated Name"}` |
| Expected Output | `200 OK` with updated user data |
| Test Type | API |

---

### TC-USER-010: Update User with Invalid Role
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify validation rejects invalid role |
| Steps | 1. Send PATCH /api/users/[id] with `{"role": "superadmin"}` |
| Expected Output | `400 Bad Request` or validation error |
| Test Type | API |

---

### TC-USER-011: Delete User Successfully
**Priority:** Critical  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can delete user |
| Pre-condition | User exists that is not current admin |
| Steps | 1. Send DELETE /api/users/[id] |
| Expected Output | `200 OK` or `204 No Content` |
| Test Type | API |

---

### TC-USER-012: Delete Non-existent User
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify appropriate response for non-existent user |
| Steps | 1. Send DELETE /api/users/nonexistent-id |
| Expected Output | `404 Not Found` |
| Test Type | API |

---

### TC-USER-013: Delete Self (Prevented)
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin cannot delete their own account |
| Pre-condition | Logged in as admin |
| Steps | 1. Send DELETE /api/users/[own-id] |
| Expected Output | `400 Bad Request` or `403 Forbidden` |
| Test Type | API, Security |

---

### TC-USER-014: Update Password
**Priority:** High  
**Type:** Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify password can be updated |
| Pre-condition | User exists |
| Steps | 1. Send PATCH /api/users/[id] with `{"password": "newpass123"}` |
| Expected Output | `200 OK`, user can login with new password |
| Test Type | API |

---

### TC-USER-015: Inactive User Cannot Login
**Priority:** High  
**Type:** Integration, Security

| Field | Value |
|-------|-------|
| Description | Verify inactive user is rejected at login |
| Pre-condition | User exists but `isActive: false` |
| Steps | 1. Attempt login with inactive user credentials |
| Expected Output | `401 Unauthorized` |
| Test Type | Security |

---

## 3. Security Test Cases

### TC-USER-SEC-001: IDOR Prevention
**Priority:** Critical  
**Type:** Security

| Field | Value |
|-------|-------|
| Description | Verify users cannot access other users' data |
| Steps | 1. As employee, try to access GET /api/users/[other-id] |
| Expected Output | `403 Forbidden` |
| Test Type | Security |

---

### TC-USER-SEC-002: Input Validation
**Priority:** High  
**Type:** Security

| Field | Value |
|-------|-------|
| Description | Verify XSS and script injection are sanitized |
| Steps | 1. Send POST /api/users with `{"name": "<script>alert(1)</script>"}` |
| Expected Output | Input sanitized or `400 Bad Request` |
| Test Type | Security |

---

## 4. Test Execution Checklist

| Test Case | Status | Executed By | Date |
|-----------|--------|-------------|------|
| TC-USER-001 | [ ] | | |
| TC-USER-002 | [ ] | | |
| TC-USER-003 | [ ] | | |
| TC-USER-004 | [ ] | | |
| TC-USER-005 | [ ] | | |
| TC-USER-006 | [ ] | | |
| TC-USER-007 | [ ] | | |
| TC-USER-008 | [ ] | | |
| TC-USER-009 | [ ] | | |
| TC-USER-010 | [ ] | | |
| TC-USER-011 | [ ] | | |
| TC-USER-012 | [ ] | | |
| TC-USER-013 | [ ] | | |
| TC-USER-014 | [ ] | | |
| TC-USER-015 | [ ] | | |
| TC-USER-SEC-001 | [ ] | | |
| TC-USER-SEC-002 | [ ] | | |

---

**Test Summary:**
- Total Test Cases: 17
- Critical: 5
- High: 9
- Medium: 3