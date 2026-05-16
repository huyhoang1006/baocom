# Feature Landscape

**Domain:** Small internal company lunch meal reporting / meal registration web app
**Project:** Báo Cơm Trưa Công Ty
**Researched:** 2026-05-16
**Scope:** Brownfield v1 for <50 employees. Existing app already has auth, employee/admin areas, registrations, menu, holidays, reports, export foundations.
**Overall confidence:** MEDIUM. Project requirements and codebase evidence are HIGH; external ecosystem search returned weak/no useful results, so feature judgments rely mainly on internal workflow fit and comparable office meal ordering patterns.

## Table Stakes

Features users expect. Missing = app fails core job: tell admin correct lunch quantity and who is absent.

| Feature | Why Expected | Complexity | V1? | Notes |
|---------|--------------|------------|-----|-------|
| Employee login and role-based access | Meal status is per person; admin functions need separation | Existing | Yes | Already present. Keep as foundation, avoid self-service signup in v1. |
| Admin-created employee accounts | Small internal app needs controlled user list, not public signup | Existing | Yes | Existing employee management fits <50 employees. |
| Default eating model | Project core workflow: employees eat by default and only report absence | Medium | Yes | Must reframe UI and backend semantics around absence, not daily opt-in. |
| Employee absence reporting | Main employee action; reduces daily manual confirmation | Medium | Yes | UI should make “I will not eat on date” obvious and reversible before deadline. |
| Deadline / cutoff enforcement | Admin needs stable order count after cutoff | Medium | Yes | Existing registration window logic exists; v1 needs admin-configurable cutoff, not hardcoded policy. |
| Admin deadline configuration | Company policy can change; hardcoded time creates support burden | Medium | Yes | Keep simple: one global daily cutoff time. Avoid per-department/per-user rules. |
| Holiday / non-working day exclusion | No lunch needed on holidays; prevents false totals | Existing/Low | Yes | Already present. Ensure reports/menu/counts respect holidays. |
| Weekly lunch menu display for employees | Employees expect to see what is served before deciding absence | Existing/Medium | Yes | Existing admin menu exists; v1 should expose stable weekly view to employees. |
| Admin weekly menu management | Admin/HR must maintain meal plan shown to staff | Existing/Medium | Yes | Existing 5-day grid fits v1; fix partial-save risk before expanding. |
| Daily meal totals | Core value: know number of portions to order each day | Medium | Yes | Calculate total active employees minus absences minus holidays/non-working days. |
| Daily absence list | Admin needs names behind count for verification and corrections | Medium | Yes | Required for follow-up with employees and internal audit. |
| Employee personal history | Employees need confirm what they reported/eaten historically | Existing/Low | Yes | Existing page; align labels with default-eating model. |
| Admin per-employee history | HR/admin needs audit view for specific employee | Medium | Yes | Active requirement. Keep date range simple. |
| CSV export | Admin needs shareable report for kitchen/internal reconciliation | Medium | Yes | Prefer CSV over XLSX for v1: smaller, stable, enough for <50 employees. |
| Date range report filters | Admin needs daily/weekly/monthly views without manual spreadsheet filtering | Existing but buggy/Medium | Yes | Must fix argument-order bug and timezone/date-key handling. |
| Clear status states | Users must distinguish eating/default, absent, holiday, past locked, future editable | Medium | Yes | Prevents mistaken assumptions from hidden default-eating rule. |
| Basic admin corrections | Admin may need correct accidental absence or employee request | Medium | Yes | Existing registration CRUD likely covers some. Keep audit-light for v1. |
| Vietnamese UI copy for core actions | Current domain/users are Vietnamese; clear labels reduce mistakes | Low | Yes | Use “Mặc định có cơm”, “Báo nghỉ cơm”, “Đã chốt”. |

## Differentiators

Features not needed for baseline, but useful. For v1, only include if cheap and directly supports core workflow.

| Feature | Value Proposition | Complexity | V1? | Notes |
|---------|-------------------|------------|-----|-------|
| Absence-first UX | Fewer clicks than classic daily meal booking | Medium | Yes | This is project’s key differentiator. Dashboard should show today/tomorrow status and one-click absence. |
| Weekly overview with menu + absence status | Employees can decide absences from one screen | Medium | Yes | Good v1 value if built on existing menu and registration data. |
| Admin daily operations dashboard | One screen for today/tomorrow: total portions, absent names, deadline state | Medium | Yes | Strongly recommended for v1 because it maps to admin’s real daily task. |
| CSV tailored for kitchen | Export only date, total portions, absent employees, notes/menu | Low/Medium | Yes | Better than generic raw registration export. |
| Deadline lock messaging | Users see why action is disabled and who to contact | Low | Yes | Reduces support after cutoff. |
| Bulk weekly menu entry | Saves admin time entering 5-day menu | Existing/Medium | Yes, stabilize existing | Do not expand. Fix reliability and partial-failure messaging. |
| Auto reminders before cutoff | Reduces missed absence reports | Medium/High | No | Needs notification channel and scheduling. Defer until core data is trusted. |
| Email/Zalo/Slack notification integration | Pushes reminders and daily totals automatically | High | No | Overkill for <50 v1; add only after manual CSV/dashboard proves value. |
| Kitchen/vendor role | Lets kitchen see totals directly | Medium/High | No | Out of scope. CSV/export is enough. |
| Meal preference / choice selection | Handles multiple meal choices or dietary needs | Medium/High | No | Current goal is total portions, not choice marketplace. Adds complexity to menu/count model. |
| Cost/payroll deduction reports | Supports accounting workflows | High | No | Explicitly out of scope; can distort v1 around finance instead of ordering. |
| Native mobile app | Better phone UX | High | No | Responsive web is enough. |
| QR/check-in at lunch pickup | Verifies actual consumption | High | No | Not needed for absence reporting and <50 employees. |
| Analytics trends | Shows absence trends/cost savings | Medium | No | Nice later; not needed to place lunch order. |

## Anti-Features

Features to explicitly NOT build for v1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Daily required opt-in for every employee | Contradicts core decision that employees eat by default; increases employee burden | Store/report absences only; compute eating by default. |
| Self-service signup | Internal company app needs controlled roster; adds approval, spam, duplicate identity concerns | Admin creates accounts. |
| Multi-role system beyond employee/admin | Kitchen/accounting roles add permissions and UI surfaces not needed for v1 | Admin exports CSV or shares daily total. |
| Payroll deduction / billing automation | Explicitly out of scope and requires policy, audit, corrections, approvals | Keep CSV history for manual reconciliation only. |
| Complex pagination/infinite reporting | <50 employees and short ranges do not need enterprise report UX | Use simple date range filters and CSV export. |
| XLSX-heavy client export as primary path | Existing concern: bundle/memory pressure and unnecessary for v1 | Prefer server-generated or lightweight CSV; dynamic import only if XLSX kept. |
| Per-user/per-department cutoff rules | Adds policy complexity and edge cases | One global cutoff time for v1. |
| Multiple meal choices per day | Turns app into meal ordering platform; changes count semantics | One daily lunch/menu plan with absence reporting. |
| Realtime collaboration/presence | Admin count can refresh manually; small team does not need realtime infra | Provide reload/refresh and clear saved state. |
| Native mobile app | Duplicates product surface and slows v1 | Responsive Next.js web. |
| Full audit ledger for every change | Useful later but heavy for v1 | Keep updated timestamps and clear admin correction rules. |

## Feature Dependencies

```text
Auth + employee roster → default eating calculations
Auth + roles → employee/admin page access
Employee roster + active status → daily total baseline
Holiday calendar → daily total exclusion + disabled absence reporting
Deadline config → editable/locked absence status
Date-key utilities → deadline, menu, reports, history correctness
Absence reporting → daily totals + absence list + personal history
Weekly menu management → employee weekly menu display
Admin report date filters → CSV export + per-employee history
Daily totals → kitchen CSV export
Absence list → admin corrections + reconciliation
Admin dashboard → daily totals + absence list + deadline state
```

## MVP Recommendation

Prioritize v1 features in this order:

1. **Date/report correctness foundation**
   - Fix admin report date-range argument order.
   - Centralize date-key handling and remove ad-hoc `toISOString().split('T')[0]` from critical report/menu flows.
   - Align daily menu API response type with actual controller response.

2. **Default eating + absence workflow**
   - Employee dashboard/booking uses absence-first language and behavior.
   - Employee can report/cancel absence for editable future dates.
   - Locked dates explain deadline.

3. **Deadline configuration**
   - Admin sets one global cutoff time.
   - Registration service enforces same rule for UI/API.
   - Tests cover before/after cutoff.

4. **Admin daily operations view**
   - Show today/tomorrow or selected date total portions.
   - Show absent employee list.
   - Respect active employees and holidays.

5. **Weekly menu visibility**
   - Admin maintains weekly menu using existing grid.
   - Employee sees current week menu with absence status.
   - Fix menu save partial failure messaging if touched.

6. **History and export**
   - Employee personal history.
   - Admin per-employee history.
   - CSV export for date range and/or selected day kitchen handoff.

Defer:

- **Notifications/reminders:** useful but needs scheduler/channel decisions.
- **Kitchen role:** CSV/share is enough for v1.
- **Payroll/cost tracking:** out of scope and high policy complexity.
- **Meal choices/preferences:** changes core domain from absence reporting to meal marketplace.
- **Native mobile:** responsive web enough.
- **Analytics:** wait until reliable operational data exists.

## Suggested V1 Requirements Wording

| Requirement | Acceptance Direction |
|-------------|----------------------|
| Employee reports absence | Given employee is logged in and date is before cutoff and not holiday, employee can mark absent; total portions decrease by 1. |
| Employee cancels absence | Given absence exists and date is before cutoff, employee can restore default eating; total portions increase by 1. |
| Deadline locks changes | Given cutoff passed, employee cannot change status and sees locked reason. |
| Admin configures cutoff | Given admin changes cutoff time, future editability uses new time. |
| Admin sees daily total | Given selected workday, admin sees active employee count, absence count, final lunch portions. |
| Admin sees absence list | Given selected date, admin sees absent employee names and can reconcile. |
| Employee sees weekly menu | Given weekly menu exists, employee sees meals for weekdays in current week. |
| CSV export works | Given date range, admin downloads CSV with dates, totals, absences, and relevant menu fields. |

## Complexity Notes

| Area | Complexity | Why |
|------|------------|-----|
| Default eating computation | Medium | Need derive attendance from active roster minus absences; avoid storing redundant “eating” rows for every employee/day. |
| Deadline rules | Medium | Must be consistent between frontend display and backend enforcement. |
| Date handling | High risk despite medium feature size | Existing local/UTC mixing can shift dates and break reports. Treat as foundation. |
| Reports/export | Medium | Existing bug blocks trust; CSV is simpler than XLSX. |
| Weekly menu | Medium | Existing implementation has sequential save and partial-failure risk. Stabilize, do not expand. |
| Auth/session | Medium | Existing sufficient for internal v1, but revocation remains security gap. Do not block meal features unless policy requires immediate lockout. |

## Sources

- Project requirements: `C:/Users/ADMIN/Downloads/temp_v9/baocom/.planning/PROJECT.md` (HIGH)
- Codebase architecture: `C:/Users/ADMIN/Downloads/temp_v9/baocom/.planning/codebase/ARCHITECTURE.md` (HIGH)
- Codebase concerns: `C:/Users/ADMIN/Downloads/temp_v9/baocom/.planning/codebase/CONCERNS.md` (HIGH)
- WebSearch queries attempted, but no useful result URLs returned by tool for this environment (LOW external confidence):
  - `internal office lunch ordering meal count app features absence reporting deadline menu CSV export`
  - `office meal ordering software features employees menu meal count reports`
  - `corporate cafeteria meal ordering software features menu reports employee app cutoff time`
