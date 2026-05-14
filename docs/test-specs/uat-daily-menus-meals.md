# UAT Test Specification: Daily Menus & Meals Management

**Project:** BaoCom - Meal Management System  
**Date:** 2026-05-14  
**Test Type:** Black Box / UAT

---

## 1. Overview

This document covers User Acceptance Testing for daily menus, meals, and holidays management. Testing follows black box methodology focusing on API endpoints and UI behavior without knowledge of internal implementation.

### 1.1 Scope

| Area | Components |
|------|------------|
| **APIs** | Daily Menus, Meals, Holidays endpoints |
| **UI Pages** | `/dashboard` (employee), `/book` (registration) |
| **Entities** | DailyMenu, Meal, Holiday |

### 1.2 Meal Types

| Type | Vietnamese | Description |
|------|-----------|-------------|
| `main` | Món chính | Main dishes (protein, carbs) |
| `vegetable` | Món rau | Vegetable dishes |
| `dessert` | Tráng miệng | Dessert items |

---

## 2. Test Data Requirements

### 2.1 User Roles

| Role | Permissions |
|------|-------------|
| `employee` | View menus, book/unbook meals |
| `admin` | Full CRUD on menus, meals, holidays |

### 2.2 Required Test Data

```
Meals (at minimum):
- 3 main dishes (e.g., "Thịt kho trứng", "Cá chiên", "Gà rang")
- 3 vegetable dishes (e.g., "Rau muống xào", "Cải xào tỏi", "Đậu co rí")
- 2 desserts (e.g., "Chuối chiên", "Rán flexible")

DailyMenus:
- Today, tomorrow, next 3 weekdays
- At least one day with mixed meal types

Holidays:
- At least 1 future holiday
- At least 1 past holiday

Dates:
- Past: any date before today
- Today: current date (YYYY-MM-DD)
- Future: any date after today
```

### 2.3 Date Format

All dates use ISO format: `YYYY-MM-DD` (e.g., `2026-05-14`)

---

## 3. API Test Cases

### 3.1 Daily Menus API

#### 3.1.1 GET /api/daily-menus

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| DM-API-001 | Get all menus (no params) | GET /api/daily-menus | 200, array of menus | P0 |
| DM-API-002 | Get menus with `take=5` | GET /api/daily-menus?take=5 | 200, max 5 menus | P1 |
| DM-API-003 | Get menus with `take=invalid` | GET /api/daily-menus?take=abc | 200, all menus (fallback) | P2 |
| DM-API-004 | Access without auth | (remove cookie) | 401 Unauthorized | P0 |
| DM-API-005 | Access with expired token | (expired cookie) | 401 Unauthorized | P0 |

**Response Schema:**
```json
{
  "menus": [
    {
      "id": "string",
      "date": "2026-05-14",
      "meals": [
        {
          "id": "string",
          "sortOrder": 1,
          "meal": {
            "id": "string",
            "name": "Thịt kho trứng",
            "type": "main"
          }
        }
      ]
    }
  ]
}
```

---

#### 3.1.2 GET /api/daily-menus/[date]

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| DM-API-010 | Get today's menu | GET /api/daily-menus/2026-05-14 | 200, dailyMenu object | P0 |
| DM-API-011 | Get future date menu | GET /api/daily-menus/2026-05-20 | 200, dailyMenu or null | P1 |
| DM-API-012 | Get past date menu | GET /api/daily-menus/2026-01-01 | 200, dailyMenu or null | P1 |
| DM-API-013 | Get menu for date with no menu | GET /api/daily-menus/2099-12-31 | 200, `{ dailyMenu: null }` | P1 |
| DM-API-014 | Invalid date format | GET /api/daily-menus/invalid | 400/500, error | P2 |
| DM-API-015 | Access without auth | (remove cookie) | 401 Unauthorized | P0 |

---

#### 3.1.3 POST /api/daily-menus

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| DM-API-020 | Create valid menu | POST | `{ "date": "2026-05-25", "mealIds": ["id1", "id2"] }` | 201, created menu | P0 |
| DM-API-021 | Create menu without auth | POST | valid body | 401 Unauthorized | P0 |
| DM-API-022 | Create menu as employee | POST | valid body | 403 Forbidden | P0 |
| DM-API-023 | Create menu missing date | POST | `{ "mealIds": ["id1"] }` | 400, missing date | P0 |
| DM-API-024 | Create menu missing mealIds | POST | `{ "date": "2026-05-25" }` | 400, missing mealIds | P0 |
| DM-API-025 | Create menu with invalid mealIds | POST | `{ "date": "2026-05-25", "mealIds": ["invalid"] }` | 400, invalid mealIds | P0 |
| DM-API-026 | Create menu with inactive meal | POST | `{ "date": "2026-05-25", "mealIds": ["inactive-id"] }` | 400, inactive meal error | P0 |
| DM-API-027 | Create menu with empty mealIds | POST | `{ "date": "2026-05-25", "mealIds": [] }` | 400, missing mealIds | P0 |
| DM-API-028 | Create menu invalid JSON | POST | `{ invalid` | 400, invalid JSON | P0 |
| DM-API-029 | Duplicate menu for same date | POST | `{ "date": "2026-05-14", "mealIds": ["id1"] }` (existing date) | 201 or 200 (upsert behavior) | P1 |

---

#### 3.1.4 PUT /api/daily-menus/[date]

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| DM-API-030 | Update existing date menu | PUT /api/daily-menus/2026-05-14 | `{ "mealIds": ["id1", "id2", "id3"] }` | 200, updated menu | P0 |
| DM-API-031 | Update non-existing date menu | PUT /api/daily-menus/2099-01-01 | `{ "mealIds": ["id1"] }` | 201 or 400 | P1 |
| DM-API-032 | Update without auth | PUT | valid body | 401 Unauthorized | P0 |
| DM-API-033 | Update as employee | PUT | valid body | 403 Forbidden | P0 |
| DM-API-034 | Update missing mealIds | PUT | `{ "date": "2026-05-14" }` | 400, missing mealIds | P0 |
| DM-API-035 | Update with invalid mealIds | PUT | `{ "mealIds": ["invalid"] }` | 400, invalid mealIds | P0 |

---

### 3.2 Meals API

#### 3.2.1 GET /api/meals

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| M-API-001 | Get all meals (no params) | GET /api/meals | 200, array of meals | P0 |
| M-API-002 | Filter by type=main | GET /api/meals?type=main | 200, only main dishes | P0 |
| M-API-003 | Filter by type=vegetable | GET /api/meals?type=vegetable | 200, only vegetable dishes | P0 |
| M-API-004 | Filter by type=dessert | GET /api/meals?type=dessert | 200, only dessert items | P0 |
| M-API-005 | Filter by invalid type | GET /api/meals?type=invalid | 200, all meals (fallback) | P2 |
| M-API-006 | Access without auth | (remove cookie) | 401 Unauthorized | P0 |

---

#### 3.2.2 GET /api/meals/[id]

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| M-API-010 | Get existing meal | GET /api/meals/{valid-id} | 200, meal object | P0 |
| M-API-011 | Get non-existing meal | GET /api/meals/invalid-id | 404, not found | P0 |
| M-API-012 | Access without admin | (employee cookie) | 403 Forbidden | P0 |
| M-API-013 | Access without auth | (no cookie) | 401 Unauthorized | P0 |

**Response Schema:**
```json
{
  "meal": {
    "id": "string",
    "name": "Thịt kho trứng",
    "type": "main",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

#### 3.2.3 POST /api/meals

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| M-API-020 | Create main dish | POST | `{ "name": "Thịt kho trứng", "type": "main" }` | 201, created meal | P0 |
| M-API-021 | Create vegetable | POST | `{ "name": "Rau muống xào", "type": "vegetable" }` | 201, created meal | P0 |
| M-API-022 | Create dessert | POST | `{ "name": "Chuối chiên", "type": "dessert" }` | 201, created meal | P0 |
| M-API-023 | Create without auth | POST | valid body | 401 Unauthorized | P0 |
| M-API-024 | Create as employee | POST | valid body | 403 Forbidden | P0 |
| M-API-025 | Create missing name | POST | `{ "type": "main" }` | 400, missing name | P0 |
| M-API-026 | Create missing type | POST | `{ "name": "Thịt kho" }` | 400, missing type | P0 |
| M-API-027 | Create invalid type | POST | `{ "name": "Thịt kho", "type": "invalid" }` | 400, invalid type | P0 |
| M-API-028 | Create invalid JSON | POST | `{ invalid` | 400, invalid JSON | P0 |

---

#### 3.2.4 PATCH /api/meals/[id]

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| M-API-030 | Update meal name | PATCH /api/meals/{id} | `{ "name": "Thịt kho mới" }` | 200, updated meal | P0 |
| M-API-031 | Update meal type | PATCH /api/meals/{id} | `{ "type": "vegetable" }` | 200, updated meal | P0 |
| M-API-032 | Deactivate meal | PATCH /api/meals/{id} | `{ "isActive": false }` | 200, updated meal | P0 |
| M-API-033 | Update non-existing | PATCH /api/meals/invalid-id | `{ "name": "New" }` | 404, not found | P0 |
| M-API-034 | Update without admin | PATCH | valid body | 403 Forbidden | P0 |

---

#### 3.2.5 DELETE /api/meals/[id]

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| M-API-040 | Delete existing meal | DELETE /api/meals/{id} | 200, `{ success: true }` | P0 |
| M-API-041 | Delete non-existing | DELETE /api/meals/invalid-id | 404, not found | P0 |
| M-API-042 | Delete without admin | DELETE | 403 Forbidden | P0 |

---

### 3.3 Holidays API

#### 3.3.1 GET /api/holidays

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| H-API-001 | Get all holidays | GET /api/holidays | 200, array of holidays | P0 |
| H-API-002 | Access without admin | (employee cookie) | 403 Forbidden | P0 |
| H-API-003 | Access without auth | (no cookie) | 401 Unauthorized | P0 |

---

#### 3.3.2 GET /api/holidays/[id]

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| H-API-010 | Get existing holiday | GET /api/holidays/{valid-id} | 200, holiday object | P0 |
| H-API-011 | Get non-existing holiday | GET /api/holidays/invalid-id | 404, not found | P0 |

---

#### 3.3.3 POST /api/holidays

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| H-API-020 | Create holiday with date | POST | `{ "date": "2026-05-20" }` | 201, created holiday | P0 |
| H-API-021 | Create holiday with description | POST | `{ "date": "2026-05-20", "description": "Ngày lễ" }` | 201, created holiday | P0 |
| H-API-022 | Create missing date | POST | `{ "description": "Lễ" }` | 400, missing date | P0 |
| H-API-023 | Create without admin | POST | valid body | 403 Forbidden | P0 |

---

#### 3.3.4 PATCH /api/holidays/[id]

| ID | Scenario | Method | Request Body | Expected Response | Priority |
|----|----------|--------|--------------|-------------------|----------|
| H-API-030 | Update holiday date | PATCH /api/holidays/{id} | `{ "date": "2026-06-01" }` | 200, updated holiday | P0 |
| H-API-031 | Update holiday description | PATCH /api/holidays/{id} | `{ "description": "Mới" }` | 200, updated holiday | P0 |
| H-API-032 | Deactivate holiday | PATCH /api/holidays/{id} | `{ "isActive": false }` | 200, updated holiday | P0 |
| H-API-033 | Update non-existing | PATCH /api/holidays/invalid-id | any body | 404, not found | P0 |

---

#### 3.3.5 DELETE /api/holidays/[id]

| ID | Scenario | Method | Expected Response | Priority |
|----|----------|--------|-------------------|----------|
| H-API-040 | Delete existing holiday | DELETE /api/holidays/{id} | 200, `{ success: true }` | P0 |
| H-API-041 | Delete non-existing | DELETE /api/holidays/invalid-id | 404, not found | P0 |

---

## 4. UI Test Cases

### 4.1 Dashboard Page (/dashboard)

#### 4.1.1 View Weekly Menu

| ID | Scenario | Action | Expected Result | Priority |
|----|----------|--------|-----------------|----------|
| UI-D-001 | Load dashboard | Navigate to /dashboard | Page loads, shows weekly menu | P0 |
| UI-D-002 | View current day selected | Default state | Today highlighted, menu displayed | P0 |
| UI-D-003 | View no menu for day | Select day with no menu | "Chưa có menu" shown | P0 |
| UI-D-004 | Switch between days | Click day button | Menu updates for selected day | P0 |
| UI-D-005 | View main dishes | Day with menu | "Món chính" section shows dishes | P0 |
| UI-D-006 | View vegetable dishes | Day with vegetables | "Món rau" section shows dishes | P0 |
| UI-D-007 | View desserts | Day with desserts | "Tráng miệng" section shows items | P0 |
| UI-D-008 | Loading state | Refresh page | Skeleton/loading indicator shown | P1 |
| UI-D-009 | View registration status | Day with registration | "Đã đăng ký" badge shown | P0 |
| UI-D-010 | View unregistered status | Day without registration | "Chưa đăng ký" badge shown | P0 |

---

### 4.2 Book Page (/book)

#### 4.2.1 Meal Registration

| ID | Scenario | Action | Expected Result | Priority |
|----|----------|--------|-----------------|----------|
| UI-B-001 | Load book page | Navigate to /book | Page loads, shows 8-day grid | P0 |
| UI-B-002 | View today's card | Default state | "Hôm nay" badge on today | P0 |
| UI-B-003 | Register for meal | Tap day with "Chưa chọn" | Status changes to "Ăn", success toast | P0 |
| UI-B-004 | Unregister meal | Tap day with "Ăn" | Status changes to "Không ăn" | P0 |
| UI-B-005 | Re-register meal | Tap day with "Không ăn" | Status changes back to "Ăn" | P0 |
| UI-B-006 | Cannot modify past | Tap past day | Disabled, no action | P0 |
| UI-B-007 | View registration count | Load page | "Đã đăng ký" count shows correct number | P0 |
| UI-B-008 | Success notification | Register | Toast appears with "Đã đăng ký ăn" | P1 |
| UI-B-009 | Error notification | Failed toggle | Toast appears with "Cập nhật thất bại" | P1 |
| UI-B-010 | Today ring highlight | Load page | Today has primary ring outline | P1 |

---

## 5. Integration Test Cases

### 5.1 Menu-Meal Relationship

| ID | Scenario | Action | Expected Result | Priority |
|----|----------|--------|-----------------|----------|
| INT-001 | Create menu with valid meals | POST /api/daily-menus | Menu includes all specified meals | P0 |
| INT-002 | Create menu with invalid meal ID | POST /api/daily-menus | 400 error, no menu created | P0 |
| INT-003 | View menu on dashboard | GET /dashboard | Meals display with correct types | P0 |
| INT-004 | Deactivate meal used in menu | PATCH /api/meals/{id} isActive=false | Daily menu still accessible, meal shows as inactive | P1 |

### 5.2 Holiday-Meal Relationship

| ID | Scenario | Action | Expected Result | Priority |
|----|----------|--------|-----------------|----------|
| INT-010 | Create holiday | POST /api/holidays | Holiday saved successfully | P0 |
| INT-011 | View holidays on calendar | (future) | Holidays displayed correctly | P1 |
| INT-012 | Delete holiday with existing menu | DELETE /api/holidays/{id} | Holiday deleted, menus unaffected | P1 |

---

## 6. Edge Cases

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| EC-001 | Empty menus list | GET /api/daily-menus returns `{ menus: [] }` | P1 |
| EC-002 | Empty meals list | GET /api/meals returns `{ meals: [] }` | P1 |
| EC-003 | Empty holidays list | GET /api/holidays returns `{ holidays: [] }` | P1 |
| EC-004 | Date at month boundary | GET /api/daily-menus/2026-01-01 | Works correctly | P2 |
| EC-005 | Leap year Feb 29 | GET /api/daily-menus/2028-02-29 | Works correctly | P2 |
| EC-006 | Very long meal name | Create meal with 500 chars | Handled gracefully | P2 |
| EC-007 | Special characters in description | Create holiday with `"test<>:'` | Saved correctly | P2 |
| EC-008 | Concurrent menu updates | Two admins update same date | Last write wins or 409 | P2 |

---

## 7. Acceptance Criteria

### 7.1 Daily Menu Management

- [ ] Admin can create daily menu with multiple meals
- [ ] Admin can update existing daily menu by date
- [ ] Admin can view all daily menus with pagination
- [ ] Employee can view daily menu for specific date
- [ ] System validates mealIds are valid and active

### 7.2 Meal Management

- [ ] Admin can create meals of types: main, vegetable, dessert
- [ ] Admin can update meal properties
- [ ] Admin can deactivate meal (soft delete)
- [ ] Admin can permanently delete meal
- [ ] Employee can view all active meals

### 7.3 Holiday Management

- [ ] Admin can create holidays with date and description
- [ ] Admin can update holiday properties
- [ ] Admin can deactivate/delete holidays

### 7.4 UI Functionality

- [ ] Dashboard shows current week menu
- [ ] Dashboard displays meal types correctly
- [ ] Book page allows registration toggle
- [ ] Past days are not modifiable
- [ ] Success/error notifications display

---

## 8. Test Execution Checklist

```
Pre-test Setup:
[ ] Create test meals (3 main, 3 vegetable, 2 dessert)
[ ] Create test daily menus (today + 3 future days)
[ ] Create test holidays (1 past, 1 future)
[ ] Verify test users (employee, admin)

API Testing:
[ ] Execute all DM-API-00x tests
[ ] Execute all M-API-00x tests
[ ] Execute all H-API-00x tests
[ ] Verify all P0 tests pass

UI Testing:
[ ] Execute all UI-D-00x tests (dashboard)
[ ] Execute all UI-B-00x tests (book page)
[ ] Verify responsive behavior

Integration Testing:
[ ] Execute all INT-00x tests

Edge Case Testing:
[ ] Execute all EC-00x tests

Post-test Cleanup:
[ ] Remove test data
[ ] Verify no test artifacts remain
```

---

## Appendix A: API Response Codes Summary

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Appendix B: Test Environment URLs

| Environment | Base URL |
|-------------|----------|
| Local | http://localhost:3000 |
| Staging | (insert) |
| Production | (insert) |