# Codebase Structure

**Analysis Date:** 2026-05-16

## Directory Layout

```text
baocom/
├── app/                         # Next.js App Router pages, layouts, API routes, app-scoped components/styles
│   ├── (auth)/login/page.tsx     # Public login route group
│   ├── (employee)/               # Employee layout and pages
│   ├── admin/                    # Admin layout and pages
│   ├── api/                      # Next.js route handlers under /api
│   ├── components/               # App UI/sidebar components
│   ├── globals.css               # Global styles and design tokens
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Root redirect to /login
├── src/                         # Shared application logic imported through @/* alias
│   ├── controllers/              # HTTP controller classes
│   ├── dto/                      # TypeScript DTO types
│   ├── hooks/                    # Client React data hooks
│   ├── lib/                      # API facade, auth, Prisma, utilities
│   ├── repositories/             # Prisma data access classes
│   └── services/                 # Business logic classes
├── prisma/                      # Prisma schema, migrations, seed script
├── tests/                       # Unit/integration tests for controllers/hooks
├── public/                      # Static assets served by Next.js
├── package.json                 # Scripts and dependencies
├── tsconfig.json                # TypeScript config and @/* alias
├── next.config.ts               # Next.js config
├── vitest.config.ts             # Vitest config
└── eslint.config.mjs            # ESLint config
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js route tree and UI entry points.
- Contains: Route groups, pages, layouts, API route handlers, `app/globals.css`, `app/components/`.
- Key files: `app/layout.tsx`, `app/page.tsx`, `app/(auth)/login/page.tsx`, `app/(employee)/layout.tsx`, `app/admin/layout.tsx`.

**`app/(auth)/`:**
- Purpose: Public authentication pages without URL segment prefix.
- Contains: Login page and its co-located test.
- Key files: `app/(auth)/login/page.tsx`, `app/(auth)/login/page.test.tsx`.

**`app/(employee)/`:**
- Purpose: Employee route group without URL segment prefix.
- Contains: Employee shell and pages for dashboard, booking, history.
- Key files: `app/(employee)/layout.tsx`, `app/(employee)/dashboard/page.tsx`, `app/(employee)/book/page.tsx`, `app/(employee)/my-history/page.tsx`.

**`app/admin/`:**
- Purpose: Admin route group with `/admin` URL prefix.
- Contains: Admin shell and pages for dashboard, employees, holidays, menu, reports.
- Key files: `app/admin/layout.tsx`, `app/admin/dashboard/page.tsx`, `app/admin/employees/page.tsx`, `app/admin/holidays/page.tsx`, `app/admin/menu/page.tsx`, `app/admin/reports/page.tsx`.

**`app/api/`:**
- Purpose: Next.js API route handlers.
- Contains: `route.ts` files organized by resource and dynamic segments.
- Key files: `app/api/auth/login/route.ts`, `app/api/registrations/route.ts`, `app/api/registrations/[id]/route.ts`, `app/api/users/route.ts`, `app/api/admin/reports/route.ts`.

**`app/components/`:**
- Purpose: App-scoped reusable UI components.
- Contains: Sidebar components and shared UI primitives.
- Key files: `app/components/sidebar/AdminSidebar.tsx`, `app/components/sidebar/EmployeeSidebar.tsx`, `app/components/sidebar/MobileSidebar.tsx`, `app/components/ui.tsx`.

**`src/controllers/`:**
- Purpose: HTTP-aware controller classes called by API routes.
- Contains: Controller per API resource plus barrel export.
- Key files: `src/controllers/RegistrationsController.ts`, `src/controllers/UsersController.ts`, `src/controllers/DailyMenusController.ts`, `src/controllers/AdminReportsController.ts`, `src/controllers/index.ts`.

**`src/services/`:**
- Purpose: Business logic and orchestration.
- Contains: Service per domain entity plus barrel export.
- Key files: `src/services/RegistrationService.ts`, `src/services/UserService.ts`, `src/services/MealService.ts`, `src/services/DailyMenuService.ts`, `src/services/HolidayService.ts`, `src/services/index.ts`.

**`src/repositories/`:**
- Purpose: Database access through Prisma.
- Contains: Base repository and model-specific repositories.
- Key files: `src/repositories/BaseRepository.ts`, `src/repositories/RegistrationRepository.ts`, `src/repositories/UserRepository.ts`, `src/repositories/MealRepository.ts`, `src/repositories/DailyMenuRepository.ts`, `src/repositories/HolidayRepository.ts`.

**`src/dto/`:**
- Purpose: Typed data transfer contracts.
- Contains: DTO files per domain entity and barrel export.
- Key files: `src/dto/RegistrationDTO.ts`, `src/dto/UserDTO.ts`, `src/dto/MealDTO.ts`, `src/dto/DailyMenuDTO.ts`, `src/dto/HolidayDTO.ts`, `src/dto/index.ts`.

**`src/hooks/`:**
- Purpose: Client-side data hooks for React pages.
- Contains: Hooks that call API facade and manage loading/error/state.
- Key files: `src/hooks/useRegistrations.ts`, `src/hooks/useDailyMenus.ts`.

**`src/lib/`:**
- Purpose: Shared utilities and infrastructure helpers.
- Contains: Browser API facade, auth/JWT helpers, auth middleware, Prisma singleton, rate limiter, registration date utilities, status utilities.
- Key files: `src/lib/api.ts`, `src/lib/auth.ts`, `src/lib/authMiddleware.ts`, `src/lib/prisma.ts`, `src/lib/rateLimiter.ts`, `src/lib/registrationWindow.ts`, `src/lib/statusUtils.ts`.

**`prisma/`:**
- Purpose: Database schema, migrations, seed data.
- Contains: Prisma schema, migration SQL folders, seed script.
- Key files: `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/20260512091056_init/migration.sql`, `prisma/migrations/20260512091648_add_fk_indexes/migration.sql`.

**`tests/`:**
- Purpose: Non-colocated tests for controllers and hooks.
- Contains: Test suites mirroring `src/controllers/` and `src/hooks/`.
- Key files: `tests/controllers/RegistrationsController.test.ts`, `tests/controllers/UsersController.test.ts`, `tests/hooks/useRegistrations.test.ts`, `tests/hooks/useDailyMenus.test.ts`.

**`public/`:**
- Purpose: Static assets served from web root.
- Contains: SVG assets.
- Key files: `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`.

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root app layout, metadata, fonts, global CSS.
- `app/page.tsx`: Redirects `/` to `/login`.
- `app/(auth)/login/page.tsx`: Login UI and role-based redirect.
- `app/(employee)/layout.tsx`: Employee authenticated area shell.
- `app/admin/layout.tsx`: Admin area shell.
- `app/api/**/route.ts`: HTTP API entry points.

**Configuration:**
- `package.json`: Scripts (`dev`, `build`, `start`, `lint`, `test`), dependencies, Prisma seed command.
- `tsconfig.json`: TypeScript strict mode and `@/*` alias to `./src/*`.
- `next.config.ts`: Next.js config.
- `vitest.config.ts`: Vitest config.
- `eslint.config.mjs`: ESLint config.
- `postcss.config.mjs`: PostCSS/Tailwind setup.
- `components.json`: Component tooling config.

**Core Logic:**
- `src/lib/api.ts`: Browser API client and endpoint groups.
- `src/lib/auth.ts`: Password/JWT helpers.
- `src/lib/authMiddleware.ts`: `withAuth` and `withAdmin` wrappers.
- `src/lib/prisma.ts`: Shared Prisma client.
- `src/lib/registrationWindow.ts`: Booking date/cutoff logic.
- `src/controllers/*.ts`: Request handling and HTTP response mapping.
- `src/services/*.ts`: Domain business logic.
- `src/repositories/*.ts`: Persistence layer.
- `prisma/schema.prisma`: Database models and constraints.

**Testing:**
- `app/(auth)/login/page.test.tsx`: Co-located page test.
- `app/(employee)/book/page.test.tsx`: Co-located page test.
- `app/components/sidebar/EmployeeSidebar.test.tsx`: Co-located component test.
- `tests/controllers/*.test.ts`: Controller tests.
- `tests/hooks/*.test.ts`: Hook tests.
- `vitest.config.ts`: Test runner configuration.

## Naming Conventions

**Files:**
- Next.js pages: `page.tsx` under route segment folders, e.g. `app/admin/reports/page.tsx`.
- Next.js layouts: `layout.tsx`, e.g. `app/admin/layout.tsx`.
- Next.js API handlers: `route.ts`, e.g. `app/api/users/[id]/route.ts`.
- Dynamic route segments: bracket folders, e.g. `app/api/daily-menus/[date]/route.ts` and `app/api/registrations/[id]/route.ts`.
- Controllers: PascalCase entity plus `Controller.ts`, e.g. `src/controllers/RegistrationsController.ts`.
- Services: PascalCase entity plus `Service.ts`, e.g. `src/services/RegistrationService.ts`.
- Repositories: PascalCase entity plus `Repository.ts`, e.g. `src/repositories/RegistrationRepository.ts`.
- DTOs: PascalCase entity plus `DTO.ts`, e.g. `src/dto/RegistrationDTO.ts`.
- Hooks: camelCase starting with `use`, e.g. `src/hooks/useRegistrations.ts`.
- Tests: `.test.ts` or `.test.tsx`, either co-located under `app/` or mirrored under `tests/`.

**Directories:**
- App route groups use parentheses for grouping without URL segment, e.g. `app/(employee)/`.
- URL segments use lowercase/kebab-case, e.g. `app/api/daily-menus/`.
- Source layer directories are plural lowercase, e.g. `src/controllers/`, `src/services/`, `src/repositories/`.
- Sidebar components live under feature-like subdirectory `app/components/sidebar/`.

## Where to Add New Code

**New Employee Page:**
- Primary code: `app/(employee)/<route>/page.tsx`
- Shell/navigation updates: `app/components/sidebar/EmployeeSidebar.tsx`
- Client data hook if needed: `src/hooks/use<Feature>.ts`
- API calls if needed: add grouped methods in `src/lib/api.ts`
- Tests: co-locate page test as `app/(employee)/<route>/page.test.tsx` or add behavior tests under `tests/`.

**New Admin Page:**
- Primary code: `app/admin/<route>/page.tsx`
- Shell/navigation updates: `app/components/sidebar/AdminSidebar.tsx`
- Admin API calls: add to `src/lib/api.ts`.
- Protected server endpoint: `app/api/admin/<resource>/route.ts` using `withAdmin`.
- Tests: co-locate page test or add controller tests under `tests/controllers/`.

**New API Resource:**
- Route handlers: `app/api/<resource>/route.ts` and `app/api/<resource>/[id]/route.ts` if item operations are needed.
- Controller: `src/controllers/<Resource>Controller.ts`.
- Service: `src/services/<Resource>Service.ts`.
- Repository: `src/repositories/<Resource>Repository.ts`.
- DTOs: `src/dto/<Resource>DTO.ts`.
- Barrel exports: update `src/controllers/index.ts`, `src/services/index.ts`, `src/repositories/index.ts`, `src/dto/index.ts` where current pattern applies.
- Tests: `tests/controllers/<Resource>Controller.test.ts`.

**New Database Model:**
- Schema: add model to `prisma/schema.prisma`.
- Migration: create Prisma migration under `prisma/migrations/`.
- Repository: add `src/repositories/<Model>Repository.ts`.
- Service/controller/API: add matching files in `src/services/`, `src/controllers/`, `app/api/`.
- Seed data if needed: update `prisma/seed.ts`.

**New Shared UI Component:**
- App-scoped component: `app/components/<ComponentName>.tsx` or feature subfolder like `app/components/sidebar/<ComponentName>.tsx`.
- Shared primitive already matching existing style: add export/function in `app/components/ui.tsx` if it belongs with existing primitives.
- Tests: co-locate as `app/components/<ComponentName>.test.tsx`.

**Utilities:**
- Browser/server-neutral helper: `src/lib/<name>.ts`.
- Auth helper: `src/lib/auth.ts` or `src/lib/authMiddleware.ts`.
- Date/booking rule: `src/lib/registrationWindow.ts`.
- Status mapping: `src/lib/statusUtils.ts`.

## Special Directories

**`node_modules/`:**
- Purpose: Installed dependencies.
- Generated: Yes.
- Committed: No.

**`.next/`:**
- Purpose: Next.js build/dev output and generated types.
- Generated: Yes.
- Committed: No.

**`prisma/migrations/`:**
- Purpose: Database schema migration history.
- Generated: Partly via Prisma tooling.
- Committed: Yes.

**`public/`:**
- Purpose: Static web assets.
- Generated: No.
- Committed: Yes.

**`.planning/codebase/`:**
- Purpose: Codebase mapping documents for planning/execution tools.
- Generated: Yes.
- Committed: Project-dependent.

**`.beads/`:**
- Purpose: Beads issue tracker export/state per `CLAUDE.md`.
- Generated: Tool-managed.
- Committed: Project-dependent.

**`.claude/`:**
- Purpose: Claude tooling/worktrees and local agent context.
- Generated: Yes.
- Committed: Usually no for worktree internals.

---

*Structure analysis: 2026-05-16*
