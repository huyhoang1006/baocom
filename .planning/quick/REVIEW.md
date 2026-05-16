---
phase: quick
reviewed: 2026-05-16T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/lib/registrationWindow.ts
  - src/controllers/AdminReportsController.ts
  - src/services/RegistrationService.ts
  - src/lib/api.ts
  - src/hooks/useRegistrations.ts
  - src/hooks/useDailyMenus.ts
  - app/admin/reports/page.tsx
  - app/admin/employees/page.tsx
  - app/(employee)/dashboard/page.tsx
  - app/(employee)/my-history/page.tsx
  - app/admin/menu/page.tsx
  - app/(employee)/book/page.tsx
  - src/dto/UserDTO.ts
  - src/controllers/UsersController.ts
  - app/api/holidays/[id]/route.ts
findings:
  critical: 0
  warning: 4
  info: 7
  total: 11
status: issues_found
---

# Phase Quick: Code Review Report

**Reviewed:** 2026-05-16
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed 15 source files across phases 1-5. Found 4 warnings and 7 info-level issues. No critical/security bugs detected. The codebase is generally sound with proper auth middleware usage, correct date handling, and appropriate status validation.

## Warnings

### WR-01: AdminReportsController unused import

**File:** `src/controllers/AdminReportsController.ts:4`
**Issue:** `startOfLocalDay` is imported but not used in the controller.
**Fix:**
```typescript
import { isAllowedRegistrationDate } from '@/lib/registrationWindow'  // remove startOfLocalDay
```

---

### WR-02: useDailyMenus returns untyped data

**File:** `src/hooks/useDailyMenus.ts:27`
**Issue:** `dailyMenusApi.getAll(take)` returns `unknown[]` per api.ts type definition. Cast to `DailyMenu[]` without runtime validation is unsafe.
**Fix:**
```typescript
// Add type guard or validation, or extend API types properly
const data = await dailyMenusApi.getAll(take)
setMenus(Array.isArray(data.menus) ? data.menus as DailyMenu[] : [])
```

---

### WR-03: useDailyMenus date parsing uses browser local timezone

**File:** `src/hooks/useDailyMenus.ts:40-43`
**Issue:** `getMenuByDate` uses `new Date(m.date)` which interprets the date string as local browser time, not Asia/Ho_Chi_Minh. Inconsistent with `registrationWindow.ts` which uses UTC-based TZ handling.
**Fix:**
```typescript
import { parseLocalDate, toDateKey } from '@/lib/registrationWindow'

// Use parseLocalDate instead of new Date(m.date)
const getMenuByDate = useCallback((dateStr: string): DailyMenu | null => {
  return menus.find(m => {
    const menuDate = toDateKey(parseLocalDate(m.date.split('T')[0]))
    return menuDate === dateStr
  }) || null
}, [menus])
```

---

### WR-04: Employees page validates phone field but never checks it

**File:** `app/admin/employees/page.tsx:78-93`
**Issue:** `validateForm` checks `errors.phone` and renders an error message for phone validation (`formErrors.phone`), but the validation logic never populates `errors.phone` — it only validates name and email. The field marked `SĐT *` has no required validation and can be submitted empty.
**Fix:**
Add phone validation to `validateForm`:
```typescript
if (!formData.phone.trim()) {
  errors.phone = "Vui lòng nhập SĐT"
}
```

---

## Info

### IN-01: RegistrationService.findByDateRange passes strings directly

**File:** `src/services/RegistrationService.ts:35-39`
**Issue:** `findByDateRange` receives date strings and passes them to `new Date()` which interprets as local time. However, `findByDateRange` is only used in AdminReportsController which receives query params directly. Works but could be clearer with explicit parsing.
**Fix:** Consider adding `startOfLocalDay` parsing for consistency with other service methods.

---

### IN-02: AdminReportsController date parsing inconsistency

**File:** `src/controllers/AdminReportsController.ts:23-26`
**Issue:** `new Date(startDate)` and `new Date(endDate)` use browser local timezone. `start` and `end` variables are created but never used — the code calls `findByDateRange` with the raw string params instead.
**Fix:** Remove unused `start`/`end` variables, or use them in the service call:
```typescript
// Option 1: remove unused vars
const registrations = await this.registrationService.findByDateRange(startDate, endDate)

// Option 2: use parsed dates
const start = new Date(startDate)
const end = new Date(endDate)
const registrations = await this.registrationService.findByDateRange(
  start.toISOString().split('T')[0],
  end.toISOString().split('T')[0]
)
```

---

### IN-03: api.ts usersApi.update response type is incomplete

**File:** `src/lib/api.ts:105-109`
**Issue:** `usersApi.update` returns `user: { id, username, name, role }` but `UserResponseDTO` includes `isActive` and `createdAt`. The update response is missing these fields.
**Fix:**
```typescript
update: (id: string, data: { name?: string; role?: string; isActive?: boolean }) =>
  apiFetch<{ user: { id: string; username: string; name: string; role: string; isActive: boolean; createdAt: string } }>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
```

---

### IN-04: UsersController.update does not return isActive

**File:** `src/controllers/UsersController.ts:73-81`
**Issue:** `UsersController.update` returns user without `isActive` field, which frontend expects for the employee status toggle.
**Fix:**
```typescript
return NextResponse.json({
  user: {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    isActive: user.isActive  // add this
  }
})
```

---

### IN-05: app/(employee)/dashboard/page.tsx has dead code

**File:** `app/(employee)/dashboard/page.tsx:80-86`
**Issue:** `toggleRegistration` function calls `useRegistrations()` inside an async handler (which is a React hooks violation — hooks can only be called at top level). The function also does nothing useful — it just breaks. The button is hardcoded to `disabled` at line 205.
**Fix:**
```typescript
// Remove toggleRegistration function entirely, or implement it properly
// Currently button is disabled so no action is needed
```

---

### IN-06: app/(employee)/my-history/page.tsx hardcoded mock user

**File:** `app/(employee)/my-history/page.tsx:41-44`
**Issue:** `mockUser` is hardcoded instead of reading from auth context.
**Fix:**
```typescript
// Should use auth context or API to get current user
const [mockUser] = useState({ username: "hungpx", fullName: "Phạm Xuân Hùng" })
// Replace with: const { user } = useAuth() or similar
```

---

### IN-07: app/(employee)/my-history/page.tsx phone search can crash

**File:** `app/(employee)/my-history/page.tsx:103-107`
**Issue:** `emp.phone.includes(searchQuery)` will throw if `searchQuery` contains special regex characters like `.` or `*`. Also `emp.phone` can be empty string which is fine but should be handled.
**Fix:**
```typescript
const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  emp.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (emp.phone && emp.phone.includes(searchQuery))
```

---

_Reviewed: 2026-05-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_