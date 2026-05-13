# Meals API Test Specifications
**Module:** Meal Management  
**Document ID:** BAOCOM-TEST-MEAL-001  
**Version:** 1.0  
**Date:** 2026-05-13

---

## 1. API Summary

| Endpoint | Method | Auth Required | Role |
|----------|--------|---------------|------|
| GET /api/meals | GET | Yes | Any |
| GET /api/meals/[id] | GET | Yes | Any |
| POST /api/meals | POST | Yes | Admin |
| PATCH /api/meals/[id] | PATCH | Yes | Admin |
| DELETE /api/meals/[id] | DELETE | Yes | Admin |

---

## 2. Test Cases

### TC-MEAL-001: List All Meals
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify meals are listed correctly |
| Pre-condition | Logged in as any user |
| Steps | 1. Send GET /api/meals |
| Expected Output | `200 OK` with `{"meals": [...]}` |
| Test Type | API |

---

### TC-MEAL-002: List Meals Filtered by Type
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify meals can be filtered by type |
| Steps | 1. Send GET /api/meals?type=main |
| Expected Output | `200 OK` with only meals of type "main" |
| Test Type | API |

---

### TC-MEAL-003: List Meals Without Auth
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify unauthenticated request is rejected |
| Steps | 1. Send GET /api/meals without cookie |
| Expected Output | `401 Unauthorized` |
| Test Type | API, Security |

---

### TC-MEAL-004: Get Meal by ID
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify specific meal can be retrieved |
| Pre-condition | Meal ID exists |
| Steps | 1. Send GET /api/meals/[id] |
| Expected Output | `200 OK` with meal data |
| Test Type | API |

---

### TC-MEAL-005: Get Non-existent Meal
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify 404 for non-existent meal |
| Steps | 1. Send GET /api/meals/nonexistent-id |
| Expected Output | `404 Not Found` |
| Test Type | API |

---

### TC-MEAL-006: Create Meal Successfully
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can create new meal |
| Pre-condition | Logged in as admin |
| Steps | 1. Send POST /api/meals with `{"name": "New Meal", "type": "main"}` |
| Expected Output | `201 Created` with created meal data |
| Test Type | API |

---

### TC-MEAL-007: Create Meal with Invalid Type
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify validation rejects invalid meal type |
| Steps | 1. Send POST /api/meals with `{"name": "Test", "type": "invalid"}` |
| Expected Output | `400 Bad Request` |
| Test Type | API |

---

### TC-MEAL-008: Create Meal as Employee (Forbidden)
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify non-admin cannot create meals |
| Pre-condition | Logged in as employee |
| Steps | 1. Send POST /api/meals |
| Expected Output | `403 Forbidden` |
| Test Type | API, Security |

---

### TC-MEAL-009: Update Meal Successfully
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can update meal |
| Pre-condition | Meal exists |
| Steps | 1. Send PATCH /api/meals/[id] with `{"name": "Updated Meal"}` |
| Expected Output | `200 OK` with updated data |
| Test Type | API |

---

### TC-MEAL-010: Delete Meal Successfully
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can delete meal |
| Pre-condition | Meal exists and not in use |
| Steps | 1. Send DELETE /api/meals/[id] |
| Expected Output | `200 OK` or `204 No Content` |
| Test Type | API |

---

### TC-MEAL-011: Delete Meal in Daily Menu
**Priority:** Medium  
**Type:** Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify meal used in daily menu cannot be deleted |
| Pre-condition | Meal is in an active daily menu |
| Steps | 1. Send DELETE /api/meals/[id] |
| Expected Output | `400 Bad Request` or error about constraint |
| Test Type | API |

---

### TC-MEAL-012: List Inactive Meals
**Priority:** Low  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify inactive meals are excluded by default |
| Steps | 1. Send GET /api/meals |
| Expected Output | Only meals with `isActive: true` |
| Test Type | API |

---

## 3. Security Test Cases

### TC-MEAL-SEC-001: Authorization Check
**Priority:** Critical  
**Type:** Security

| Field | Value |
|-------|-------|
| Description | Verify employee cannot access admin endpoints |
| Steps | 1. As employee, send POST /api/meals |
| Expected Output | `403 Forbidden` |
| Test Type | Security |

---

### TC-MEAL-SEC-002: Input Validation
**Priority:** High  
**Type:** Security

| Field | Value |
|-------|-------|
| Description | Verify special characters are sanitized |
| Steps | 1. Send POST /api/meals with `{"name": "'; DROP TABLE meals; --", "type": "main"}` |
| Expected Output | Input sanitized or `400 Bad Request` |
| Test Type | Security |

---

## 4. Test Execution Checklist

| Test Case | Status | Executed By | Date |
|-----------|--------|-------------|------|
| TC-MEAL-001 | [ ] | | |
| TC-MEAL-002 | [ ] | | |
| TC-MEAL-003 | [ ] | | |
| TC-MEAL-004 | [ ] | | |
| TC-MEAL-005 | [ ] | | |
| TC-MEAL-006 | [ ] | | |
| TC-MEAL-007 | [ ] | | |
| TC-MEAL-008 | [ ] | | |
| TC-MEAL-009 | [ ] | | |
| TC-MEAL-010 | [ ] | | |
| TC-MEAL-011 | [ ] | | |
| TC-MEAL-012 | [ ] | | |
| TC-MEAL-SEC-001 | [ ] | | |
| TC-MEAL-SEC-002 | [ ] | | |

---

**Test Summary:**
- Total Test Cases: 14
- Critical: 3
- High: 7
- Medium: 3
- Low: 1