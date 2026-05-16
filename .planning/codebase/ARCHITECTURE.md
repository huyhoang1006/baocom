<!-- refreshed: 2026-05-16 -->
# Architecture

**Analysis Date:** 2026-05-16

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router UI                   │
├──────────────────┬──────────────────┬───────────────────────┤
│  Auth pages      │ Employee area    │ Admin area             │
│ `app/(auth)`     │ `app/(employee)` │ `app/admin`            │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Client API + Hooks layer                    │
│ `src/lib/api.ts`, `src/hooks/*.ts`                           │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js Route Handlers                      │
│ `app/api/**/route.ts`                                       │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│      Controllers → Services → Repositories → Prisma         │
│ `src/controllers` → `src/services` → `src/repositories`      │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQLite/libSQL database                   │
│ `prisma/schema.prisma`, `src/lib/prisma.ts`                  │
└─────────────────────────────────────────────────────────────┘
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

**Overall:** Layered Next.js App Router application with controller-service-repository backend and client-side feature hooks.

**Key Characteristics:**
- Use App Router file routing under `app/` for pages and API endpoints.
- Keep `app/api/**/route.ts` thin; delegate non-trivial work to `src/controllers/*Controller.ts`.
- Put business rules in `src/services/*Service.ts`, not route handlers or React pages.
- Put database access in `src/repositories/*Repository.ts`; repositories receive shared Prisma client from `src/lib/prisma.ts`.
- Use `src/lib/api.ts` as browser API facade; hooks such as `src/hooks/useRegistrations.ts` consume API facades.

## Layers

**Presentation Layer:**
- Purpose: Render routes, layouts, and interactive client UI.
- Location: `app/`
- Contains: `page.tsx`, `layout.tsx`, shared UI under `app/components/`.
- Depends on: `src/lib/api.ts`, `src/hooks/*.ts`, Next navigation APIs.
- Used by: Browser via Next.js App Router.

**Client Data Layer:**
- Purpose: Provide typed browser fetch calls and reusable React data hooks.
- Location: `src/lib/api.ts`, `src/hooks/`
- Contains: `apiFetch`, `authApi`, `registrationsApi`, `dailyMenusApi`, admin APIs, `useRegistrations`, `useDailyMenus`.
- Depends on: Browser `fetch`, `/api` routes.
- Used by: Client pages such as `app/(auth)/login/page.tsx` and `app/(employee)/book/page.tsx`.

**HTTP API Layer:**
- Purpose: Map HTTP methods and route params to controller methods.
- Location: `app/api/`
- Contains: `route.ts` files for auth, registrations, users, meals, daily menus, holidays, admin stats, admin reports.
- Depends on: `src/lib/authMiddleware.ts`, `src/controllers/*.ts`.
- Used by: Browser client via `src/lib/api.ts`.

**Controller Layer:**
- Purpose: Request parsing, validation, response shaping, HTTP status mapping.
- Location: `src/controllers/`
- Contains: `RegistrationsController`, `UsersController`, `MealsController`, `DailyMenusController`, `HolidaysController`, `AdminStatsController`, `AdminReportsController`.
- Depends on: `src/services/*.ts`, DTOs, `NextResponse`.
- Used by: API routes under `app/api/`.

**Service Layer:**
- Purpose: Business rules, authorization-sensitive operations, domain calculations.
- Location: `src/services/`
- Contains: registration window validation, status counts, menu/meal/user/holiday operations.
- Depends on: repositories, DTOs, utility functions in `src/lib/`.
- Used by: Controllers.

**Repository Layer:**
- Purpose: Data persistence through Prisma.
- Location: `src/repositories/`
- Contains: model-specific repository classes and `BaseRepository`.
- Depends on: `@prisma/client`.
- Used by: Services.

**Persistence Layer:**
- Purpose: SQLite schema, migrations, seed data, Prisma client configuration.
- Location: `prisma/`, `src/lib/prisma.ts`
- Contains: `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`.
- Depends on: Prisma, `@prisma/adapter-libsql`.
- Used by: Repositories through shared Prisma singleton.

## Data Flow

### Login Request Path

1. User submits login form in `app/(auth)/login/page.tsx`; page calls `authApi.login` from `src/lib/api.ts`.
2. `src/lib/api.ts` posts JSON to `/api/auth/login` with `credentials: 'include'`.
3. `app/api/auth/login/route.ts` rate-limits, validates credentials through `src/lib/auth.ts`, queries user with `prisma.user.findUnique`, signs token, and sets `token` cookie.
4. Client redirects to `/admin/dashboard` or `/dashboard` based on returned user role in `app/(auth)/login/page.tsx`.

### Registration Create Path

1. Booking page `app/(employee)/book/page.tsx` calls `setStatus` from `src/hooks/useRegistrations.ts`.
2. Hook calls `registrationsApi.create` in `src/lib/api.ts`, posting to `/api/registrations`.
3. `app/api/registrations/route.ts` wraps `POST` with `withAuth` from `src/lib/authMiddleware.ts` and calls `RegistrationsController.create`.
4. `src/controllers/RegistrationsController.ts` parses JSON, checks required `date` and `status`, then calls `RegistrationService.create`.
5. `src/services/RegistrationService.ts` validates status and editable date with `src/lib/registrationWindow.ts`, then calls `RegistrationRepository.upsert`.
6. `src/repositories/RegistrationRepository.ts` uses Prisma `registration.upsert` against SQLite tables defined in `prisma/schema.prisma`.

### Admin Report Path

1. Admin report UI calls `adminReportsApi.getReport` in `src/lib/api.ts`.
2. `app/api/admin/reports/route.ts` wraps `GET` with `withAdmin` from `src/lib/authMiddleware.ts`.
3. `src/controllers/AdminReportsController.ts` builds report response from service/repository data.
4. Response returns JSON to admin page; `xlsx` dependency supports report/export workflows where used.

**State Management:**
- React page state uses `useState`/`useMemo` in client components like `app/(employee)/book/page.tsx`.
- Server auth state is cookie-based JWT named `token`, set in `app/api/auth/login/route.ts` and checked by `src/lib/authMiddleware.ts`.
- Database state lives in SQLite through Prisma models in `prisma/schema.prisma`.
- Prisma client is a module-level singleton in `src/lib/prisma.ts` and cached on `globalThis` outside production.

## Key Abstractions

**API Facade:**
- Purpose: Centralize browser fetch behavior, credentials, JSON headers, auth redirects, typed endpoint helpers.
- Examples: `src/lib/api.ts`
- Pattern: `apiFetch` base function plus grouped endpoint objects (`authApi`, `registrationsApi`, `usersApi`).

**Controller Classes:**
- Purpose: Keep HTTP response mapping separate from route files and business logic.
- Examples: `src/controllers/RegistrationsController.ts`, `src/controllers/UsersController.ts`
- Pattern: instantiate service in constructor; expose async methods used by route handlers.

**Service Classes:**
- Purpose: Enforce domain rules independent of HTTP transport.
- Examples: `src/services/RegistrationService.ts`, `src/services/DailyMenuService.ts`
- Pattern: instantiate repositories with shared Prisma client; throw domain errors for controllers to map.

**Repository Classes:**
- Purpose: Wrap Prisma operations and model-specific query shapes.
- Examples: `src/repositories/RegistrationRepository.ts`, `src/repositories/UserRepository.ts`
- Pattern: extend `BaseRepository` and expose model-specific methods like `upsert`, `count`, `findByUserAndDate`.

**DTO Types:**
- Purpose: Type request payloads and status values.
- Examples: `src/dto/RegistrationDTO.ts`, `src/dto/UserDTO.ts`
- Pattern: exported TypeScript types/interfaces consumed by controllers and services.

## Entry Points

**Root App:**
- Location: `app/layout.tsx`
- Triggers: All Next.js page requests.
- Responsibilities: Metadata, viewport, fonts, global body wrapper.

**Root Route:**
- Location: `app/page.tsx`
- Triggers: `GET /`.
- Responsibilities: Redirect to `/login`.

**Login UI:**
- Location: `app/(auth)/login/page.tsx`
- Triggers: `GET /login` and form submit.
- Responsibilities: Credentials input, auth API call, role-based redirect.

**Employee Area:**
- Location: `app/(employee)/layout.tsx`, `app/(employee)/*/page.tsx`
- Triggers: Routes like `/dashboard`, `/book`, `/my-history`.
- Responsibilities: Employee navigation shell and booking/history screens.

**Admin Area:**
- Location: `app/admin/layout.tsx`, `app/admin/*/page.tsx`
- Triggers: Routes like `/admin/dashboard`, `/admin/employees`, `/admin/menu`, `/admin/reports`.
- Responsibilities: Admin navigation shell and CRUD/report screens.

**API Routes:**
- Location: `app/api/**/route.ts`
- Triggers: HTTP requests under `/api`.
- Responsibilities: Auth wrapping, controller method dispatch, direct auth route handling.

**Prisma Seed:**
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

**What happens:** Route handler implements validation, persistence, or domain decisions directly.
**Why it's wrong:** It bypasses controller/service layering used by routes like `app/api/registrations/route.ts` and makes tests harder.
**Do this instead:** Create/update controller/service/repository classes under `src/controllers/`, `src/services/`, and `src/repositories/`, then keep `app/api/**/route.ts` as a thin dispatcher.

### Direct Prisma Calls from Pages

**What happens:** React pages or client hooks import `src/lib/prisma.ts` or repositories.
**Why it's wrong:** It crosses client/server boundary and leaks persistence concerns into UI.
**Do this instead:** Pages call `src/lib/api.ts`; API routes call controllers/services/repositories.

### Unprotected Admin Endpoints

**What happens:** Admin route exports handlers without `withAdmin`.
**Why it's wrong:** Admin pages and APIs operate on users, reports, meals, menus, and holidays.
**Do this instead:** Wrap admin API handlers with `withAdmin` as in `app/api/admin/reports/route.ts`.

### Source Imports Through Wrong Alias

**What happens:** Use `@/app/...` or expect `@/*` to map project root.
**Why it's wrong:** `tsconfig.json` maps `@/*` only to `./src/*`.
**Do this instead:** Use relative imports inside `app/` for app components, and `@/lib/*`, `@/controllers/*`, `@/services/*` for `src/` imports.

## Error Handling

**Strategy:** Controllers and route handlers return `NextResponse.json` with explicit HTTP status; services throw domain errors; `apiFetch` throws `APIError` for non-2xx responses and redirects on 401/403.

**Patterns:**
- Validate JSON parse errors in controllers, e.g. `src/controllers/RegistrationsController.ts` returns `400` for invalid body.
- Map domain errors to status codes in controllers, e.g. registration not found → `404`, forbidden → `403`, locked date → `400`.
- API routes catch internal failures only in direct handlers such as `app/api/auth/login/route.ts`.
- Browser code catches `APIError` at page/hook level and sets UI error state.

## Cross-Cutting Concerns

**Logging:** Console logging appears in client login flow at `app/(auth)/login/page.tsx`; no centralized logger detected.
**Validation:** Controllers validate request shape; services validate domain rules; Prisma schema enforces uniqueness and relations in `prisma/schema.prisma`.
**Authentication:** JWT cookie `token` is created by `app/api/auth/login/route.ts`; `src/lib/authMiddleware.ts` validates token for protected APIs and enforces admin role.
**Rate limiting:** Login route uses `loginRateLimiter` from `src/lib/rateLimiter.ts` before credential checks.
**Styling:** Tailwind utility classes and CSS custom properties drive app UI; root imports `app/globals.css`.

---

*Architecture analysis: 2026-05-16*
