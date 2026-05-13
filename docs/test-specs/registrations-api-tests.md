# Registrations API Test Specifications
**Module:** Meal Registration  
**Document ID:** BAOCOM-TEST-REG-001  
**Version:** 1.0  
**Date:** 2026-05-13

---

## 1. API Summary

| Endpoint | Method | Auth Required | Role |
|----------|--------|---------------|------|
| GET /api/registrations | GET | Yes | Any |
| POST /api/registrations | POST | Yes | Any |
| PATCH /api/registrations/[id] | PATCH | Yes | Any |
| DELETE /api/registrations/[id] | DELETE | Yes | Any |

---

## 2. Test Cases

### TC-REG-001: List Own Registrations
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify user can list their registrations |
| Pre-condition | User has registrations |
| Steps | 1. Send GET /api/registrations with user cookie |
| Expected Output | `200 OK` with user's registrations |
| Test Type | API |

---

### TC-REG-002: List Registrations with Date Filter
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify registrations can be filtered by date range |
| Steps | 1. Send GET /api/registrations?startDate=2026-05-01&endDate=2026-05-31 |
| Expected Output | `200 OK` with filtered registrations |
| Test Type | API |

---

### TC-REG-003: Register for Meal (Eating)
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify user can register as eating |
| Pre-condition | No existing registration for date |
| Steps | 1. Send POST /api/registrations with `{"date": "2026-05-15", "status": "eating"}` |
| Expected Output | `201 Created` with registration data |
| Test Type | API |

---

### TC-REG-004: Register for Meal (Not Eating)
**Priority:** High  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify user can register as not eating |
| Steps | 1. Send POST /api/registrations with `{"date": "2026-05-16", "status": "not_eating"}` |
| Expected Output | `201 Created` |
| Test Type | API |

---

### TC-REG-005: Register with Invalid Status
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify invalid status is rejected |
| Steps | 1. Send POST /api/registrations with `{"date": "2026-05-15", "status": "maybe"}` |
| Expected Output | `400 Bad Request` |
| Test Type | API |

---

### TC-REG-006: Register for Past Date
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify registration for past date |
| Steps | 1. Send POST /api/registrations with `{"date": "2020-01-01", "status": "eating"}` |
| Expected Output | `201 Created` or validation warning |
| Test Type | API |

---

### TC-REG-007: Update Registration Status
**Priority:** Critical  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify user can change their registration |
| Pre-condition | Registration exists |
| Steps | 1. Send PATCH /api/registrations/[id] with `{"status": "not_eating"}` |
| Expected Output | `200 OK` with updated data |
| Test Type | API |

---

### TC-REG-008: Update Registration with Note
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify note can be added to registration |
| Steps | 1. Send PATCH /api/registrations/[id] with `{"note": "Will be late"}` |
| Expected Output | `200 OK` with note saved |
| Test Type | API |

---

### TC-REG-009: Update Another User's Registration (Forbidden)
**Priority:** Critical  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify user cannot modify others' registrations |
| Pre-condition | User A and User B both have registrations |
| Steps | 1. As User A, send PATCH /api/registrations/[user-b-id] |
| Expected Output | `403 Forbidden` |
| Test Type | API, Security |

---

### TC-REG-010: Delete Own Registration
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify user can delete their registration |
| Pre-condition | Registration exists |
| Steps | 1. Send DELETE /api/registrations/[id] |
| Expected Output | `200 OK` or `204 No Content` |
| Test Type | API |

---

### TC-REG-011: Delete Another User's Registration (Forbidden)
**Priority:** Critical  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify user cannot delete others' registrations |
| Steps | 1. As User A, send DELETE /api/registrations/[user-b-id] |
| Expected Output | `403 Forbidden` |
| Test Type | API, Security |

---

### TC-REG-012: Admin Can Update Any Registration
**Priority:** High  
**Type:** Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can modify any user's registration |
| Pre-condition | Admin logged in |
| Steps | 1. As admin, send PATCH /api/registrations/[user-id] with new status |
| Expected Output | `200 OK` |
| Test Type | API |

---

## 3. Security Test Cases

### TC-REG-SEC-001: IDOR Prevention
**Priority:** Critical  
**Type:** Security

| Field | Value |
|-------|-------|
| Description | Verify users cannot access/modify other users' registrations |
| Steps | 1. Try to access GET /api/registrations/[other-id] |
| Expected Output | `403 Forbidden` or only own registrations returned |
| Test Type | Security |

---

### TC-REG-SEC-002: Admin Bypass
**Priority:** High  
**Type:** Security

| Field | Value |
|-------|-------|
| Description | Verify admin role properly authorized |
| Steps | 1. As admin, verify ability to access all endpoints |
| Expected Output | Admin has full access |
| Test Type | Security |

---

## 4. Test Execution Checklist

| Test Case | Status | Executed By | Date |
|-----------|--------|-------------|------|
| TC-REG-001 | [ ] | | |
| TC-REG-002 | [ ] | | |
| TC-REG-003 | [ ] | | |
| TC-REG-004 | [ ] | | |
| TC-REG-005 | [ ] | | |
| TC-REG-006 | [ ] | | |
| TC-REG-007 | [ ] | | |
| TC-REG-008 | [ ] | | |
| TC-REG-009 | [ ] | | |
| TC-REG-010 | [ ] | | |
| TC-REG-011 | [ ] | | |
| TC-REG-012 | [ ] | | |
| TC-REG-SEC-001 | [ ] | | |
| TC-REG-SEC-002 | [ ] | | |

---

**Test Summary:**
- Total Test Cases: 14
- Critical: 6
- High: 5
- Medium: 3