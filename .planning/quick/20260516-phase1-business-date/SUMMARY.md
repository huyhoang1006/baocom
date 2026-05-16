---
name: phase1-business-date-summary
description: Phase 1 complete — Asia/Ho_Chi_Minh TZ, date key fixes, QUAL-01/02 fixes
metadata:
  type: quick
  phase: 1
  status: complete
---

# Phase 1: Business Date & Brownfield Correctness — Complete

## Changes Made

### `src/lib/registrationWindow.ts`
- Added explicit `VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000` constant
- `toDateKey(date)` rewritten to use TZ-adjusted math instead of `toISOString().split('T')[0]`
- `startOfLocalDay(date)` rewritten with TZ-adjusted math
- Added `parseLocalDate(dateStr)` for parsing YYYY-MM-DD strings in Vietnam TZ
- All functions now use `Asia/Ho_Chi_Minh` explicitly

### `src/services/RegistrationService.ts`
- Added `findByDateRange(startDate, endDate)` method to avoid positional-arg confusion (QUAL-01 fix)

### `src/controllers/AdminReportsController.ts`
- Uses new `findByDateRange` instead of positional `findAll(startDate, endDate)` (QUAL-01 fix)
- `toDateKey()` replaces `toISOString().split('T')[0]` for date grouping (DATE-02 fix)

### `src/lib/api.ts`
- Changed `dailyMenusApi.getByDate` return type from `{ menu: unknown }` to `{ dailyMenu: unknown }` (QUAL-02 fix)

### `src/hooks/useRegistrations.ts`
- `getRegistrationDateKey` uses `toDateKey(parseLocalDate(...))` instead of `toISOString().split('T')[0]`

### `src/hooks/useDailyMenus.ts`
- `getMenuByDate` uses `toDateKey()` instead of `toISOString().split('T')[0]`

### `app/admin/reports/page.tsx`
- `todayStr` uses `toDateKey(new Date())` instead of `toISOString().split('T')[0]`
- Week date range uses `toDateKey(opt.start)` / `toDateKey(opt.end)` instead of `toISOString().split('T')[0]`

### `app/(employee)/dashboard/page.tsx`
- `formatDateKey` uses `toDateKey()` instead of `toISOString().split('T')[0]`

### `app/(employee)/my-history/page.tsx`
- Date key mapping uses `toDateKey()` instead of `toISOString().split('T')[0]`

### `app/admin/menu/page.tsx`
- `formatDateKey` uses `toDateKey()` instead of `toISOString().split('T')[0]`

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| DATE-01: Asia/Ho_Chi_Minh TZ for all date keys | ✅ Fixed via explicit offset constant |
| DATE-02: No UTC shift in date display | ✅ `toDateKey` uses TZ-adjusted math |
| QUAL-01: Date filter not treated as userId | ✅ `findByDateRange` added and used |
| QUAL-02: API response type matches client | ✅ `{ menu }` → `{ dailyMenu }` |

## Pre-existing Issues (Not in Scope)
- Type error in `app/api/holidays/[id]/route.ts` — pre-existing, not introduced by Phase 1