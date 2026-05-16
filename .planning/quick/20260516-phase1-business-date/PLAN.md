# Phase 1: Business Date & Brownfield Correctness

## Description
Normalize date semantics and fix known blocking report/menu contract bugs.

## Success Criteria
1. User-facing menu, report, history, and cutoff dates resolve to `Asia/Ho_Chi_Minh` business date.
2. Admin report date filters return data for requested inclusive date values (not treating date as user id).
3. Daily menu by-date API responses match client type.
4. Date keys displayed in UI do not shift because of UTC conversion.

## Tasks

### DATE-01/02 Fixes

- [ ] **A. Fix registrationWindow.ts** — Add explicit Asia/Ho_Chi_Minh timezone offset (+7h) and export `toDateKeyTZ(date: Date): string` that uses it. Keep existing `toDateKey` for backward compat but make `toDateKeyTZ` the canonical one.
- [ ] **B. Fix AdminReportsController.ts** — Replace `new Date(r.date).toISOString().split('T')[0]` with `toDateKey(new Date(r.date))`.
- [ ] **C. Fix AdminReportsController.ts** — Fix argument order: pass `findAll(undefined, startDate, endDate)` instead of positional confusion.
- [ ] **D. Fix useRegistrations.ts** — Replace `toISOString().split('T')[0]` with `toDateKey()`.
- [ ] **E. Fix admin reports page** — Replace `toISOString().split('T')[0]` with `toDateKey()`.

### QUAL-01 Fixes

- [ ] **F. Fix RegistrationService** — Add `findByDateRange(startDate: string, endDate: string)` method.
- [ ] **G. Update AdminReportsController** — Use new `findByDateRange` method.

### QUAL-02 Fixes

- [ ] **H. Fix api.ts** — Change `getByDate` return type from `{ menu: unknown }` to `{ dailyMenu: ... }`.

## Files to Modify
- `src/lib/registrationWindow.ts`
- `src/controllers/AdminReportsController.ts`
- `src/services/RegistrationService.ts`
- `src/hooks/useRegistrations.ts`
- `src/lib/api.ts`
- `app/admin/reports/page.tsx`