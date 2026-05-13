# Playwright E2E Tests: Meal & Menu Management

## Overview

Tests cover three pages: `/meals`, `/daily-menus`, `/holidays`.
API requires authentication; create/update/delete require admin role.

**Auth flow**: Login sets `token` cookie containing JWT with `userId` and `role` fields.
**Admin role check**: `role === 'admin'` returns 403 Forbidden otherwise.

---

## Page Object Structure

```
src/e2e/
  pages/
    MealsPage.ts      - /meals listing and form
    DailyMenusPage.ts - /daily-menus listing and form
    HolidaysPage.ts   - /holidays listing and form
  components/
    Notification.ts   - Toast notifications
    Modal.ts          - Confirmation dialogs
    FormField.ts      - Reusable form input wrapper
  fixtures/
    auth.ts           - Admin/non-admin login helpers
    testData.ts       - Seed data helpers
```

---

## Test Cases

### P0 - Critical (Happy Path & Permission Enforcement)

#### MEAL-001: List meals (authenticated)
- **Priority**: P0
- **Time**: ~3s
- **Steps**:
  1. Login as admin
  2. Navigate to `/meals`
  3. Wait for meal list to load
- **Selectors**:
  - Page: `[data-testid="meals-page"]`
  - List container: `[data-testid="meals-list"]`
  - Loading: `[data-testid="meals-loading"]`
- **Assertions**:
  - Status 200
  - Meals render with name and type badge
  - No error notification appears

#### MEAL-002: Create meal (admin)
- **Priority**: P0
- **Time**: ~5s
- **Steps**:
  1. Login as admin
  2. Navigate to `/meals`
  3. Click "Add Meal" button
  4. Fill name input with "Grilled Chicken"
  5. Select type "main" from dropdown
  6. Submit form
  7. Wait for success notification
- **Selectors**:
  - Add button: `[data-testid="add-meal-btn"]`
  - Name input: `[data-testid="meal-name-input"]`
  - Type select: `[data-testid="meal-type-select"]`
  - Submit: `[data-testid="meal-submit-btn"]`
  - Success toast: `[data-testid="toast-success"]`
- **Assertions**:
  - API called with POST /api/meals
  - Body: `{ "name": "Grilled Chicken", "type": "main" }`
  - Response 201 with created meal object
  - New meal appears in list
  - Toast shows "Meal created successfully"

#### MEAL-003: Create meal validation (missing fields)
- **Priority**: P0
- **Time**: ~4s
- **Steps**:
  1. Login as admin
  2. Navigate to `/meals`
  3. Click "Add Meal"
  4. Submit empty form
- **Selectors**: (same as MEAL-002)
- **Assertions**:
  - API not called
  - Inline error: "Name is required" under name input
  - Inline error: "Type is required" under type select

#### MEAL-004: Create meal validation (invalid type)
- **Priority**: P0
- **Time**: ~4s
- **Steps**:
  1. Login as admin
  2. Navigate to `/meals`
  3. Click "Add Meal"
  4. Enter name "Pie"
  5. Select invalid type "snack"
  6. Submit
- **Assertions**:
  - API called with type "snack"
  - Response 400: `{ "error": "Invalid type" }`
  - Error notification: "Invalid meal type. Must be main, vegetable, or dessert"

#### MEAL-005: Admin-only create (non-admin blocked)
- **Priority**: P0
- **Time**: ~4s
- **Steps**:
  1. Login as regular user (role: "user")
  2. Navigate to `/meals`
  3. Attempt to open create form
- **Assertions**:
  - "Add Meal" button not visible OR clicking shows "Access denied"
  - API returns 403 if direct POST attempted

#### MEAL-006: Admin-only create (unauthenticated blocked)
- **Priority**: P0
- **Time**: ~3s
- **Steps**:
  1. Clear auth state (logout or no cookie)
  2. Attempt POST to /api/meals
- **Assertions**:
  - Response 401: `{ "error": "Unauthorized" }`
  - Redirect to login page

---

### P0 - Daily Menu

#### DM-001: List daily menus
- **Priority**: P0
- **Time**: ~3s
- **Steps**:
  1. Login as admin
  2. Navigate to `/daily-menus`
- **Selectors**:
  - Page: `[data-testid="daily-menus-page"]`
  - List: `[data-testid="menus-list"]`
- **Assertions**:
  - Menus display with date and meal count
  - Each menu shows linked meals

#### DM-002: Create daily menu (valid meals)
- **Priority**: P0
- **Time**: ~6s
- **Steps**:
  1. Login as admin
  2. Navigate to `/daily-menus`
  3. Click "Create Daily Menu"
  4. Select date "2026-05-20"
  5. Select meals: "Grilled Chicken" (main), "Steamed Broccoli" (vegetable)
  6. Submit
- **Selectors**:
  - Date picker: `[data-testid="menu-date-input"]`
  - Meal checkboxes: `[data-testid="meal-checkbox-${mealId}"]`
  - Submit: `[data-testid="menu-submit-btn"]`
- **Assertions**:
  - API called: POST /api/daily-menus `{ "date": "2026-05-20", "mealIds": ["<id1>", "<id2>"] }`
  - Response 201
  - New menu appears in list

#### DM-003: Create daily menu validation (invalid meal)
- **Priority**: P0
- **Time**: ~5s
- **Steps**:
  1. Login as admin
  2. Navigate to `/daily-menus`
  3. Create menu with non-existent meal ID
  4. Submit
- **Assertions**:
  - API returns 400: `{ "error": "One or more mealIds are invalid or inactive" }`
  - Error notification appears

#### DM-004: Create daily menu validation (missing fields)
- **Priority**: P0
- **Time**: ~4s
- **Steps**:
  1. Login as admin
  2. Navigate to `/daily-menus`
  3. Submit empty form
- **Assertions**:
  - Error: "Date is required" if missing
  - Error: "Select at least one meal" if no meals selected

---

### P0 - Holidays

#### HOL-001: List holidays
- **Priority**: P0
- **Time**: ~3s
- **Steps**:
  1. Login as admin
  2. Navigate to `/holidays`
- **Selectors**:
  - Page: `[data-testid="holidays-page"]`
  - List: `[data-testid="holidays-list"]`
- **Assertions**:
  - Holidays display with date and description

#### HOL-002: Create holiday
- **Priority**: P0
- **Time**: ~5s
- **Steps**:
  1. Login as admin
  2. Navigate to `/holidays`
  3. Click "Add Holiday"
  4. Enter date "2026-07-04"
  5. Enter description "Independence Day"
  6. Submit
- **Selectors**:
  - Date input: `[data-testid="holiday-date-input"]`
  - Description input: `[data-testid="holiday-description-input"]`
  - Submit: `[data-testid="holiday-submit-btn"]`
- **Assertions**:
  - API: POST /api/holidays `{ "date": "2026-07-04", "description": "Independence Day" }`
  - Response 201
  - Holiday appears in list

#### HOL-003: Create holiday (date only, no description)
- **Priority**: P0
- **Time**: ~4s
- **Steps**:
  1. Login as admin
  2. Navigate to `/holidays`
  3. Add holiday with only date "2026-12-25"
  4. Leave description empty
  5. Submit
- **Assertions**:
  - API: POST /api/holidays `{ "date": "2026-12-25" }` (no description field)
  - Response 201
  - Holiday appears with empty description

#### HOL-004: Create holiday validation (missing date)
- **Priority**: P0
- **Time**: ~4s
- **Steps**:
  1. Login as admin
  2. Navigate to `/holidays`
  3. Submit without date
- **Assertions**:
  - Error: "Date is required"
  - API not called

#### HOL-005: Admin-only holiday operations
- **Priority**: P0
- **Time**: ~4s
- **Steps**:
  1. Login as regular user
  2. Navigate to `/holidays`
  3. Attempt to create holiday
- **Assertions**:
  - "Add Holiday" button hidden or shows access denied
  - Direct API call returns 403

---

### P1 - High Priority (Error Handling & Edge Cases)

#### MEAL-010: Edit meal (admin)
- **Priority**: P1
- **Time**: ~5s
- **Steps**:
  1. Login as admin
  2. Navigate to `/meals`
  3. Click edit on existing meal
  4. Change name to "Updated Chicken"
  5. Submit
- **Selectors**:
  - Edit button: `[data-testid="edit-meal-btn-${mealId}"]`
  - Name input: `[data-testid="meal-name-input"]`
- **Assertions**:
  - API called: PUT /api/meals/${id}
  - Response 200 with updated meal
  - List reflects changes

#### MEAL-011: Delete meal confirmation
- **Priority**: P1
- **Time**: ~5s
- **Steps**:
  1. Login as admin
  2. Navigate to `/meals`
  3. Click delete on a meal
  4. Confirm in modal
- **Selectors**:
  - Delete button: `[data-testid="delete-meal-btn-${mealId}"]`
  - Modal confirm: `[data-testid="modal-confirm-btn"]`
- **Assertions**:
  - API called: DELETE /api/meals/${id}
  - Response 200
  - Meal removed from list

#### MEAL-012: Delete meal used in daily menu
- **Priority**: P1
- **Time**: ~6s
- **Precondition**: Meal has active daily menu reference
- **Steps**:
  1. Login as admin
  2. Attempt to delete meal that is used in an active daily menu
- **Assertions**:
  - Warning or error shown: "Cannot delete meal that is assigned to daily menus"
  - API returns 400 or warning message

#### DM-010: Edit daily menu
- **Priority**: P1
- **Time**: ~5s
- **Steps**:
  1. Login as admin
  2. Navigate to `/daily-menus`
  3. Click edit on existing menu
  4. Change selected meals
  5. Submit
- **Assertions**:
  - API called with new mealIds
  - Response 200
  - Menu reflects changes

#### DM-011: Daily menu for date already exists (upsert behavior)
- **Priority**: P1
- **Time**: ~5s
- **Steps**:
  1. Login as admin
  2. Create menu for date "2026-05-20"
  3. Create another menu for same date with different meals
- **Assertions**:
  - Second call updates existing menu (upsert)
  - Response 200
  - Only one menu for date exists with latest mealIds

#### HOL-010: Edit holiday
- **Priority**: P1
- **Time**: ~5s
- **Steps**:
  1. Login as admin
  2. Navigate to `/holidays`
  3. Click edit on holiday
  4. Update description
  5. Submit
- **Assertions**:
  - API: PUT /api/holidays/${id}
  - Response 200
  - List updated

#### HOL-011: Delete holiday
- **Priority**: P1
- **Time**: ~5s
- **Steps**:
  1. Login as admin
  2. Delete holiday
  3. Confirm modal
- **Assertions**:
  - API: DELETE /api/holidays/${id}
  - Response 200 `{ "success": true }`
  - Holiday removed from list

---

### P2 - Medium Priority (Notifications & UX)

#### NOTIFY-001: Success notification on create
- **Priority**: P2
- **Time**: ~4s
- **Steps**:
  1. Login as admin
  2. Create meal successfully
- **Assertions**:
  - Toast appears within 500ms
  - Shows "Meal created successfully" (or similar)
  - Auto-dismisses after 3-5 seconds

#### NOTIFY-002: Error notification on API failure
- **Priority**: P2
- **Time**: ~5s
- **Steps**:
  1. Login as admin
  2. Trigger API error (e.g., invalid mealIds)
- **Assertions**:
  - Error toast appears with red background
  - Shows descriptive message from API or fallback "Something went wrong"
  - Does not auto-dismiss until user closes

#### NOTIFY-003: Loading states during API calls
- **Priority**: P2
- **Time**: ~4s
- **Steps**:
  1. Trigger API call (create/edit/delete)
- **Assertions**:
  - Submit button shows loading spinner
  - Button disabled during request
  - No duplicate submissions possible

#### NOTIFY-004: Empty state when no data
- **Priority**: P2
- **Time**: ~3s
- **Steps**:
  1. Clear all meals (or use fresh test environment)
  2. Navigate to `/meals`
- **Assertions**:
  - Empty state message: "No meals yet"
  - Call to action: "Add your first meal"

#### FILTER-001: Filter meals by type
- **Priority**: P2
- **Time**: ~4s
- **Steps**:
  1. Login as admin
  2. Navigate to `/meals`
  3. Click filter dropdown
  4. Select "main"
- **Assertions**:
  - Only meals with type "main" display
  - Filter selection persists

---

## Fixtures

### adminAuth fixture
```typescript
// Logs in as admin and sets token cookie
// Uses credentials from environment or test users
// Returns: { userId, role: 'admin', token }
```

### userAuth fixture
```typescript
// Logs in as regular user
// Returns: { userId, role: 'user', token }
```

### testMeal fixture
```typescript
// Creates test meal, returns meal object
// Auto-cleanup after test
// Overload: withType(type: MealType)
```

### testDailyMenu fixture
```typescript
// Creates daily menu with test meals
// Auto-cleanup after test
```

### testHoliday fixture
```typescript
// Creates holiday
// Auto-cleanup after test
```

---

## Test Data Cleanup

All tests use `beforeEach` to ensure isolated state.
Fixtures clean up created entities in `afterEach`.
Use test database or transactions for true isolation.

---

## Environment Variables

```env
E2E_BASE_URL=http://localhost:3000
E2E_ADMIN_EMAIL=test@bao.com
E2E_ADMIN_PASSWORD=admin123
E2E_USER_EMAIL=user@bao.com
E2E_USER_PASSWORD=user123
```

---

## Execution

```bash
# Run all tests
npx playwright test

# Run specific suite
npx playwright test --grep "meals"

# Run with headed browser
npx playwright test --headed

# Generate report
npx playwright show-report
```

---

## Dependencies

- `@playwright/test` ^1.40+
- playwright config: `playwright.config.ts`
- page object pattern: `src/e2e/pages/*.ts`
- component pattern: `src/e2e/components/*.ts`