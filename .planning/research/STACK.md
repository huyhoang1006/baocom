# Technology Stack Research

**Project:** Báo Cơm Trưa Công Ty
**Dimension:** Stack for finishing v1 brownfield internal lunch reporting app
**Researched:** 2026-05-16
**Overall confidence:** HIGH

## Recommendation

Keep existing stack. Do not re-platform.

Existing Next.js 16 + React 19 + TypeScript + Prisma 7 + SQLite/libSQL stack fits v1 because app is small, internal, under 50 employees, and already has auth, employee UI, admin UI, menu, holidays, registrations, stats, reports, tests, migrations, and controller/service/repository boundaries.

Main v1 work should be correctness, stability, and small dependency cleanup: fix report/date bugs, centralize date keys, add runtime validation at API boundaries, reduce large client pages, improve CSV export path, remove unused JWT library, and harden session behavior enough for internal use.

## Keep / Change Decisions

| Area | Decision | Confidence | Why |
|------|----------|------------|-----|
| Framework | Keep Next.js 16 App Router | HIGH | Current official docs show Route Handlers are current App Router API endpoint pattern. Existing app already follows `app/api/**/route.ts`. Migration risk > benefit. |
| UI | Keep React 19 client components where interactive | HIGH | Official Next docs: default Server Components reduce JS, Client Components for state/event handlers/hooks. Current pages are interactive; reduce client scope over time, not rewrite. |
| Language | Keep TypeScript strict | HIGH | Existing code uses TS strict, DTOs, controllers, repositories. Best guard for brownfield fixes. |
| Backend structure | Keep Route Handler → Controller → Service → Repository → Prisma | HIGH | Existing architecture is coherent. V1 changes need low regression risk. |
| ORM | Keep Prisma 7 | HIGH | Current project already on Prisma 7. Prisma docs support SQLite/libSQL via driver adapters. |
| DB | Keep SQLite/libSQL for v1 | HIGH | Prisma docs describe SQLite as best for development and small apps; app target is under 50 employees. libSQL/Turso remains good deployment option. |
| Auth crypto | Keep `jose`; remove `jsonwebtoken` if unused | HIGH | `jose` supports JWT/JWS, Node, Web runtimes, zero deps. Current implementation uses `jose`; duplicate JWT library adds audit surface. |
| Password hashing | Keep `bcryptjs` for v1 | MEDIUM | Existing code uses it. For small internal app, replacement not worth v1 risk unless security review demands native argon2/bcrypt. |
| Styling | Keep Tailwind CSS 4 | HIGH | Existing styling already built on Tailwind 4. No need for component library migration. |
| Export | Prefer server-generated CSV for v1 reports; avoid more client XLSX | HIGH | CSV satisfies requirement, simpler than XLSX, less bundle/memory pressure. Existing `xlsx` import in client page is dependency risk. |
| Validation | Add Zod 4 for API request/query validation | HIGH | Current controllers manually parse strings and error messages. Zod current version is 4.4.3 and fits typed boundary validation. |
| Date handling | Add no heavyweight date library by default; use centralized date-key helpers | HIGH | Main issue is mixed local Date/UTC ISO conversion. A shared `YYYY-MM-DD` date-key utility fixes v1 with less risk. Consider `date-fns` only if recurrence/calendar logic grows. |
| State/data fetching | Do not add TanStack Query/SWR for v1 | MEDIUM | Current API facade/hooks adequate. Adding cache layer can hide stale admin data bugs and adds migration work. |
| Forms | Do not add React Hook Form unless forms grow | MEDIUM | Current forms are simple admin CRUD. Zod at API boundary gives most needed safety. |
| UI library | Do not add shadcn/Radix/MUI for v1 | HIGH | Existing UI works; component-library adoption would expand scope and regressions. |
| Background jobs | Do not add queue/cron infra for v1 | HIGH | Manual/admin flows and request-time reports sufficient for under 50 employees. |
| Realtime | Do not add WebSockets/SSE | HIGH | Lunch counts do not need realtime; refresh-on-demand enough. |
| Observability | Add minimal structured server logging only if deployment lacks logs | MEDIUM | Small internal app can rely on platform logs; avoid Sentry-style setup unless production errors are hard to diagnose. |

## Current Version Baseline

Observed/current package versions from workspace and npm registry on 2026-05-16:

| Package | Existing / Current | Recommendation |
|---------|--------------------|----------------|
| `next` | 16.2.6 | Keep 16.2.6 |
| `react` | existing 19.2.4, npm current 19.2.6 | Patch update later only if tests pass; not roadmap blocker |
| `react-dom` | existing 19.2.4 | Patch with React together |
| `typescript` | 5.x | Keep strict mode |
| `prisma` | 7.8.0 | Keep 7.8.0 |
| `@prisma/client` | 7.8.0 | Keep 7.8.0 |
| `@prisma/adapter-libsql` | 7.8.0 | Keep if deployed to libSQL/Turso |
| `@libsql/client` | 0.17.3 | Keep if deployed to libSQL/Turso |
| `jose` | 6.2.3 | Keep |
| `zod` | npm current 4.4.3 | Add for validation |
| `papaparse` | npm current 5.5.3 | Optional only if client-side CSV parsing/generation needed; prefer simple server CSV without it |
| `date-fns` | npm current 4.1.0 | Do not add unless date logic expands beyond date-key normalization |
| `xlsx` | 0.18.5 | Avoid growing usage; move behind dynamic import or replace admin export with server CSV |
| `jsonwebtoken` | 9.0.3 | Remove if no references remain |

## Implementation Approach for v1

### 1. Stabilize core bugs before new stack changes

Do first:
- Fix admin report date filtering argument order or add dedicated `findByDateRange(startDate, endDate)`.
- Add regression tests for report date range.
- Fix daily menu API response type mismatch.
- Centralize date conversion in one `src/lib/dateKey.ts` or extend existing `src/lib/registrationWindow.ts` helpers.
- Ban ad-hoc `toISOString().split('T')[0]` in UI date logic.

Reason: roadmap value depends on correct counts and dates. Stack changes do not matter if reports are wrong.

### 2. Add small validation layer, not big framework

Add `zod` and use it at controller boundaries:
- query params: date ranges, selected day, user id
- request bodies: registration status, meal payloads, holiday payloads, user create/update
- shared schema-derived TypeScript types only where useful

Pattern:
- Route handler remains thin.
- Controller parses with Zod.
- Service receives typed, validated input.
- Service throws typed domain errors, not string-matched errors.

Reason: current fragile error mapping and response shape mismatch are boundary problems. Zod fixes these without replacing architecture.

### 3. Keep API routes; avoid Server Actions migration

Do not migrate existing mutations to Server Actions for v1.

Use Route Handlers because:
- Official Next.js 16 docs confirm Route Handlers are App Router custom request handlers and API route equivalent.
- Existing app already has browser API facade and tests around API endpoints.
- Admin/employee screens depend on JSON APIs.
- Roadmap likely needs stable contract tests.

Server Actions may be useful later for isolated forms, but not for v1 stabilization.

### 4. Split large client pages incrementally

Refactor only when touching feature areas:
- `app/admin/reports/page.tsx` → report hook + presentational table + export button.
- `app/admin/menu/page.tsx` → week date helpers + menu grid component + batch save function.
- `app/admin/employees/page.tsx` → form component + employee table component.
- employee pages → shared status/menu cards.

Do not rewrite all pages in one phase.

Reason: large pages are regression risk. Incremental extraction improves testability without changing stack.

### 5. Use server CSV export for v1

Recommended endpoint:
- `GET /api/admin/reports/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=csv`

Implementation:
- Admin-only route handler.
- Service returns report rows.
- Route serializes CSV with proper escaping.
- Response headers: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment`.
- Keep preview JSON limited to current UI needs.

Avoid:
- client-side XLSX generation as default path
- streaming/export infra beyond simple CSV
- pagination for under 50 employees unless needed by UI

Reason: CSV meets business requirement and avoids `xlsx` bundle/memory risk.

### 6. Keep SQLite/libSQL, add indexes only where useful

For v1:
- Keep SQLite/libSQL.
- Add `@@index([date])` on Registration.
- Consider `@@index([date, status])` if report/count queries filter by status.
- Add unique normalized meal key only if batch menu editing creates/updates meals by name.

Do not add Postgres for v1.

Reason: app scale is small; Prisma docs support SQLite for small apps; migration would consume roadmap time without user value.

### 7. Harden auth enough for internal v1

Minimum v1:
- Ensure production auth cookie always uses `secure: process.env.NODE_ENV === 'production'`.
- Keep `httpOnly`, `sameSite`, path, expiry consistent between login/logout.
- Remove hardcoded seed credentials for non-local deploy or require env-provided seed password.
- Check active user on authenticated requests if disabled users must lose access quickly.

Optional if policy requires logout invalidation:
- Add `Session` table with token id/session version.
- Include session id/version in JWT.
- Verify against DB in `withAuth()`.
- Revoke on logout/password reset/user disable.

Do not add OAuth/SSO for v1 unless company requires it.

## Recommended Additions

| Package / Change | Version | Use | Confidence | Notes |
|------------------|---------|-----|------------|-------|
| `zod` | 4.4.3 | Runtime validation for API inputs and query params | HIGH | Small, targeted improvement for fragile boundaries. |
| Prisma indexes | n/a | Report/count query speed and correctness | HIGH | Add through migration, not raw ad-hoc SQL. |
| Server CSV endpoint | n/a | Admin export | HIGH | Prefer native serialization; no dependency required for simple rows. |
| `server-only` import markers | optional | Prevent accidental server code import into client | MEDIUM | Next docs say optional; useful for Prisma/auth modules if lint accepts. |

## Dependencies to Avoid

| Dependency / Tech | Why Not for v1 | Confidence |
|-------------------|----------------|------------|
| Postgres | Re-platform cost, no scale need under 50 users | HIGH |
| Redis | In-memory limiter adequate for one instance; DB-backed sessions can use SQLite if needed | MEDIUM |
| TanStack Query/SWR | Current hooks/API facade enough; cache semantics add complexity | MEDIUM |
| shadcn/ui, MUI, Ant Design | UI migration cost exceeds v1 value | HIGH |
| NextAuth/Auth.js | Existing cookie JWT auth works; migration risky unless SSO needed | MEDIUM |
| Server Actions rewrite | Existing API route architecture and tests should stay stable | HIGH |
| Native mobile app stack | Explicitly out of scope; responsive web enough | HIGH |
| WebSockets/SSE | Counts do not require realtime | HIGH |
| Queue/job worker | No async workload requiring it | HIGH |

## Quality Gates

Run for stack-affecting changes:

```bash
npm run lint
npm test
npm run build
npx prisma validate
npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script
```

For report/date changes, add targeted tests before refactor:
- controller test for `startDate`/`endDate` forwarding
- service/repository test for date range inclusion
- date-key helper tests around timezone boundary cases
- Playwright smoke for admin report preview/export if stable test data exists

## Roadmap Stack Guidance

Recommended phase order:

1. **Correctness foundation**
   - report date bug
   - date-key centralization
   - API response shape fixes
   - regression tests

2. **Validation and domain hardening**
   - add Zod to controllers
   - typed domain errors
   - auth cookie/session hardening decisions

3. **Admin reporting/export v1**
   - daily meal count
   - absent employee list
   - user history
   - server CSV export
   - report query indexes

4. **Menu/default-eating UX polish**
   - employee weekly menu view
   - default-eat / report-absence flow
   - admin deadline config
   - batch menu save if needed

5. **Cleanup and dependency reduction**
   - remove unused `jsonwebtoken`
   - dynamic import or remove client `xlsx`
   - split large pages touched during phases

## Sources

| Source | Confidence | Notes |
|--------|------------|-------|
| Existing project planning and codebase stack docs: `C:/Users/ADMIN/Downloads/temp_v9/baocom/.planning/PROJECT.md`, `codebase/STACK.md`, `codebase/ARCHITECTURE.md`, `codebase/CONCERNS.md` | HIGH | Primary brownfield context. |
| Next.js Route Handlers docs, version 16.2.6, last updated 2026-05-13: https://nextjs.org/docs/app/getting-started/route-handlers | HIGH | Confirms App Router Route Handlers for API endpoints. |
| Next.js Server/Client Components docs, version 16.2.6, last updated 2026-05-13: https://nextjs.org/docs/app/getting-started/server-and-client-components | HIGH | Confirms Server Components default and Client Components for state/hooks/events. |
| Prisma SQLite docs: https://www.prisma.io/docs/orm/overview/databases/sqlite | HIGH | Confirms SQLite provider, small-app fit, adapter notes, limitations. |
| Prisma Turso/libSQL docs: https://www.prisma.io/docs/orm/overview/databases/turso | HIGH | Confirms Prisma libSQL adapter and Turso workflow. |
| jose GitHub README: https://github.com/panva/jose | HIGH | Confirms JWT/JWS support, Node/Web runtime support, zero dependencies. |
| npm registry checks on 2026-05-16 for `next`, `react`, `prisma`, `@prisma/client`, `jose`, `zod`, `papaparse`, `date-fns` | HIGH | Used for current version recommendations. |

## Open Questions

- Deployment target not confirmed: single Node server, Vercel, Docker, Turso, or local LAN server. This affects cookie/proxy config and database URL setup.
- Company security policy not confirmed: logout revocation may be optional for small internal v1 or mandatory if HR data policy requires immediate account disable.
- Export format expectation not confirmed: requirement says CSV, but existing UI uses XLSX. Roadmap should confirm CSV is acceptable before removing XLSX.
