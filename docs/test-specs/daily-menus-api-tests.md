# Daily Menus API Test Specifications
**Module:** Daily Menu Management  
**Document ID:** BAOCOM-TEST-DM-001  
**Version:** 1.0  
**Date:** 2026-05-13

---

## 1. API Summary

| Endpoint | Method | Auth Required | Role |
|----------|--------|---------------|------|
| GET /api/daily-menus | GET | Yes | Any |
| GET /api/daily-menus/[date] | GET | Yes | Any |
| POST /api/daily-menus | POST | Yes | Admin |
| PUT /api/daily-menus/[date] | PUT | Yes | Admin |

---

## 2. Test Cases

### TC-DM-001: List Daily Menus
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify all daily menus are listed |
| Pre-condition | Logged in |
| Steps | 1. Send GET /api/daily-menus |
| Expected Output | `200 OK` with `{"menus": [...]}` |
| Test Type | API |

---

### TC-DM-002: List Daily Menus with Limit
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify limit parameter works |
| Steps | 1. Send GET /api/daily-menus?take=5 |
| Expected Output | `200 OK` with max 5 menus |
| Test Type | API |

---

### TC-DM-003: Get Daily Menu by Date
**Priority:** Critical  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify menu for specific date can be retrieved |
| Steps | 1. Send GET /api/daily-menus/2026-05-13 |
| Expected Output | `200 OK` with menu data including meals |
| Test Type | API |

---

### TC-DM-004: Get Non-existent Date
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify 404 for date with no menu |
| Steps | 1. Send GET /api/daily-menus/2030-01-01 |
| Expected Output | `200 OK` with `{"dailyMenu": null}` |
| Test Type | API |

---

### TC-DM-005: Create Daily Menu Successfully
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can create daily menu |
| Pre-condition | Logged in as admin, valid meal IDs exist |
| Steps | 1. Send POST /api/daily-menus with `{"date": "2026-05-20", "mealIds": ["meal1", "meal2"]}` |
| Expected Output | `201 Created` with menu data |
| Test Type | API |

---

### TC-DM-006: Create Daily Menu with Invalid Meal ID
**Priority:** High  
**Type:** Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify error when meal ID doesn't exist |
| Steps | 1. Send POST /api/daily-menus with `{"date": "2026-05-20", "mealIds": ["invalid-id"]}` |
| Expected Output | `400 Bad Request` with error about invalid mealIds |
| Test Type | API |

---

### TC-DM-007: Create Daily Menu with Inactive Meal
**Priority:** High  
**Type:** Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify inactive meals are rejected |
| Steps | 1. Send POST /api/daily-menus with mealIds containing inactive meal |
| Expected Output | `400 Bad Request` |
| Test Type | API |

---

### TC-DM-008: Update Daily Menu (Replace Meals)
**Priority:** High  
**Type:** Unit, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can update menu by replacing meals |
| Pre-condition | Menu exists for date |
| Steps | 1. Send PUT /api/daily-menus/2026-05-13 with `{"mealIds": ["meal1"]}` |
| Expected Output | `200 OK` with updated menu |
| Test Type | API |

---

### TC-DM-009: Create Duplicate Date Menu
**Priority:** Medium  
**Type:** Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify upsert behavior for existing date |
| Pre-condition | Menu exists for date |
| Steps | 1. Send POST /api/daily-menus with same date |
| Expected Output | `200 OK` with updated menu (upsert) |
| Test Type | API |

---

### TC-DM-010: Create Menu Without Auth
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify unauthenticated request is rejected |
| Steps | 1. Send POST /api/daily-menus without cookie |
| Expected Output | `401 Unauthorized` |
| Test Type | API, Security |

---

## 3. Security Test Cases

### TC-DM-SEC-001: Authorization Check
**Priority:** Critical  
**Type:** Security

| Field | Value |
|-------|-------|
| Description | Verify employee cannot create/update menus |
| Steps | 1. As employee, send POST /api/daily-menus |
| Expected Output | `403 Forbidden` |
| Test Type | Security |

---

### TC-DM-SEC-002: Invalid Date Format
**Priority:** High  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify invalid date formats are rejected |
| Steps | 1. Send GET /api/daily-menus/not-a-date |
| Expected Output | `400 Bad Request` or error |
| Test Type | Security |

---

## 4. Test Execution Checklist

| Test Case | Status | Executed By | Date |
|-----------|--------|-------------|------|
| TC-DM-001 | [ ] | | |
| TC-DM-002 | [ ] | | |
| TC-DM-003 | [ ] | | |
| TC-DM-004 | [ ] | | |
| TC-DM-005 | [ ] | | |
| TC-DM-006 | [ ] | | |
| TC-DM-007 | [ ] | | |
| TC-DM-008 | [ ] | | |
| TC-DM-009 | [ ] | | |
| TC-DM-010 | [ ] | | |
| TC-DM-SEC-001 | [ ] | | |
| TC-DM-SEC-002 | [ ] | | |

---

**Test Summary:**
- Total Test Cases: 12
- Critical: 4
- High: 6
- Medium: 2