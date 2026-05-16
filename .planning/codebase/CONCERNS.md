# Codebase Concerns

**Analysis Date:** 2026-05-16

## Tech Debt

**Admin reports date filtering uses wrong argument order:**
- Issue: `AdminReportsController.getReport()` calls `registrationService.findAll(startDate!, endDate!)`, but service signature is `findAll(userId?, startDate?, endDate?)`. `startDate` becomes `userId`, `endDate` becomes `startDate`, and `endDate` is omitted.
- Files: `src/controllers/AdminReportsController.ts:21-24`, `src/services/RegistrationService.ts:34-40`, `src/repositories/RegistrationRepository.ts:13-18`
- Impact: Admin reports filter by a fake `userId` equal to date string, so reports return empty or wrong data despite valid query params.
- Fix approach: Call `findAll(undefined, startDate, endDate)` or add dedicated `findByDateRange(startDate, endDate)` service method.

**Client API response shape mismatch for daily menu by date:**
- Issue: Client type expects `{ menu: unknown }`, controller returns `{ dailyMenu: menu }`, and admin menu page reads `data.dailyMenu` through local casting.
- Files: `src/lib/api.ts:82-83`, `src/controllers/DailyMenusController.ts:18-20`, `app/admin/menu/page.tsx:77-81`
- Impact: Type safety is wrong, future callers can read missing `menu` field and break UI at runtime.
- Fix approach: Update `dailyMenusApi.getByDate()` return type to `{ dailyMenu: DailyMenu | null }` and reuse same type in `app/admin/menu/page.tsx`.

**Large page components mix state, data access, and UI rendering:**
- Issue: Several pages exceed 200 lines and contain fetching, date math, mutation loops, export logic, and JSX in one file.
- Files: `app/admin/employees/page.tsx` (396 lines), `app/admin/reports/page.tsx` (334 lines), `app/admin/menu/page.tsx` (304 lines), `app/(employee)/my-history/page.tsx` (234 lines), `app/(employee)/dashboard/page.tsx` (227 lines), `app/(employee)/book/page.tsx` (202 lines)
- Impact: Changes are hard to review, test, and reuse; small feature edits risk UI regressions.
- Fix approach: Extract page-specific hooks under `src/hooks/`, pure date helpers under `src/lib/`, and presentational components under `app/components/`.

## Known Bugs

**Logout does not invalidate existing JWT token server-side:**
- Symptoms: Logout only clears browser cookie. A copied token remains valid until its 7-day expiry because `verifyToken()` only verifies JWT signature and expiry.
- Files: `app/api/auth/logout/route.ts:2-12`, `src/lib/auth.ts:28-36`, `tests/e2e/security.spec.ts:181-206`
- Trigger: Log in, save `token` cookie value, call `/api/auth/logout`, then send saved cookie value to authenticated endpoint from another client.
- Workaround: None in current stateless JWT design.

**Admin reports cannot return intended date range:**
- Symptoms: `/api/admin/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` returns no rows because controller passes `startDate` as user id.
- Files: `app/api/admin/reports/route.ts:6-8`, `src/controllers/AdminReportsController.ts:11-24`, `src/services/RegistrationService.ts:34-40`
- Trigger: Admin opens `app/admin/reports/page.tsx` preview with day/week/month selection.
- Workaround: None in UI; controller call must change.

## Security Considerations

**Hardcoded seed credentials are printed to console:**
- Risk: Default admin and employee credentials are fixed and displayed during seed; deployed seeded databases can retain known passwords.
- Files: `prisma/seed.ts:11-20`, `prisma/seed.ts:99-101`
- Current mitigation: Passwords are bcrypt-hashed before storage in `prisma/seed.ts:12-20`.
- Recommendations: Read seed passwords from required environment variables outside local development, or force password reset on first login.

**Login rate limiter is in-memory and trusts forwarded IP directly:**
- Risk: Limits reset on process restart and do not work across multiple server instances. Untrusted `x-forwarded-for` can be spoofed without trusted proxy controls.
- Files: `src/lib/rateLimiter.ts:14-18`, `src/lib/rateLimiter.ts:24-29`, `src/lib/rateLimiter.ts:113-118`, `app/api/auth/login/route.ts:7-15`
- Current mitigation: Five failed attempts lock one IP for 15 minutes in current process.
- Recommendations: Store attempts in shared durable cache/database and derive client IP only from trusted deployment proxy headers.

**Auth cookie may be sent without Secure flag in production behind TLS-terminating proxy:**
- Risk: Login route sets `secure` only when `NODE_ENV === 'production'` and `x-forwarded-proto === 'https'`; missing or altered header leaves production auth cookie non-Secure.
- Files: `app/api/auth/login/route.ts:64-68`, `app/api/auth/logout/route.ts:5-10`
- Current mitigation: Logout route uses `secure: process.env.NODE_ENV === 'production'`.
- Recommendations: Use `secure: process.env.NODE_ENV === 'production'` consistently or enforce trusted proxy configuration.

**JWT payload lacks revocation/version checks:**
- Risk: Disabled users or password changes do not automatically invalidate already issued tokens unless each handler checks user state separately.
- Files: `src/lib/auth.ts:20-36`, `src/lib/authMiddleware.ts:7-18`, `app/api/auth/login/route.ts:29-40`
- Current mitigation: Login blocks inactive users before issuing new tokens.
- Recommendations: Include session version or token id in JWT and verify against user/session state in `withAuth()`.

## Performance Bottlenecks

**Admin menu save performs many sequential network requests:**
- Problem: Saving a 5-day week loops each day, each meal name, then update/create calls one by one.
- Files: `app/admin/menu/page.tsx:137-175`, `src/services/MealService.ts:50-60`
- Cause: Client calls `mealsExtendedApi.findOrCreate()` per entered meal and serializes all operations; service scans all active meals for each name via `findAll({ isActive: true })`.
- Improvement path: Add batch endpoint accepting all day/type/name values and perform one transaction with indexed lookup by normalized name/type.

**Report export fetches full date range without pagination or server-side export:**
- Problem: Month reports load all rows into client state and generate XLSX in browser.
- Files: `app/admin/reports/page.tsx:98-145`, `src/controllers/AdminReportsController.ts:39-52`
- Cause: No pagination, streaming, or server-side export path.
- Improvement path: Add server-side XLSX/CSV export endpoint for large ranges and keep preview limited.

## Fragile Areas

**Date handling uses local `Date` and UTC ISO conversion together:**
- Files: `app/admin/menu/page.tsx:25-41`, `app/admin/reports/page.tsx:65-90`, `src/services/RegistrationService.ts:52-55`, `src/lib/registrationWindow.ts`
- Why fragile: `toISOString().split('T')[0]` converts local dates through UTC, while registration service normalizes with `startOfLocalDay()`. Timezone boundaries can shift date keys.
- Safe modification: Centralize date key conversion through `src/lib/registrationWindow.ts` helpers like `toDateKey()` and avoid ad-hoc `toISOString().split('T')[0]` in UI.
- Test coverage: `tests/lib/registrationWindow.test.ts` covers helper behavior, but admin menu/report page date math lacks direct tests.

**Error mapping depends on exact string messages:**
- Files: `src/controllers/RegistrationsController.ts:55-64`, `src/controllers/RegistrationsController.ts:79-91`, `src/controllers/DailyMenusController.ts:38-47`, `src/services/RegistrationService.ts:27-32`, `src/services/MealService.ts:21-46`
- Why fragile: Changing service error text changes HTTP status mapping. Some messages mix English and Vietnamese strings.
- Safe modification: Use typed domain errors with stable codes, then map codes to HTTP responses in controllers.
- Test coverage: Controller tests cover some mappings in `tests/controllers/RegistrationsController.test.ts`, but pattern remains easy to break.

**Shared API client redirects inside generic fetch helper:**
- Files: `src/lib/api.ts:13-47`
- Why fragile: `apiFetch()` calls `window.location.href` for 401/403, tying all callers to browser navigation and making non-page use harder.
- Safe modification: Keep fetch helper pure; handle auth redirects in page/layout boundary or response interceptor wrapper.
- Test coverage: Hook tests exist in `tests/hooks/useRegistrations.test.ts` and `tests/hooks/useDailyMenus.test.ts`, but redirect side effect is not isolated.

## Scaling Limits

**SQLite/libSQL schema has minimal indexes for report workloads:**
- Current capacity: Suitable for small employee counts and short date ranges.
- Limit: `Registration` has `@@index([userId])` and `@@unique([userId, date])`, but no standalone `date` or `(date, status)` index for admin reports/counts.
- Scaling path: Add indexes such as `@@index([date])` and `@@index([date, status])` after measuring query plans.
- Files: `prisma/schema.prisma:57-71`, `src/services/RegistrationService.ts:86-103`, `src/controllers/AdminReportsController.ts:21-44`

## Dependencies at Risk

**`xlsx` browser export increases bundle and client memory pressure:**
- Risk: Large dependency and in-browser workbook creation can hurt admin report page load/export for big datasets.
- Impact: `app/admin/reports/page.tsx` imports `xlsx` directly in client component.
- Migration plan: Move export generation to server route or dynamically import `xlsx` only inside `handleExport()`.
- Files: `app/admin/reports/page.tsx:0-4`, `app/admin/reports/page.tsx:132-145`, `package.json:24`

**Duplicate JWT libraries installed:**
- Risk: `jose` and `jsonwebtoken` are both dependencies, but auth implementation uses `jose`; unused crypto library expands dependency surface.
- Impact: More dependency audit noise and potential bundle/server package bloat.
- Migration plan: Remove `jsonwebtoken` if no code references it, keep `jose` in `src/lib/auth.ts`.
- Files: `package.json:18-19`, `src/lib/auth.ts:1-36`

## Missing Critical Features

**No durable session revocation:**
- Problem: Stateless JWTs cannot be invalidated before expiry after logout, password change, user disable, or suspected compromise.
- Blocks: Strong session security and immediate account lockout enforcement.
- Files: `src/lib/auth.ts:20-36`, `src/lib/authMiddleware.ts:7-18`, `app/api/auth/logout/route.ts:2-12`

**No uniqueness constraint for meal names/type:**
- Problem: `MealService.findOrCreateByName()` performs case-insensitive in-memory search but schema has no unique normalized key.
- Blocks: Reliable concurrent menu editing; duplicate meals can be created by racing requests.
- Files: `src/services/MealService.ts:50-60`, `prisma/schema.prisma:22-32`, `app/admin/menu/page.tsx:151-160`

## Test Coverage Gaps

**Admin reports controller lacks regression coverage for date range argument order:**
- What's not tested: `AdminReportsController.getReport()` passing date filters correctly to `RegistrationService.findAll()`.
- Files: `src/controllers/AdminReportsController.ts:21-24`, `tests/controllers/` (no `AdminReportsController.test.ts` detected)
- Risk: Reports can stay empty while core registration tests pass.
- Priority: High

**Logout invalidation test expectation does not match stateless implementation:**
- What's not tested: Server-side token revocation after logout. Existing E2E expects invalidation, but route only clears cookie.
- Files: `tests/e2e/security.spec.ts:181-206`, `app/api/auth/logout/route.ts:2-12`, `src/lib/auth.ts:28-36`
- Risk: False confidence in session invalidation behavior.
- Priority: High

**Admin menu save partial failures are swallowed:**
- What's not tested: Failed `findOrCreate`, failed update, and failed create paths are silently skipped while success notification still appears.
- Files: `app/admin/menu/page.tsx:151-179`, `tests/e2e/meals-holidays.spec.ts`
- Risk: Admin sees "Đã lưu thực đơn tuần này" even when some meals/days were not saved.
- Priority: Medium

---

*Concerns audit: 2026-05-16*
