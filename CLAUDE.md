# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->


## Build & Test

_Add your build and test commands here_

```bash
# Example:
# npm install
# npm test
```

## Architecture Overview

_Add a brief overview of your project architecture_

## Conventions & Patterns

_Add your project-specific conventions here_

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Báo Cơm Trưa Công Ty**

Web app báo cơm trưa nội bộ cho công ty nhỏ dưới 50 người. Nhân viên mặc định có cơm mỗi ngày và chỉ cần báo nghỉ khi không ăn; Admin/HR quản nhân viên, deadline báo nghỉ, menu tuần, và báo cáo số suất.

Mục tiêu của project hiện tại là hoàn thiện v1 từ codebase brownfield đã có, không làm lại từ đầu.

**Core Value:** Giảm thao tác tổng hợp cơm trưa thủ công bằng cách cho admin biết đúng số suất cần đặt mỗi ngày.

### Constraints

- **Tech stack**: Giữ Next.js 16, React 19, TypeScript, Prisma, SQLite/libSQL — codebase đã xây theo stack này.
- **Architecture**: Giữ pattern App Router → API route → Controller → Service → Repository → Prisma — giảm rủi ro trong brownfield.
- **Scope**: Hoàn thiện v1 từ app hiện có, không rebuild toàn bộ — mục tiêu là ship nội bộ nhanh.
- **User model**: Chỉ nhân viên và Admin/HR trong v1 — tránh thêm vai trò nhà bếp/kế toán.
- **Scale**: Dưới 50 nhân viên — ưu tiên đơn giản, không over-engineer pagination hoặc distributed infra.
- **Auth**: Admin tạo tài khoản — không cần self-service signup trong v1.
- **Workflow**: Mặc định ăn, báo nghỉ là hành động chính — UI và logic phải tối ưu cho ít thao tác.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5 - Next.js app, API routes, controllers, services, repositories in `app/**/*.tsx`, `app/api/**/route.ts`, and `src/**/*.ts`; strict mode enabled in `tsconfig.json`.
- TSX / React JSX - UI pages and components in `app/(auth)`, `app/(employee)`, `app/admin`, and `app/components`.
- JavaScript - Shell/API helper test scripts in `tests/bash/api-auth-tests.js`; npm config files use JS/MJS in `eslint.config.mjs` and `postcss.config.mjs`.
- SQL - Prisma migrations in `prisma/migrations/20260512091056_init/migration.sql` and `prisma/migrations/20260512091648_add_fk_indexes/migration.sql`.
## Runtime
- Node.js v22.19.0 observed by `node --version` in this workspace.
- npm 11.14.1 observed by `npm --version`.
- Next.js server runtime for app router pages and API routes under `app/`.
- npm 11.14.1.
- Lockfile: present at `package-lock.json`, lockfileVersion 3.
## Frameworks
- Next.js 16.2.6 - app router, server API routes, build/dev/start scripts in `package.json`; config in `next.config.ts`.
- React 19.2.4 and React DOM 19.2.4 - UI components and pages under `app/`.
- Prisma 7.8.0 - ORM/client generation with schema at `prisma/schema.prisma`; config at `prisma.config.ts`.
- Tailwind CSS 4 - styling pipeline via `@tailwindcss/postcss` in `postcss.config.mjs`.
- Vitest 4.1.6 - unit/component tests; config in `vitest.config.ts`; command `npm test` from `package.json`.
- Testing Library React 16.3.2 and Jest DOM 6.9.1 - component testing dependencies in `package.json`.
- Playwright 1.60.0 - E2E tests under `tests/e2e`; config in `playwright.config.ts`.
- jsdom 29.1.1 - Vitest environment in `vitest.config.ts`.
- TypeScript compiler 5 - configured in `tsconfig.json` with `strict: true`, `moduleResolution: bundler`, and alias `@/*` to `./src/*`.
- ESLint 9 with `eslint-config-next` 16.2.6 - lint command `eslint` in `package.json`; config in `eslint.config.mjs`.
- tsx 4.21.0 - Prisma seed runner via `package.json` and `prisma.config.ts`.
- ts-node 10.9.2 - dev dependency for TypeScript tooling.
## Key Dependencies
- `@prisma/client` 7.8.0 - typed database access in `src/lib/prisma.ts` and repositories under `src/repositories/`.
- `@prisma/adapter-libsql` 7.8.0 and `@libsql/client` 0.17.3 - Prisma driver adapter configured in `src/lib/prisma.ts`.
- `better-sqlite3` 12.9.0 - SQLite/local database dependency in `package.json`.
- `jose` 6.2.3 - JWT signing and verification in `src/lib/auth.ts`.
- `bcryptjs` 3.0.3 - password hashing and verification in `src/lib/auth.ts`.
- `xlsx` 0.18.5 - report export UI in `app/admin/reports/page.tsx`.
- `jsonwebtoken` 9.0.3 - installed dependency, but token implementation uses `jose` in `src/lib/auth.ts`.
- `@types/node` 20, `@types/react` 19, `@types/react-dom` 19 - TypeScript types in `package.json`.
- `@types/bcryptjs` 2.4.6 and `@types/jsonwebtoken` 9.0.10 - type packages in `package.json`.
## Configuration
- `.env` file present - contains environment configuration; contents not read.
- `DATABASE_URL` used by Prisma config in `prisma.config.ts` and by runtime client in `src/lib/prisma.ts`; runtime fallback is `file:./prisma/dev.db`.
- `JWT_SECRET` required at module load in `src/lib/auth.ts`; missing value throws `JWT_SECRET environment variable is required`.
- `NODE_ENV` controls production cookie security in `app/api/auth/login/route.ts` and Prisma singleton reuse in `src/lib/prisma.ts`.
- `RATE_LIMIT_BYPASS` is supplied by Playwright webServer env in `playwright.config.ts`.
- `package.json` scripts: `dev` -> `next dev`, `build` -> `next build`, `start` -> `next start`, `lint` -> `eslint`, `test` -> `vitest`.
- `tsconfig.json` sets `target: ES2017`, `jsx: react-jsx`, `strict: true`, and `@/*` path alias to `src/*`.
- `next.config.ts` sets `allowedDevOrigins` for `192.168.4.105`, `192.168.4.116`, and `192.168.4.119`.
- `eslint.config.mjs` uses Next core web vitals and TypeScript presets.
- `postcss.config.mjs` loads `@tailwindcss/postcss`.
- `prisma.config.ts` points schema to `prisma/schema.prisma`, migrations to `prisma/migrations`, and seed to `tsx prisma/seed.ts`.
## Platform Requirements
- Use Node.js/npm environment compatible with Next.js 16 and React 19; current workspace uses Node v22.19.0 and npm 11.14.1.
- Run `npm install` from `package-lock.json` before `npm run dev`, `npm run build`, `npm run lint`, or `npm test`.
- Provide `JWT_SECRET` for app/API startup because `src/lib/auth.ts` throws without it.
- Provide `DATABASE_URL` for non-default DB; absent value uses local SQLite file `file:./prisma/dev.db` in `src/lib/prisma.ts`.
- Next.js production server via `npm run build` then `npm start` from `package.json`.
- Database provider is SQLite in `prisma/schema.prisma`; runtime connection uses libSQL adapter in `src/lib/prisma.ts`, so production should provide a valid `DATABASE_URL`.
- HTTPS proxy header `x-forwarded-proto: https` affects secure auth cookie setting in `app/api/auth/login/route.ts`.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Use PascalCase for class-like domain files: `src/services/RegistrationService.ts`, `src/controllers/RegistrationsController.ts`, `src/repositories/BaseRepository.ts`, `src/dto/RegistrationDTO.ts`.
- Use camelCase for utility and hook files: `src/lib/registrationWindow.ts`, `src/lib/statusUtils.ts`, `src/hooks/useRegistrations.ts`.
- Use Next.js App Router names for routes and pages: `app/api/registrations/route.ts`, `app/(employee)/book/page.tsx`, `app/admin/dashboard/page.tsx`.
- Use component PascalCase for reusable UI files: `app/components/sidebar/EmployeeSidebar.tsx`, `app/components/sidebar/AdminSidebar.tsx`.
- Use camelCase for functions and methods: `formatWeekRangeDate` in `app/(employee)/book/page.tsx`, `getRegistrationDateKey` in `src/hooks/useRegistrations.ts`, `validateEditableDate` in `src/services/RegistrationService.ts`.
- Use verb-led names for async effects and actions: `fetchRegistrations`, `setStatus`, `toggle` in `src/hooks/useRegistrations.ts`; `findAll`, `findOne`, `create`, `update`, `delete` in `src/services/RegistrationService.ts`.
- Use `use*` prefix for React hooks: `useRegistrations` in `src/hooks/useRegistrations.ts`.
- Use camelCase local variables and state: `weekOffset`, `mockStatuses`, `dateKey`, `startDate`, `endDate` in `app/(employee)/book/page.tsx`, `app/(employee)/book/page.test.tsx`, and `src/controllers/RegistrationsController.ts`.
- Use UPPER_SNAKE_CASE for exported constants: `MAX_BOOKING_WEEK_OFFSET` imported from `src/lib/registrationWindow.ts`.
- Use PascalCase for types, interfaces, DTOs, and classes: `RegistrationWithUser`, `CreateRegistrationDTO`, `UpdateRegistrationDTO`, `RegistrationService`, `BaseRepository`.
- Use narrow string unions for UI/domain state: `type Status = "eating" | "not-eating"` in `app/(employee)/book/page.tsx`, `RegistrationStatus` imported in `src/services/RegistrationService.ts`.
## Code Style
- No Prettier config detected at project root.
- Mixed quote style exists: root configs use single quotes in `vitest.config.ts`; some UI files use double quotes in `app/(employee)/book/page.tsx`; ESLint config uses double quotes in `eslint.config.mjs`. Match local file style when editing.
- Use 2-space indentation in TypeScript/TSX and config files, as shown in `src/services/RegistrationService.ts`, `app/(employee)/book/page.tsx`, `vitest.config.ts`, and `eslint.config.mjs`.
- Prefer trailing commas only where existing formatter/linter allows; current files generally omit trailing semicolons and use no semicolons.
- ESLint 9 with Next.js core web vitals and TypeScript rules is configured in `eslint.config.mjs`.
- Lint command is `npm run lint`, mapped to `eslint` in `package.json`.
- Global ignores in `eslint.config.mjs`: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.
- TypeScript strict mode enabled in `tsconfig.json` via `strict: true`, `isolatedModules: true`, and `noEmit: true`.
## Import Organization
- Use `@/*` for `src/*`, configured in `tsconfig.json` and `vitest.config.ts`.
- App files import source modules with `@/`: `app/api/registrations/route.ts` imports `@/lib/authMiddleware` and `@/controllers/RegistrationsController`.
- Tests under `app/` use relative imports for component/page under test: `app/(employee)/book/page.test.tsx` imports `./page`.
## Error Handling
- Services throw domain errors with stable messages; controllers convert known messages to HTTP responses. Example: `src/services/RegistrationService.ts` throws `Invalid status`, `Registration not found`, `Forbidden`; `src/controllers/RegistrationsController.ts` maps them to 400/404/403 JSON responses.
- Controllers catch JSON parsing errors and return `NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })` in `src/controllers/RegistrationsController.ts`.
- Hooks catch async API failures and store displayable messages in state: `src/hooks/useRegistrations.ts` sets `error` from `err instanceof Error ? err.message : 'Failed to update registration'`.
- Do not swallow unknown controller errors; rethrow them after handling known `Error.message` cases, matching `src/controllers/RegistrationsController.ts`.
## Logging
- No logging abstraction detected in sampled source files.
- Prefer returning JSON errors in API/controllers and setting React error state in hooks over console logging.
## Comments
- Use comments to clarify security/authorization intent and test setup, e.g. IDOR comments in `src/controllers/RegistrationsController.ts` and cookie helper comments in `tests/e2e/auth-flows.spec.ts`.
- Keep comments close to non-obvious behavior: seeded-user assumptions and login setup in `tests/e2e/authorization.spec.ts`.
- Not detected in sampled source. Prefer readable names and narrow types over JSDoc unless public contract needs explanation.
## Function Design
- Keep service/controller methods focused on one action: `create`, `update`, `delete`, `countByStatus` in `src/services/RegistrationService.ts`; `getAll`, `create`, `update`, `delete` in `src/controllers/RegistrationsController.ts`.
- Extract repeated/date formatting logic into small helpers: `formatWeekRangeDate` in `app/(employee)/book/page.tsx`, `getRegistrationDateKey` in `src/hooks/useRegistrations.ts`.
- Pass request context explicitly through controllers/services: `create(req, userId, now = new Date())` in `src/controllers/RegistrationsController.ts`, `create(userId, data, now = new Date())` in `src/services/RegistrationService.ts`.
- Use optional string filters for API query params: `findAll(userId?: string, startDate?: string, endDate?: string)` in `src/services/RegistrationService.ts`.
- API controllers return `NextResponse.json(...)` directly.
- Hooks return object APIs with state and actions: `registrations`, `loading`, `error`, `setStatus`, `toggle`, `getStatusForDate`, `refetch` in `src/hooks/useRegistrations.ts`.
- Repositories return Promises and keep persistence signatures abstract in `src/repositories/BaseRepository.ts`.
## Module Design
- Export classes directly from class modules: `export class RegistrationService`, `export class RegistrationsController`.
- Export hooks as named functions: `export function useRegistrations`.
- Next.js API route files export HTTP handlers: `export const GET`, `export const POST` in `app/api/registrations/route.ts`.
- Barrel files exist for domain layers: `src/controllers/index.ts`, `src/dto/index.ts`, `src/repositories/index.ts`, `src/services/index.ts`, and `app/components/sidebar/index.ts`.
- Prefer direct imports in route files when matching current pattern, e.g. `app/api/registrations/route.ts` imports `@/controllers/RegistrationsController` directly.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | App metadata, viewport, fonts, global CSS, root HTML/body | `app/layout.tsx` |
| Home redirect | Redirect root route to login | `app/page.tsx` |
| Employee shell | Employee sidebar, mobile drawer, employee page frame | `app/(employee)/layout.tsx` |
| Admin shell | Admin sidebar, mobile drawer, admin page frame | `app/admin/layout.tsx` |
| UI pages | Client-rendered screens for login, booking, dashboards, admin CRUD | `app/(auth)/login/page.tsx`, `app/(employee)/book/page.tsx`, `app/admin/*/page.tsx` |
| API routes | Thin HTTP entry points that instantiate controllers and wrap auth | `app/api/**/route.ts` |
| Controllers | Parse requests, validate bodies, map service errors to HTTP responses | `src/controllers/*.ts` |
| Services | Business rules and orchestration | `src/services/*.ts` |
| Repositories | Prisma data access wrappers | `src/repositories/*.ts` |
| DTOs | Request/response type boundaries | `src/dto/*.ts` |
| Auth middleware | Cookie token enforcement and admin gate | `src/lib/authMiddleware.ts` |
| Prisma singleton | Shared Prisma client with libSQL adapter | `src/lib/prisma.ts` |
## Pattern Overview
- Use App Router file routing under `app/` for pages and API endpoints.
- Keep `app/api/**/route.ts` thin; delegate non-trivial work to `src/controllers/*Controller.ts`.
- Put business rules in `src/services/*Service.ts`, not route handlers or React pages.
- Put database access in `src/repositories/*Repository.ts`; repositories receive shared Prisma client from `src/lib/prisma.ts`.
- Use `src/lib/api.ts` as browser API facade; hooks such as `src/hooks/useRegistrations.ts` consume API facades.
## Layers
- Purpose: Render routes, layouts, and interactive client UI.
- Location: `app/`
- Contains: `page.tsx`, `layout.tsx`, shared UI under `app/components/`.
- Depends on: `src/lib/api.ts`, `src/hooks/*.ts`, Next navigation APIs.
- Used by: Browser via Next.js App Router.
- Purpose: Provide typed browser fetch calls and reusable React data hooks.
- Location: `src/lib/api.ts`, `src/hooks/`
- Contains: `apiFetch`, `authApi`, `registrationsApi`, `dailyMenusApi`, admin APIs, `useRegistrations`, `useDailyMenus`.
- Depends on: Browser `fetch`, `/api` routes.
- Used by: Client pages such as `app/(auth)/login/page.tsx` and `app/(employee)/book/page.tsx`.
- Purpose: Map HTTP methods and route params to controller methods.
- Location: `app/api/`
- Contains: `route.ts` files for auth, registrations, users, meals, daily menus, holidays, admin stats, admin reports.
- Depends on: `src/lib/authMiddleware.ts`, `src/controllers/*.ts`.
- Used by: Browser client via `src/lib/api.ts`.
- Purpose: Request parsing, validation, response shaping, HTTP status mapping.
- Location: `src/controllers/`
- Contains: `RegistrationsController`, `UsersController`, `MealsController`, `DailyMenusController`, `HolidaysController`, `AdminStatsController`, `AdminReportsController`.
- Depends on: `src/services/*.ts`, DTOs, `NextResponse`.
- Used by: API routes under `app/api/`.
- Purpose: Business rules, authorization-sensitive operations, domain calculations.
- Location: `src/services/`
- Contains: registration window validation, status counts, menu/meal/user/holiday operations.
- Depends on: repositories, DTOs, utility functions in `src/lib/`.
- Used by: Controllers.
- Purpose: Data persistence through Prisma.
- Location: `src/repositories/`
- Contains: model-specific repository classes and `BaseRepository`.
- Depends on: `@prisma/client`.
- Used by: Services.
- Purpose: SQLite schema, migrations, seed data, Prisma client configuration.
- Location: `prisma/`, `src/lib/prisma.ts`
- Contains: `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`.
- Depends on: Prisma, `@prisma/adapter-libsql`.
- Used by: Repositories through shared Prisma singleton.
## Data Flow
### Login Request Path
### Registration Create Path
### Admin Report Path
- React page state uses `useState`/`useMemo` in client components like `app/(employee)/book/page.tsx`.
- Server auth state is cookie-based JWT named `token`, set in `app/api/auth/login/route.ts` and checked by `src/lib/authMiddleware.ts`.
- Database state lives in SQLite through Prisma models in `prisma/schema.prisma`.
- Prisma client is a module-level singleton in `src/lib/prisma.ts` and cached on `globalThis` outside production.
## Key Abstractions
- Purpose: Centralize browser fetch behavior, credentials, JSON headers, auth redirects, typed endpoint helpers.
- Examples: `src/lib/api.ts`
- Pattern: `apiFetch` base function plus grouped endpoint objects (`authApi`, `registrationsApi`, `usersApi`).
- Purpose: Keep HTTP response mapping separate from route files and business logic.
- Examples: `src/controllers/RegistrationsController.ts`, `src/controllers/UsersController.ts`
- Pattern: instantiate service in constructor; expose async methods used by route handlers.
- Purpose: Enforce domain rules independent of HTTP transport.
- Examples: `src/services/RegistrationService.ts`, `src/services/DailyMenuService.ts`
- Pattern: instantiate repositories with shared Prisma client; throw domain errors for controllers to map.
- Purpose: Wrap Prisma operations and model-specific query shapes.
- Examples: `src/repositories/RegistrationRepository.ts`, `src/repositories/UserRepository.ts`
- Pattern: extend `BaseRepository` and expose model-specific methods like `upsert`, `count`, `findByUserAndDate`.
- Purpose: Type request payloads and status values.
- Examples: `src/dto/RegistrationDTO.ts`, `src/dto/UserDTO.ts`
- Pattern: exported TypeScript types/interfaces consumed by controllers and services.
## Entry Points
- Location: `app/layout.tsx`
- Triggers: All Next.js page requests.
- Responsibilities: Metadata, viewport, fonts, global body wrapper.
- Location: `app/page.tsx`
- Triggers: `GET /`.
- Responsibilities: Redirect to `/login`.
- Location: `app/(auth)/login/page.tsx`
- Triggers: `GET /login` and form submit.
- Responsibilities: Credentials input, auth API call, role-based redirect.
- Location: `app/(employee)/layout.tsx`, `app/(employee)/*/page.tsx`
- Triggers: Routes like `/dashboard`, `/book`, `/my-history`.
- Responsibilities: Employee navigation shell and booking/history screens.
- Location: `app/admin/layout.tsx`, `app/admin/*/page.tsx`
- Triggers: Routes like `/admin/dashboard`, `/admin/employees`, `/admin/menu`, `/admin/reports`.
- Responsibilities: Admin navigation shell and CRUD/report screens.
- Location: `app/api/**/route.ts`
- Triggers: HTTP requests under `/api`.
- Responsibilities: Auth wrapping, controller method dispatch, direct auth route handling.
- Location: `prisma/seed.ts`
- Triggers: `prisma db seed` via `package.json` `prisma.seed` script.
- Responsibilities: Seed application data.
## Architectural Constraints
- **Threading:** Next.js runs request handlers in JavaScript runtime; repository/service code is async and I/O-bound through Prisma.
- **Global state:** Shared Prisma singleton in `src/lib/prisma.ts`; login rate limiter singleton imported by `app/api/auth/login/route.ts` from `src/lib/rateLimiter.ts`.
- **Path alias:** `@/*` maps to `./src/*` in `tsconfig.json`; use it for imports from `src/` only.
- **Client/server boundary:** Files using `useState`, `useEffect`, `useRouter`, or browser `window` require `"use client"`; API routes and services stay server-side.
- **Auth model:** Protected API routes must use `withAuth` or `withAdmin` from `src/lib/authMiddleware.ts`; login/logout/me routes handle auth directly.
- **Database provider:** Prisma schema uses SQLite provider in `prisma/schema.prisma`; Prisma client uses libSQL adapter URL from `DATABASE_URL` with fallback `file:./prisma/dev.db` in `src/lib/prisma.ts`.
- **Circular imports:** Not detected in sampled files. Keep dependency direction `app/api` → `controllers` → `services` → `repositories` → `prisma`.
## Anti-Patterns
### Business Logic in Route Handlers
### Direct Prisma Calls from Pages
### Unprotected Admin Endpoints
### Source Imports Through Wrong Alias
## Error Handling
- Validate JSON parse errors in controllers, e.g. `src/controllers/RegistrationsController.ts` returns `400` for invalid body.
- Map domain errors to status codes in controllers, e.g. registration not found → `404`, forbidden → `403`, locked date → `400`.
- API routes catch internal failures only in direct handlers such as `app/api/auth/login/route.ts`.
- Browser code catches `APIError` at page/hook level and sets UI error state.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
