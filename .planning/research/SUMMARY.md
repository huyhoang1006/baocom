# Research Summary

**Project:** Báo Cơm Trưa Công Ty
**Date:** 2026-05-16
**Scope:** Brownfield v1 for small internal lunch reporting app under 50 employees
**Overall confidence:** HIGH for stack/architecture/pitfalls, MEDIUM for feature landscape

## Executive Summary

Báo Cơm Trưa Công Ty should be built as absence-override workflow, not daily opt-in meal booking. Active employees minus absences equals portions needed, with holidays/weekends excluded and cutoff enforced server-side.

Keep existing Next.js 16 + React 19 + TypeScript + Prisma 7 + SQLite/libSQL stack and current layered App Router → API route → Controller → Service → Repository → Prisma architecture. Do not re-platform or add enterprise infra. v1 should stabilize correctness first: date keys, report bug, default-eat semantics, shared report service, runtime validation, cutoff settings, then UX/report/export polish.

## Stack Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Framework | Keep Next.js 16 App Router | Existing app already uses it; migration risk exceeds value. |
| UI | Keep React 19 | Current interactive pages fit Client Components. |
| Language | Keep TypeScript strict | Best guard for brownfield fixes and DTO/service boundaries. |
| Backend pattern | Keep Route Handler → Controller → Service → Repository → Prisma | Coherent current architecture; low regression path. |
| ORM/DB | Keep Prisma 7 + SQLite/libSQL | Fits internal app under 50 employees. |
| Auth crypto | Keep `jose`; remove unused `jsonwebtoken` | `jose` already used; duplicate JWT library adds audit surface. |
| Validation | Add Zod 4 at API/controller boundaries | Boundary bugs are current weak point. |
| Dates | Centralize date-key helpers | Main risk is inconsistent UTC/local conversion. |
| Export | Prefer server-generated CSV | Requirement is CSV; avoids browser XLSX fragility. |
| Infra | Do not add Redis, queues, realtime, BI/report service | Scale and workflow do not justify complexity. |

## Table Stakes for v1

- Employee/admin login and role-based access.
- Admin-created employee accounts.
- Default-eating model: no row means eating; absence row means not eating.
- Employee absence reporting and cancellation before cutoff.
- Admin-configurable global cutoff time.
- Holiday/weekend exclusion from meal days.
- Weekly menu management and employee weekly menu display.
- Admin daily meal totals: active employees minus absences.
- Admin daily absence list.
- Employee personal history and admin per-employee history.
- Date range reports.
- CSV export for kitchen/internal reconciliation.
- Clear Vietnamese UI states: `Mặc định có cơm`, `Báo nghỉ cơm`, `Đã chốt`.

## Differentiators Worth v1

- Absence-first UX with one-click report/cancel absence.
- Weekly overview combining menu and absence status.
- Admin daily operations dashboard for today/tomorrow totals, absent names, deadline state.
- CSV tailored for kitchen: dates, totals, absent employees, relevant notes/menu.
- Clear deadline lock messaging.

## Defer to v2+

- Notifications/reminders via email/Zalo/Slack.
- Kitchen/vendor role.
- Payroll/cost deduction reports.
- Multiple meal choices/dietary preferences.
- Native mobile app.
- QR/check-in.
- Analytics trends.
- Full audit ledger.
- Per-user/per-department cutoff policies.

## Architecture Direction

Keep current layered architecture:

```text
Employee/Admin pages
  -> src/lib/api.ts + feature hooks
  -> app/api/**/route.ts
  -> Controllers
  -> Services
  -> Repositories
  -> Prisma SQLite/libSQL
```

Recommended additions:

- `ReportService` for daily/range meal counts and absence lists.
- `SettingsService` + `SettingsRepository` for cutoff policy.
- `AppSetting` model with key `registration.cutoff`.
- `ReportDTO` and `SettingsDTO` for stable API/export shapes.
- Date-key helpers in `src/lib/registrationWindow.ts` or `src/lib/dateKeys.ts`.
- CSV helper/service for escaping and response generation.
- Feature hooks: `useAdminReports`, `useWeeklyMenu`.

Core domain rule:

```text
No Registration row for user/date -> default eating
Registration(status = 'not_eating') -> absent/no lunch
Registration(status = 'eating') -> legacy/manual override only, not required for normal flow
Holiday/weekend -> no lunch service unless future admin override exists
mealCount(date) = activeEmployeeCount - notEatingCount
```

## Top Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Default-eat modeled as opt-in | Undercount meals | Active employee + eligible day + no opt-out = eating. |
| UTC/local date drift | Wrong report/menu/cutoff/history day | Central business date helpers; avoid ad-hoc ISO conversion. |
| Cutoff only client-side | Late changes after counts sent | Store policy server-side; enforce in `RegistrationService`. |
| Admin report date range bug | Empty/wrong preview/export | Replace optional positional filters with explicit report service. |
| Duplicated count semantics | Dashboard/report/export disagree | One report service computes effective lunch status and totals. |
| Holidays/weekends counted | Over-ordering | Meal-eligible day = weekday and not configured holiday. |
| Export differs from preview | Kitchen receives wrong file | Server CSV from same `ReportService` as preview. |
| Large page refactor blast radius | Regressions while adding features | Extract hooks/components only in touched areas. |

## Roadmap Implications

1. **Correctness Foundation** — fix report date bug, centralize date keys, fix response contracts, add regression tests.
2. **Domain Semantics and Absence Workflow** — implement default-eat semantics and employee opt-out flow.
3. **Cutoff Policy and Enforcement** — add persisted global cutoff and backend enforcement.
4. **Weekly Menu Visibility and Menu Stability** — employee weekly menu and reliable menu response/save behavior.
5. **Admin Operations, History, and CSV Export** — daily totals, absence list, history, server CSV from shared logic.
6. **Hardening, Validation, and Cleanup** — Zod, typed errors, auth/session policy, dependency cleanup, page extraction.

## Gaps to Address During Planning

- Deployment target unknown; affects cookie, database URL, and timezone handling.
- Company timezone/policy should be explicit; assume Asia/Ho_Chi_Minh unless confirmed otherwise.
- CSV vs XLSX expectation unresolved: requirement says CSV, existing UI uses XLSX.
- Logout/access revocation policy unknown.
- Historical report accuracy for disabled employees unresolved.
- Admin correction/audit rules need lightweight definition.

## Sources

- `.planning/PROJECT.md`
- `.planning/research/STACK.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONCERNS.md`
