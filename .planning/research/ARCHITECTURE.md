# Architecture Research: v1 Meal Reporting Integration

**Project:** Báo Cơm Trưa Công Ty  
**Dimension:** Architecture  
**Researched:** 2026-05-16  
**Confidence:** HIGH for codebase fit; MEDIUM for exact current implementation gaps without full source audit

## Recommendation

Keep existing layered architecture:

```text
Employee/Admin pages
  -> src/lib/api.ts + feature hooks
  -> app/api/**/route.ts
  -> Controllers
  -> Services
  -> Repositories
  -> Prisma SQLite/libSQL
```

Do not introduce new app framework, queue, report service, BI layer, or separate kitchen role for v1. Company size is under 50 employees; simplest reliable design is centralized domain services with explicit date-key helpers and small admin endpoints.

Core architectural move: treat `Registration` rows as absence overrides, not daily attendance confirmations. Employee default state is eating when there is no `not_eating` registration for that employee/date and date is not holiday/weekend. Admin reports compute meal count from active employees minus absences, not from count of `eating` rows.

## Component Boundaries

| Component | Responsibility | Should Own | Should Not Own |
|-----------|----------------|------------|----------------|
| Employee booking page | Show editable weekdays, absence status, lock state, menu preview link/section | UI state, mutation trigger, user-facing messages | Cutoff math, report counts, raw Prisma calls |
| Employee weekly menu page/section | Display current/selected week menus | Week navigation, empty states | Menu persistence or meal creation |
| Admin reports page | Pick date/range, preview counts, list absences, trigger CSV | Filters, display, download action | Report calculations, CSV string construction if server-side export added |
| Admin settings/cutoff page | Configure cutoff policy | Form state, validation messages | Applying cutoff rules directly to registrations |
| `src/lib/api.ts` | Typed browser API facade | Endpoint methods and response types | Business logic or date conversion beyond query params |
| `src/hooks/*` | Page-specific client data orchestration | Loading/error/reload/mutation glue | Domain calculations needing consistency with backend |
| API routes | Thin HTTP entry | `withAuth`/`withAdmin`, controller dispatch | Validation-heavy logic or Prisma calls |
| Controllers | HTTP parsing and response mapping | Query/body parsing, stable response shape, domain error to status | Date/report business rules |
| Services | Business rules | Default-eat semantics, cutoff enforcement, report aggregation, menu week lookup | HTTP response details |
| Repositories | Prisma access | Query methods by date range/user/status | Business interpretation of missing rows |
| `src/lib/registrationWindow.ts` or new date policy module | Date keys, local day, week bounds, cutoff timestamps | Single source of truth for date math | UI-only formatting |
| Prisma schema | Durable state | Registrations, menus, holidays, settings | Derived meal counts |

## Domain Model Fit

### Existing Models

- `User`: active employee/admin accounts.
- `Registration`: currently supports `eating` and `not_eating`, unique by `(userId, date)`.
- `DailyMenu`: one menu per date.
- `Meal` / `DailyMenuMeal`: meal catalog and menu items.
- `Holiday`: company no-lunch days.

### v1 Model Direction

Use existing `Registration` table for absences. No new `Attendance` table for v1.

Recommended interpretation:

```text
No Registration row for user/date -> default eating
Registration(status = 'not_eating') -> absent/no lunch
Registration(status = 'eating') -> legacy/manual override only, do not require for normal flow
Holiday/weekend -> no lunch service unless admin explicitly includes in report later
```

This avoids writing 50 rows per day and matches product rule: nhân viên mặc định có cơm, chỉ báo nghỉ khi không ăn.

### Minimal Schema Additions

Add one settings model for cutoff. Keep global, not per-department/user.

```prisma
model AppSetting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

Initial key:

```text
registration.cutoff = {"daysBefore":1,"hour":23,"minute":0}
```

Alternative: typed `RegistrationPolicy` table. Not needed for v1 unless multiple policies appear.

Add report indexes if reports become slow, but not first task:

```prisma
@@index([date])
@@index([date, status])
```

For under 50 employees, correctness before indexes. Add indexes after report logic stabilizes if query plans need them.

## Data Flow

### 1. Employee Reports Absence

```text
app/(employee)/book/page.tsx
  -> useRegistrations.setStatus(dateKey, 'not_eating')
  -> registrationsApi.create({ date, status: 'not_eating' })
  -> POST /api/registrations withAuth
  -> RegistrationsController.create
  -> RegistrationService.createAbsence / create
  -> Policy/date helper validates target date editable
  -> RegistrationRepository.upsert(userId, localStartOfDay(date), 'not_eating')
  -> Prisma Registration upsert
```

Recommended API behavior:

- `POST /api/registrations` creates/updates absence for date.
- `DELETE /api/registrations/:id` or dedicated `DELETE /api/registrations/by-date?date=YYYY-MM-DD` cancels absence, returning user to default eating.
- UI labels should be absence-first: `Báo nghỉ`, `Hủy báo nghỉ`; not `Đăng ký ăn`.

Service rule:

```text
canEditAbsence(date, now): future weekday + not holiday + before configured cutoff
```

Admin may override later, but employee path should not bypass cutoff.

### 2. Configurable Cutoff

```text
app/admin/settings or app/admin/reports/settings section
  -> settingsApi.getRegistrationPolicy()
  -> GET /api/admin/settings/registration-policy withAdmin
  -> SettingsController.getRegistrationPolicy
  -> SettingsService.getRegistrationPolicy
  -> SettingsRepository.findByKey('registration.cutoff')
```

Update path:

```text
Admin form
  -> settingsApi.updateRegistrationPolicy(policy)
  -> PUT /api/admin/settings/registration-policy withAdmin
  -> SettingsController validates shape
  -> SettingsService validates allowed bounds
  -> SettingsRepository.upsert key/value
```

Policy should be read by `RegistrationService`, not by React pages as authority. UI can show cutoff times returned from backend, but backend enforces.

Validation bounds for v1:

- `daysBefore`: `0` or `1` only, unless company needs more.
- `hour`: `0..23`.
- `minute`: `0..59`.
- Timezone: server local company timezone. Use one date helper; avoid `toISOString().split('T')[0]`.

### 3. Weekly Menu Visibility

```text
app/(employee)/menu/page.tsx or dashboard section
  -> dailyMenusApi.getWeek(startDate)
  -> GET /api/daily-menus?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD withAuth
  -> DailyMenusController.getRange
  -> DailyMenuService.findByDateRange
  -> DailyMenuRepository.findRangeWithMeals
```

If range endpoint already missing, add it rather than making five client calls. Under 50 users, this is still simple and reduces page bugs.

Response shape should be stable:

```ts
{
  menus: Array<{
    date: string
    meals: Array<{ id: string; name: string; type: string; sortOrder: number }>
  }>
}
```

Fix existing daily menu response mismatch first: client type should match controller `{ dailyMenu: ... }` or controller should standardize to `{ menu: ... }`. Pick one shape and apply everywhere. Recommended for range: `{ menus }`; for single date: `{ dailyMenu }` to match current controller.

### 4. Admin Daily Counts And Absence List

Use one report/query service as source of truth. Do not compute in page.

```text
app/admin/reports/page.tsx
  -> adminReportsApi.getDailySummary(date)
  -> GET /api/admin/reports/daily?date=YYYY-MM-DD withAdmin
  -> AdminReportsController.getDailySummary
  -> ReportService.getDailySummary(date)
  -> UserRepository.countActiveEmployees()
  -> HolidayRepository.findByDate(date)
  -> RegistrationRepository.findAbsencesByDate(date)
  -> returns activeEmployees, absenceCount, mealCount, absences[]
```

Meal count formula:

```text
if weekend or active holiday: mealCount = 0
else mealCount = activeEmployeeCount - notEatingCount
```

Absence list:

```text
registrations where date = target local day and status = 'not_eating', include user name/username
```

Do not include `eating` rows in normal report counts. They are legacy noise unless product chooses manual override. For v1, default-eat means absence-only report.

### 5. Admin Date Range Reports

```text
GET /api/admin/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  -> AdminReportsController parses range
  -> ReportService.getRangeSummary(startDate, endDate)
  -> For each weekday/non-holiday date:
       activeEmployees - notEatingCount
       absences list/count
```

Fix current bug before adding features:

```text
registrationService.findAll(startDate!, endDate!) is wrong
findAll signature is findAll(userId?, startDate?, endDate?)
```

Recommended fix: add explicit service methods, so callers cannot swap optional positional args:

```ts
findByDateRange(startDate: string, endDate: string): Promise<RegistrationWithUser[]>
findAbsencesByDateRange(startDate: string, endDate: string): Promise<RegistrationWithUser[]>
```

Better: create `ReportService` and keep `RegistrationService` focused on registration lifecycle.

### 6. CSV Export

For v1, server-side CSV endpoint is cleaner than browser XLSX for admin reports.

```text
Admin clicks Export CSV
  -> window.location / fetch blob from /api/admin/reports/export.csv?startDate=...&endDate=...
  -> withAdmin
  -> AdminReportsController.exportCsv
  -> ReportService.getRangeSummary
  -> CsvExportService.toAdminReportCsv
  -> Response text/csv with Content-Disposition
```

Why server-side CSV:

- One canonical report calculation.
- Smaller client bundle; current `xlsx` import is risk.
- CSV is enough for sending kitchen/internal reconciliation.
- Avoid browser workbook generation complexity.

CSV columns recommended:

```text
date, weekday, active_employees, absences, meal_count, absent_employee_names
```

For absence detail CSV:

```text
date, employee_name, username, note
```

Keep two export modes only if admin needs both. Otherwise one summary CSV with absent names is enough for v1.

## Recommended Architecture Additions

| Add | Location | Purpose | Confidence |
|-----|----------|---------|------------|
| `ReportService` | `src/services/ReportService.ts` | Centralize daily/range meal counts and absence lists | HIGH |
| `SettingsService` | `src/services/SettingsService.ts` | Manage configurable cutoff policy | HIGH |
| `SettingsRepository` | `src/repositories/SettingsRepository.ts` | Read/write app settings | HIGH |
| `ReportDTO.ts` | `src/dto/ReportDTO.ts` | Stable report response/export types | MEDIUM |
| `SettingsDTO.ts` | `src/dto/SettingsDTO.ts` | Stable policy DTO | MEDIUM |
| `dateKeys` helpers | `src/lib/registrationWindow.ts` or `src/lib/dateKeys.ts` | Stop UTC/local drift | HIGH |
| `CsvExportService` or lib helper | `src/services/CsvExportService.ts` or `src/lib/csv.ts` | Escape CSV correctly and keep page thin | MEDIUM |
| `useAdminReports` hook | `src/hooks/useAdminReports.ts` | Move report page fetch/state out of 300-line page | HIGH |
| `useWeeklyMenu` hook | `src/hooks/useWeeklyMenu.ts` | Employee weekly menu data orchestration | MEDIUM |

## Patterns To Follow

### Pattern: Derived Attendance, Stored Absences

**What:** Store employee exceptions only. Derive eating count from active users minus absences.

**Use when:** Default state applies to nearly all employees most days.

**Why:** Avoids daily row generation jobs, missed cron issues, and mass updates.

```text
mealCount(date) = activeEmployeeCount(date) - notEatingCount(date)
```

Caveat: current `User` has no historical active periods. If employee is disabled later, past reports using current active count may change. For v1, acceptable if reports are operational, not payroll/legal audit. If past accuracy matters, deeper phase needs user employment history or report snapshot.

### Pattern: Explicit Service Methods Instead Of Optional Positional Filters

**What:** Replace multi-optional `findAll(userId?, startDate?, endDate?)` for reports.

**Why:** Existing admin report bug came from swapped optional args.

Use:

```text
findByUser(userId)
findByDateRange(startDate, endDate)
findAbsencesByDate(date)
```

### Pattern: Single Date-Key API Boundary

**What:** API accepts `YYYY-MM-DD`; services convert through shared local date helper.

**Why:** Current code mixes local `Date` and UTC ISO conversion.

Rule:

```text
Browser sends dateKey string -> controller validates string -> service converts with startOfLocalDayFromDateKey -> repository queries [start, nextDay)
```

Avoid:

```text
toISOString().split('T')[0]
new Date('YYYY-MM-DD') without policy
```

### Pattern: Thin Pages With Feature Hooks

**What:** Large admin/employee pages should call hooks and render components.

**Why:** Existing large pages mix data access, date math, mutation loops, export logic, and JSX.

Build small hooks first for changed areas; do not refactor whole app at once.

## Anti-Patterns To Avoid

### Anti-Pattern: Counting `eating` Registrations As Ordered Meals

**Bad:** `mealCount = count(status='eating')`.

**Why bad:** Default-eat means most users have no row. Count becomes too low.

**Instead:** `activeEmployees - notEating`.

### Anti-Pattern: Generating Daily Registrations For All Employees

**Bad:** Nightly job creates `eating` rows for everyone.

**Why bad:** Needs scheduling, backfill, holidays, failed job recovery, active user history. Overbuild for under 50 employees.

**Instead:** Store absences only; derive reports.

### Anti-Pattern: Client-Side Report Truth

**Bad:** Page fetches registrations/users/holidays then computes counts in React.

**Why bad:** CSV, dashboard, and preview drift; date bugs duplicate.

**Instead:** `ReportService` owns calculations; UI consumes one DTO.

### Anti-Pattern: More Roles For v1

**Bad:** Add kitchen role, accountant role, approval workflow.

**Why bad:** Out of scope and adds auth complexity.

**Instead:** Admin/HR exports CSV and sends outside app.

## Suggested Build Order

1. **Stabilize dates and report bug**
   - Fix `AdminReportsController` date-range argument bug.
   - Centralize date-key parsing/formatting.
   - Add regression tests for admin report date range.
   - Reason: all next features depend on correct dates/counts.

2. **Define default-eat semantics in service layer**
   - Update registration UI/API labels toward absence reporting.
   - Add report calculation `activeEmployees - notEating`.
   - Add `ReportService.getDailySummary`.
   - Reason: core domain rule must be authoritative before CSV/dashboard.

3. **Configurable cutoff policy**
   - Add `AppSetting`, repository/service/controller/admin endpoint.
   - Make `RegistrationService` read policy for edit validation.
   - Add admin UI after backend works.
   - Reason: cutoff affects allowed mutations; must precede final employee UX.

4. **Weekly menu visibility**
   - Fix daily menu response shape.
   - Add range endpoint/hook if missing.
   - Add employee weekly menu page or dashboard section.
   - Reason: mostly read-only; lower risk after date helpers are stable.

5. **Admin reports and absence list**
   - Add daily summary and range summary DTOs.
   - Refactor admin report page to use report API/hook.
   - Reason: report UX builds on default-eat + date policy.

6. **CSV export**
   - Add server-side CSV endpoint using same `ReportService`.
   - Remove or lazy-load browser `xlsx` if no longer needed.
   - Reason: export must reuse proven report calculations.

7. **Small UX cleanup and tests**
   - Extract hooks/components from changed large pages only.
   - Add tests around cutoff, date parsing, report counts, CSV escaping.
   - Reason: reduce regression without broad rewrite.

## Integration Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| UTC/local date drift | Wrong day locked, wrong menu/report date | Single date-key helper; range queries use local `[start, nextDay)` |
| Default-eat miscount | Kitchen orders wrong number | ReportService formula and tests: no registration means eating |
| Existing `eating` rows confuse reports | Counts too high/low | Reports count only `not_eating`; optionally ignore/delete legacy `eating` via migration later |
| Optional service args repeat report bug | Empty/wrong reports | Explicit date-range methods or `ReportService` query objects |
| Cutoff policy cached/stale | Employee can edit after deadline | Read policy in service per mutation; cache only if invalidation clear |
| Admin pages too large | Regression during feature work | Extract hooks around touched features, not whole-page rewrite |
| Browser XLSX dependency | Heavy bundle/client memory | Prefer server CSV endpoint for v1 |
| Disabled employees affect old reports | Historical report drift | Accept for operational v1; deeper phase if payroll/audit history required |
| Holiday/weekend semantics unclear | Report count mismatch | ReportService returns `serviceClosed` reason and mealCount 0 |

## Testing Targets

Priority tests:

- `ReportService.getDailySummary`: 3 active users, 1 absence -> mealCount 2.
- No registrations for date -> mealCount equals active employee count.
- Holiday date -> mealCount 0.
- Configured cutoff blocks employee absence mutation after cutoff.
- Admin report range passes correct start/end and returns expected dates.
- Date helper does not shift `YYYY-MM-DD` across timezone boundary.
- CSV escaping handles commas, quotes, Vietnamese names.

## Phase Implications

- Phase 1 should be architecture stabilization, not feature UI: date bug, date helpers, report service skeleton.
- Phase 2 should lock core domain semantics: default-eat and absence-only registration flow.
- Phase 3 should add configurable cutoff because it changes service rules.
- Phase 4 should add weekly menu visibility because it is read-only and depends mainly on date/week helpers.
- Phase 5 should finish admin reports and CSV export from same service calculation.

## Sources

- `C:/Users/ADMIN/Downloads/temp_v9/baocom/.planning/PROJECT.md` — project scope, active requirements, constraints.
- `C:/Users/ADMIN/Downloads/temp_v9/baocom/.planning/codebase/ARCHITECTURE.md` — current layered architecture and data flow.
- `C:/Users/ADMIN/Downloads/temp_v9/baocom/.planning/codebase/STRUCTURE.md` — file locations and extension patterns.
- `C:/Users/ADMIN/Downloads/temp_v9/baocom/.planning/codebase/CONCERNS.md` — known bugs, date/report risks, large-page concerns.
- `C:/Users/ADMIN/Downloads/temp_v9/baocom/prisma/schema.prisma` — current persistence model.
- `C:/Users/ADMIN/Downloads/temp_v9/baocom/src/lib/registrationWindow.ts` — current date/cutoff helper behavior.
- `C:/Users/ADMIN/Downloads/temp_v9/baocom/src/services/RegistrationService.ts` — current registration service semantics.
- `C:/Users/ADMIN/Downloads/temp_v9/baocom/src/controllers/AdminReportsController.ts` — current admin report flow and argument-order bug.
