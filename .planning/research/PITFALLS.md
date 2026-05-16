# Domain Pitfalls

**Domain:** Internal company lunch meal reporting app
**Project:** Báo Cơm Trưa Công Ty
**Date:** 2026-05-16

## Critical Pitfalls

### Default-eat modeled as opt-in
- **Risk:** Missing registration rows get treated as unknown/not counted.
- **Impact:** Undercount meals and force admin to chase employees.
- **Prevention:** Define canonical rule: active employee + meal-eligible day + no opt-out = eating.
- **Tests:** Weekday with 10 active employees and no rows reports 10 meals; 2 opt-outs reports 8 meals.

### Date drift from UTC/local conversion
- **Risk:** UI `Date` and `toISOString().split('T')[0]` shift business dates.
- **Impact:** Wrong day in report, menu, cutoff, and history.
- **Prevention:** Treat `YYYY-MM-DD` as business date key; centralize helpers; remove ad-hoc ISO conversion.
- **Tests:** Asia/Ho_Chi_Minh boundary cases and inclusive date range tests.

### Cutoff policy only client-side or unclear
- **Risk:** UI blocks changes but API accepts them, or employees cancel after admin sent counts.
- **Impact:** Kitchen count wrong.
- **Prevention:** Store cutoff setting server-side and enforce in service layer; show closed reason in UI.
- **Tests:** Before cutoff succeeds; after cutoff fails with stable error.

### Admin reports date range bug
- **Risk:** `AdminReportsController.getReport()` passes dates into `findAll(userId?, startDate?, endDate?)` incorrectly.
- **Impact:** Report preview/export can be empty or wrong.
- **Prevention:** Add dedicated date-range report service or call with `undefined, startDate, endDate`.
- **Tests:** Controller/service tests for range params.

### Report count semantics duplicated
- **Risk:** Dashboard, report page, CSV, and history count differently.
- **Impact:** Admin mistrust and manual reconciliation.
- **Prevention:** One report/domain service computes effective lunch status and totals.
- **Tests:** Same fixture validates dashboard summary and export data.

### Holidays/weekends counted as meal days
- **Risk:** Default-eat counts everyone on holidays/weekends.
- **Impact:** Over-ordering.
- **Prevention:** Define meal-eligible day: weekday and not configured holiday.
- **Tests:** Holiday in weekday returns 0/skipped and employee action blocked.

### Export differs from on-screen report
- **Risk:** CSV/XLSX generated from client-transformed data, not same report service.
- **Impact:** Kitchen receives mismatched file.
- **Prevention:** Server CSV export from same report service; include date range/generated-at metadata.
- **Tests:** Export count equals preview count for same filters.

## Moderate Pitfalls

- Browser-side XLSX can bloat admin page; prefer server CSV for v1.
- Employee history must show effective status, not only stored registration rows.
- Disabled users/logout token behavior must match internal security expectations.
- Error mapping by exact strings is brittle; use typed domain errors when touching cutoff/report logic.
- Shared API helper redirects on auth errors, which can make report/export UX harder to test.

## Scope Pitfalls

- Do not add kitchen role, payroll automation, self-service signup, meal choices, native app, or large-company infra in v1.
- Keep v1 focused on daily count correctness, opt-out flow, weekly menu, admin reports, and CSV.

## Roadmap Recommendations

1. Fix report/date correctness and define effective lunch count first.
2. Build employee opt-out UX and admin daily operations view next.
3. Add configurable cutoff and weekly menu reliability.
4. Add server CSV export from shared report logic.
5. Harden auth/session policy and refactor large touched pages after core behavior is locked.
