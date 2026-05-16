# Coding Conventions

**Analysis Date:** 2026-05-16

## Naming Patterns

**Files:**
- Use PascalCase for class-like domain files: `src/services/RegistrationService.ts`, `src/controllers/RegistrationsController.ts`, `src/repositories/BaseRepository.ts`, `src/dto/RegistrationDTO.ts`.
- Use camelCase for utility and hook files: `src/lib/registrationWindow.ts`, `src/lib/statusUtils.ts`, `src/hooks/useRegistrations.ts`.
- Use Next.js App Router names for routes and pages: `app/api/registrations/route.ts`, `app/(employee)/book/page.tsx`, `app/admin/dashboard/page.tsx`.
- Use component PascalCase for reusable UI files: `app/components/sidebar/EmployeeSidebar.tsx`, `app/components/sidebar/AdminSidebar.tsx`.

**Functions:**
- Use camelCase for functions and methods: `formatWeekRangeDate` in `app/(employee)/book/page.tsx`, `getRegistrationDateKey` in `src/hooks/useRegistrations.ts`, `validateEditableDate` in `src/services/RegistrationService.ts`.
- Use verb-led names for async effects and actions: `fetchRegistrations`, `setStatus`, `toggle` in `src/hooks/useRegistrations.ts`; `findAll`, `findOne`, `create`, `update`, `delete` in `src/services/RegistrationService.ts`.
- Use `use*` prefix for React hooks: `useRegistrations` in `src/hooks/useRegistrations.ts`.

**Variables:**
- Use camelCase local variables and state: `weekOffset`, `mockStatuses`, `dateKey`, `startDate`, `endDate` in `app/(employee)/book/page.tsx`, `app/(employee)/book/page.test.tsx`, and `src/controllers/RegistrationsController.ts`.
- Use UPPER_SNAKE_CASE for exported constants: `MAX_BOOKING_WEEK_OFFSET` imported from `src/lib/registrationWindow.ts`.

**Types:**
- Use PascalCase for types, interfaces, DTOs, and classes: `RegistrationWithUser`, `CreateRegistrationDTO`, `UpdateRegistrationDTO`, `RegistrationService`, `BaseRepository`.
- Use narrow string unions for UI/domain state: `type Status = "eating" | "not-eating"` in `app/(employee)/book/page.tsx`, `RegistrationStatus` imported in `src/services/RegistrationService.ts`.

## Code Style

**Formatting:**
- No Prettier config detected at project root.
- Mixed quote style exists: root configs use single quotes in `vitest.config.ts`; some UI files use double quotes in `app/(employee)/book/page.tsx`; ESLint config uses double quotes in `eslint.config.mjs`. Match local file style when editing.
- Use 2-space indentation in TypeScript/TSX and config files, as shown in `src/services/RegistrationService.ts`, `app/(employee)/book/page.tsx`, `vitest.config.ts`, and `eslint.config.mjs`.
- Prefer trailing commas only where existing formatter/linter allows; current files generally omit trailing semicolons and use no semicolons.

**Linting:**
- ESLint 9 with Next.js core web vitals and TypeScript rules is configured in `eslint.config.mjs`.
- Lint command is `npm run lint`, mapped to `eslint` in `package.json`.
- Global ignores in `eslint.config.mjs`: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.
- TypeScript strict mode enabled in `tsconfig.json` via `strict: true`, `isolatedModules: true`, and `noEmit: true`.

## Import Organization

**Order:**
1. Framework/runtime imports first: `next/server`, `react`, `vitest`, `@testing-library/react`.
2. App modules via alias next: `@/services/RegistrationService`, `@/dto/RegistrationDTO`, `@/lib/registrationWindow`, `@/hooks/useRegistrations`.
3. Relative imports last: `./page`, `./EmployeeSidebar` in co-located tests.

**Path Aliases:**
- Use `@/*` for `src/*`, configured in `tsconfig.json` and `vitest.config.ts`.
- App files import source modules with `@/`: `app/api/registrations/route.ts` imports `@/lib/authMiddleware` and `@/controllers/RegistrationsController`.
- Tests under `app/` use relative imports for component/page under test: `app/(employee)/book/page.test.tsx` imports `./page`.

## Error Handling

**Patterns:**
- Services throw domain errors with stable messages; controllers convert known messages to HTTP responses. Example: `src/services/RegistrationService.ts` throws `Invalid status`, `Registration not found`, `Forbidden`; `src/controllers/RegistrationsController.ts` maps them to 400/404/403 JSON responses.
- Controllers catch JSON parsing errors and return `NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })` in `src/controllers/RegistrationsController.ts`.
- Hooks catch async API failures and store displayable messages in state: `src/hooks/useRegistrations.ts` sets `error` from `err instanceof Error ? err.message : 'Failed to update registration'`.
- Do not swallow unknown controller errors; rethrow them after handling known `Error.message` cases, matching `src/controllers/RegistrationsController.ts`.

## Logging

**Framework:** console not established as a project logging pattern.

**Patterns:**
- No logging abstraction detected in sampled source files.
- Prefer returning JSON errors in API/controllers and setting React error state in hooks over console logging.

## Comments

**When to Comment:**
- Use comments to clarify security/authorization intent and test setup, e.g. IDOR comments in `src/controllers/RegistrationsController.ts` and cookie helper comments in `tests/e2e/auth-flows.spec.ts`.
- Keep comments close to non-obvious behavior: seeded-user assumptions and login setup in `tests/e2e/authorization.spec.ts`.

**JSDoc/TSDoc:**
- Not detected in sampled source. Prefer readable names and narrow types over JSDoc unless public contract needs explanation.

## Function Design

**Size:**
- Keep service/controller methods focused on one action: `create`, `update`, `delete`, `countByStatus` in `src/services/RegistrationService.ts`; `getAll`, `create`, `update`, `delete` in `src/controllers/RegistrationsController.ts`.
- Extract repeated/date formatting logic into small helpers: `formatWeekRangeDate` in `app/(employee)/book/page.tsx`, `getRegistrationDateKey` in `src/hooks/useRegistrations.ts`.

**Parameters:**
- Pass request context explicitly through controllers/services: `create(req, userId, now = new Date())` in `src/controllers/RegistrationsController.ts`, `create(userId, data, now = new Date())` in `src/services/RegistrationService.ts`.
- Use optional string filters for API query params: `findAll(userId?: string, startDate?: string, endDate?: string)` in `src/services/RegistrationService.ts`.

**Return Values:**
- API controllers return `NextResponse.json(...)` directly.
- Hooks return object APIs with state and actions: `registrations`, `loading`, `error`, `setStatus`, `toggle`, `getStatusForDate`, `refetch` in `src/hooks/useRegistrations.ts`.
- Repositories return Promises and keep persistence signatures abstract in `src/repositories/BaseRepository.ts`.

## Module Design

**Exports:**
- Export classes directly from class modules: `export class RegistrationService`, `export class RegistrationsController`.
- Export hooks as named functions: `export function useRegistrations`.
- Next.js API route files export HTTP handlers: `export const GET`, `export const POST` in `app/api/registrations/route.ts`.

**Barrel Files:**
- Barrel files exist for domain layers: `src/controllers/index.ts`, `src/dto/index.ts`, `src/repositories/index.ts`, `src/services/index.ts`, and `app/components/sidebar/index.ts`.
- Prefer direct imports in route files when matching current pattern, e.g. `app/api/registrations/route.ts` imports `@/controllers/RegistrationsController` directly.

---

*Convention analysis: 2026-05-16*
