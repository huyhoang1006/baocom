# Admin API Test Specifications
**Module:** Admin Management  
**Document ID:** BAOCOM-TEST-ADMIN-001  
**Version:** 1.0  
**Date:** 2026-05-13

---

## 1. API Summary

| Endpoint | Method | Auth Required | Role |
|----------|--------|---------------|------|
| GET /api/admin/stats | GET | Yes | Admin |
| GET /api/admin/reports | GET | Yes | Admin |

---

## 2. Test Cases

### TC-ADMIN-001: Get Today's Stats
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can get today's registration statistics |
| Pre-condition | Logged in as admin |
| Steps | 1. Send GET /api/admin/stats with admin cookie |
| Expected Output | `200 OK` with `{"eating": N, "notEating": M, "total": X}` |
| Test Type | API |

---

### TC-ADMIN-002: Stats Include Correct Counts
**Priority:** High  
**Type:** Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify stats count matches actual registrations |
| Pre-condition | Known number of registrations for today |
| Steps | 1. Send GET /api/admin/stats |
| Expected Output | Counts match database |
| Test Type | API |

---

### TC-ADMIN-003: Stats for Date with No Registrations
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify stats return zeros for date with no registrations |
| Steps | 1. Send GET /api/admin/stats for future date |
| Expected Output | `200 OK` with `{"eating": 0, "notEating": 0, "total": 0}` |
| Test Type | API |

---

### TC-ADMIN-004: Get Registration Report
**Priority:** Critical  
**Type:** Unit, Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify admin can get detailed registration report |
| Steps | 1. Send GET /api/admin/reports?startDate=2026-05-01&endDate=2026-05-31 |
| Expected Output | `200 OK` with report data |
| Test Type | API |

---

### TC-ADMIN-005: Report with Date Range
**Priority:** High  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify report filters by date range |
| Steps | 1. Send GET /api/admin/reports?startDate=2026-05-01&endDate=2026-05-15 |
| Expected Output | Only registrations within range |
| Test Type | API |

---

### TC-ADMIN-006: Report Excludes Sundays
**Priority:** High  
**Type:** Integration, API Functional

| Field | Value |
|-------|-------|
| Description | Verify Sundays are excluded from report by default |
| Pre-condition | Registrations exist on Sundays |
| Steps | 1. Send GET /api/admin/reports?startDate=2026-05-01&endDate=2026-05-31 |
| Expected Output | Sunday registrations excluded |
| Test Type | API |

---

### TC-ADMIN-007: Report Include Sundays Option
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify Sundays can be included |
| Steps | 1. Send GET /api/admin/reports?startDate=...&endDate=...&includeSundays=true |
| Expected Output | All days including Sundays |
| Test Type | API |

---

### TC-ADMIN-008: Report Grouped by Date
**Priority:** Medium  
**Type:** API Functional

| Field | Value |
|-------|-------|
| Description | Verify report includes date grouping |
| Steps | 1. Send GET /api/admin/reports |
| Expected Output | `{"stats": {"byDate": {"2026-05-01": N, ...}}}` |
| Test Type | API |

---

## 3. Security Test Cases

### TC-ADMIN-SEC-001: Employee Cannot Access Stats
**Priority:** Critical  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify non-admin is forbidden from admin endpoints |
| Pre-condition | Logged in as employee |
| Steps | 1. Send GET /api/admin/stats |
| Expected Output | `403 Forbidden` |
| Test Type | API, Security |

---

### TC-ADMIN-SEC-002: Employee Cannot Access Reports
**Priority:** Critical  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify non-admin is forbidden from reports |
| Pre-condition | Logged in as employee |
| Steps | 1. Send GET /api/admin/reports |
| Expected Output | `403 Forbidden` |
| Test Type | API, Security |

---

### TC-ADMIN-SEC-003: Unauthenticated Cannot Access
**Priority:** Critical  
**Type:** Security, API Functional

| Field | Value |
|-------|-------|
| Description | Verify unauthenticated request is rejected |
| Steps | 1. Send GET /api/admin/stats without cookie |
| Expected Output | `401 Unauthorized` |
| Test Type | API, Security |

---

### TC-ADMIN-SEC-004: Report Data Privacy
**Priority:** High  
**Type:** Security

| Field | Value |
|-------|-------|
| Description | Verify report only shows user names, not passwords or tokens |
| Steps | 1. Send GET /api/admin/reports |
| Expected Output | Response contains only name, username, date - no sensitive data |
| Test Type | Security |

---

## 4. Test Execution Checklist

| Test Case | Status | Executed By | Date |
|-----------|--------|-------------|------|
| TC-ADMIN-001 | [ ] | | |
| TC-ADMIN-002 | [ ] | | |
| TC-ADMIN-003 | [ ] | | |
| TC-ADMIN-004 | [ ] | | |
| TC-ADMIN-005 | [ ] | | |
| TC-ADMIN-006 | [ ] | | |
| TC-ADMIN-007 | [ ] | | |
| TC-ADMIN-008 | [ ] | | |
| TC-ADMIN-SEC-001 | [ ] | | |
| TC-ADMIN-SEC-002 | [ ] | | |
| TC-ADMIN-SEC-003 | [ ] | | |
| TC-ADMIN-SEC-004 | [ ] | | |

---

**Test Summary:**
- Total Test Cases: 12
- Critical: 6
- High: 4
- Medium: 2

---

## 5. Acceptance Test Cases

### TC-ACCEPT-001: Full Registration Workflow
**Priority:** Critical  
**Type:** Acceptance

| Field | Value |
|-------|-------|
| User Story | As an employee, I want to register for meals |
| Scenario | 1. Login as employee → 2. View available meals → 3. Register for today as "eating" → 4. View my registrations → 5. Update to "not_eating" → 6. Delete registration |
| Success Criteria | All steps complete successfully |
| Test Type | Acceptance |

---

### TC-ACCEPT-002: Admin Reporting Workflow
**Priority:** Critical  
**Type:** Acceptance

| Field | Value |
|-------|-------|
| User Story | As an admin, I want to generate meal reports |
| Scenario | 1. Login as admin → 2. View today's stats → 3. Generate monthly report → 4. Verify counts match → 5. Export report |
| Success Criteria | Report matches actual registration data |
| Test Type | Acceptance |

---

### TC-ACCEPT-003: Security Verification
**Priority:** Critical  
**Type:** Acceptance

| Field | Value |
|-------|-------|
| User Story | Verify system security |
| Scenario | 1. Try unauthorized access → 2. Try unauthorized admin access → 3. Try SQL injection → 4. Verify all blocked |
| Success Criteria | No security breaches |
| Test Type | Acceptance |