# External Integrations

**Analysis Date:** 2026-05-16

## APIs & External Services

**Internal HTTP API:**
- Next.js API routes - Browser pages and hooks call same-app endpoints under `app/api/**/route.ts` through `src/lib/api.ts`.
  - SDK/Client: native `fetch` in `src/lib/api.ts`.
  - Auth: HTTP-only `token` cookie set in `app/api/auth/login/route.ts`.

**Third-party APIs:**
- Not detected. No Stripe, Supabase, AWS, SendGrid, or similar external SDK imports found in `src/**/*.ts` / `app/**/*.tsx` during integration search.

**Report Export:**
- Client-side Excel generation - Admin reports page creates `.xlsx` exports in `app/admin/reports/page.tsx`.
  - SDK/Client: `xlsx` package from `package.json`.
  - Auth: page relies on existing app session/API auth; no external service auth.

## Data Storage

**Databases:**
- SQLite / libSQL via Prisma.
  - Connection: `DATABASE_URL` in `prisma.config.ts` and `src/lib/prisma.ts`.
  - Client: `PrismaClient` from `@prisma/client` with `PrismaLibSql` adapter in `src/lib/prisma.ts`.
  - Schema: `prisma/schema.prisma` with `User`, `Meal`, `DailyMenu`, `DailyMenuMeal`, `Registration`, and `Holiday` models.
  - Migrations: `prisma/migrations/20260512091056_init/migration.sql` and `prisma/migrations/20260512091648_add_fk_indexes/migration.sql`.

**File Storage:**
- Local filesystem only for development SQLite fallback `file:./prisma/dev.db` in `src/lib/prisma.ts`.
- No object storage integration detected.

**Caching:**
- In-memory login rate-limit store using `Map<string, IPState>` in `src/lib/rateLimiter.ts`.
- No Redis/Memcached/external cache detected.

## Authentication & Identity

**Auth Provider:**
- Custom username/password auth.
  - Implementation: `app/api/auth/login/route.ts` looks up users via Prisma, verifies password with `bcryptjs`, signs JWT with `jose`, and sets HTTP-only `token` cookie.
  - Token helpers: `src/lib/auth.ts` provides `hashPassword`, `verifyPassword`, `signToken`, and `verifyToken`.
  - Middleware: `src/lib/authMiddleware.ts` provides `withAuth` and `withAdmin` wrappers for API route handlers.
  - Secret: `JWT_SECRET` env var required by `src/lib/auth.ts`.
  - Cookie: `token` cookie set with `httpOnly`, `sameSite: lax`, `maxAge` 7 days, and conditional `secure` flag in `app/api/auth/login/route.ts`.

**Authorization:**
- Role-based checks use `role` claim in JWT and `withAdmin` in `src/lib/authMiddleware.ts`.
- Admin-only endpoints include `app/api/admin/reports/route.ts`, `app/api/admin/stats/route.ts`, `app/api/users/route.ts`, and mutation routes under `app/api/meals`, `app/api/holidays`, and `app/api/daily-menus`.

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, Datadog, New Relic, OpenTelemetry, or similar dependency in `package.json`.

**Logs:**
- Ad hoc/no centralized logging detected in searched source files.
- API error responses generally return JSON via `NextResponse.json` in route handlers and controllers; no structured logger dependency in `package.json`.

## CI/CD & Deployment

**Hosting:**
- Not detected. No deployment platform config found in root config scan; app is a standard Next.js project using `npm run build` and `npm start` from `package.json`.

**CI Pipeline:**
- None detected. No `.github/workflows/*` files found.

## Environment Configuration

**Required env vars:**
- `JWT_SECRET` - required by `src/lib/auth.ts`; missing value throws at import time.
- `DATABASE_URL` - used by `prisma.config.ts`; runtime in `src/lib/prisma.ts` falls back to `file:./prisma/dev.db` when absent.

**Optional/test env vars:**
- `NODE_ENV` - controls production cookie security in `app/api/auth/login/route.ts` and Prisma global singleton behavior in `src/lib/prisma.ts`.
- `RATE_LIMIT_BYPASS` - passed to Playwright dev server in `playwright.config.ts`; no runtime source usage detected in searched files.

**Secrets location:**
- `.env` file present at project root - contains environment configuration; contents not read.
- No checked-in secret manager integration detected.

## Webhooks & Callbacks

**Incoming:**
- None detected for third-party webhooks.
- Internal REST-style API endpoints exist under `app/api/` for auth, users, meals, daily menus, holidays, registrations, admin stats, and reports.

**Outgoing:**
- None detected. No outbound service SDK or external webhook client found in `src/**/*.ts` / `app/**/*.tsx` integration search.

---

*Integration audit: 2026-05-16*
