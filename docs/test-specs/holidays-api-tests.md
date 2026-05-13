# Holidays API Test Specifications
**Module:** Holiday Management  
**Document ID:** BAOCOM-TEST-HOL-001  
**Version:** 1.0  
**Date:** 2026-05-13

---

## 1. API Summary

| Endpoint | Method | Auth Required | Role |
|----------|--------|---------------|------|
| GET /api/holidays | GET | Yes | Any |
| POST /api/holidays | POST | Yes | Admin |
| PATCH /api/holidays/[id] | PATCH | Yes | Admin |
| DELETE /api/holidays/[id] | DELETE | Yes | Admin |

---

## 2. Test Cases

### TC-HOL-001: List All Holidays
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify holidays are listed |
| Pre-condition | Logged in |
| Steps | 1. Send GET /api/holidays |
| Expected Output | `200 OK` with `{"holidays": [...]}` |
| Test Type | API |

---

### TC-HOL-002: List Active Holidays Only
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify inactive holidays are filtered by default |
| Steps | 1. Send GET /api/holidays |
| Expected Output | Only holidays with `isActive: true` |
| Test Type | API |

---

### TC-HOL-003: List Holidays Without Auth
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify unauthenticated request is rejected |
| Steps | 1. Send GET /api/holidays without cookie |
| Expected Output | `401 Unauthorized` |
| Test Type | API, Security |

---

### TC-HOL-004: Get Holiday by ID
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify specific holiday can be retrieved |
| Steps | 1. Send GET /api/holidays/[id] |
| Expected Output | `200 OK` with holiday data |
| Test Type | API |

---

### TC-HOL-005: Create Holiday Successfully
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can create holiday |
| Pre-condition | Logged in as admin |
| Steps | 1. Send POST /api/holidays with `{"date": "2026-05-20", "description": "Company anniversary"}` |
| Expected Output | `201 Created` with holiday data |
| Test Type | API |

---

### TC-HOL-006: Create Holiday with Duplicate Date
**Priority:** High  
**Type:** Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify error on duplicate date |
| Pre-condition | Holiday exists for date |
| Steps | 1. Send POST /api/holidays with existing date |
| Expected Output | `409 Conflict` or error |
| Test Type | API |

---

### TC-HOL-007: Update Holiday
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can update holiday details |
| Steps | 1. Send PATCH /api/holidays/[id] with `{"description": "Updated description"}` |
| Expected Output | `200 OK` with updated data |
| Test Type | API |

---

### TC-HOL-008: Deactivate Holiday
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can deactivate holiday |
| Steps | 1. Send PATCH /api/holidays/[id] with `{"isActive": false}` |
| Expected Output | `200 OK`, holiday no longer appears in list |
| Test Type | API |

---

### TC-HOL-009: Delete Holiday
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can delete holiday |
| Steps | 1. Send DELETE /api/holidays/[id] |
| Expected Output | `200 OK` or `204 No Content` |
| Test Type | API |

---

### TC-HOL-010: Create Holiday as Employee (Forbidden)
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify non-admin cannot create holidays |
| Pre-condition | Logged in as employee |
| Steps | 1. Send POST /api/holidays |
| Expected Output | `403 Forbidden` |
| Test Type | API, Security |

---

## 3. Security Test Cases

### TC-HOL-SEC-001: Authorization Check
**Priority:** Critical  
**Type:** Security

| Field | Value |
|-------|-------|
| Description | Verify employee cannot access admin endpoints |
| Steps | 1. As employee, send POST /api/holidays |
| Expected Output | `403 Forbidden` |
| Test Type | Security |

---

### TC-HOL-SEC-002: Invalid Date Format
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify invalid date formats are handled |
| Steps | 1. Send POST /api/holidays with `{"date": "not-a-date", ...}` |
| Expected Output | `400 Bad Request` |
| Test Type | Security |

---

## 4. Test Execution Checklist

| Test Case | Status | Executed By | Date |
|-----------|--------|-------------|------|
| TC-HOL-001 | [ ] | | |
| TC-HOL-002 | [ ] | | |
| TC-HOL-003 | [ ] | | |
| TC-HOL-004 | [ ] | | |
| TC-HOL-005 | [ ] | | |
| TC-HOL-006 | [ ] | | |
| TC-HOL-007 | [ ] | | |
| TC-HOL-008 | [ ] | | |
| TC-HOL-009 | [ ] | | |
| TC-HOL-010 | [ ] | | |
| TC-HOL-SEC-001 | [ ] | | |
| TC-HOL-SEC-002 | [ ] | | |

---

**Test Summary:**
- Total Test Cases: 12
- Critical: 3
- High: 7
- Medium: 2