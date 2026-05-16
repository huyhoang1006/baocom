# Technology Stack

**Analysis Date:** 2026-05-16

## Languages

**Primary:**
- TypeScript 5 - Next.js app, API routes, controllers, services, repositories in `app/**/*.tsx`, `app/api/**/route.ts`, and `src/**/*.ts`; strict mode enabled in `tsconfig.json`.
- TSX / React JSX - UI pages and components in `app/(auth)`, `app/(employee)`, `app/admin`, and `app/components`.

**Secondary:**
- JavaScript - Shell/API helper test scripts in `tests/bash/api-auth-tests.js`; npm config files use JS/MJS in `eslint.config.mjs` and `postcss.config.mjs`.
- SQL - Prisma migrations in `prisma/migrations/20260512091056_init/migration.sql` and `prisma/migrations/20260512091648_add_fk_indexes/migration.sql`.

## Runtime

**Environment:**
- Node.js v22.19.0 observed by `node --version` in this workspace.
- npm 11.14.1 observed by `npm --version`.
- Next.js server runtime for app router pages and API routes under `app/`.

**Package Manager:**
- npm 11.14.1.
- Lockfile: present at `package-lock.json`, lockfileVersion 3.

## Frameworks

**Core:**
- Next.js 16.2.6 - app router, server API routes, build/dev/start scripts in `package.json`; config in `next.config.ts`.
- React 19.2.4 and React DOM 19.2.4 - UI components and pages under `app/`.
- Prisma 7.8.0 - ORM/client generation with schema at `prisma/schema.prisma`; config at `prisma.config.ts`.
- Tailwind CSS 4 - styling pipeline via `@tailwindcss/postcss` in `postcss.config.mjs`.

**Testing:**
- Vitest 4.1.6 - unit/component tests; config in `vitest.config.ts`; command `npm test` from `package.json`.
- Testing Library React 16.3.2 and Jest DOM 6.9.1 - component testing dependencies in `package.json`.
- Playwright 1.60.0 - E2E tests under `tests/e2e`; config in `playwright.config.ts`.
- jsdom 29.1.1 - Vitest environment in `vitest.config.ts`.

**Build/Dev:**
- TypeScript compiler 5 - configured in `tsconfig.json` with `strict: true`, `moduleResolution: bundler`, and alias `@/*` to `./src/*`.
- ESLint 9 with `eslint-config-next` 16.2.6 - lint command `eslint` in `package.json`; config in `eslint.config.mjs`.
- tsx 4.21.0 - Prisma seed runner via `package.json` and `prisma.config.ts`.
- ts-node 10.9.2 - dev dependency for TypeScript tooling.

## Key Dependencies

**Critical:**
- `@prisma/client` 7.8.0 - typed database access in `src/lib/prisma.ts` and repositories under `src/repositories/`.
- `@prisma/adapter-libsql` 7.8.0 and `@libsql/client` 0.17.3 - Prisma driver adapter configured in `src/lib/prisma.ts`.
- `better-sqlite3` 12.9.0 - SQLite/local database dependency in `package.json`.
- `jose` 6.2.3 - JWT signing and verification in `src/lib/auth.ts`.
- `bcryptjs` 3.0.3 - password hashing and verification in `src/lib/auth.ts`.
- `xlsx` 0.18.5 - report export UI in `app/admin/reports/page.tsx`.

**Infrastructure:**
- `jsonwebtoken` 9.0.3 - installed dependency, but token implementation uses `jose` in `src/lib/auth.ts`.
- `@types/node` 20, `@types/react` 19, `@types/react-dom` 19 - TypeScript types in `package.json`.
- `@types/bcryptjs` 2.4.6 and `@types/jsonwebtoken` 9.0.10 - type packages in `package.json`.

## Configuration

**Environment:**
- `.env` file present - contains environment configuration; contents not read.
- `DATABASE_URL` used by Prisma config in `prisma.config.ts` and by runtime client in `src/lib/prisma.ts`; runtime fallback is `file:./prisma/dev.db`.
- `JWT_SECRET` required at module load in `src/lib/auth.ts`; missing value throws `JWT_SECRET environment variable is required`.
- `NODE_ENV` controls production cookie security in `app/api/auth/login/route.ts` and Prisma singleton reuse in `src/lib/prisma.ts`.
- `RATE_LIMIT_BYPASS` is supplied by Playwright webServer env in `playwright.config.ts`.

**Build:**
- `package.json` scripts: `dev` -> `next dev`, `build` -> `next build`, `start` -> `next start`, `lint` -> `eslint`, `test` -> `vitest`.
- `tsconfig.json` sets `target: ES2017`, `jsx: react-jsx`, `strict: true`, and `@/*` path alias to `src/*`.
- `next.config.ts` sets `allowedDevOrigins` for `192.168.4.105`, `192.168.4.116`, and `192.168.4.119`.
- `eslint.config.mjs` uses Next core web vitals and TypeScript presets.
- `postcss.config.mjs` loads `@tailwindcss/postcss`.
- `prisma.config.ts` points schema to `prisma/schema.prisma`, migrations to `prisma/migrations`, and seed to `tsx prisma/seed.ts`.

## Platform Requirements

**Development:**
- Use Node.js/npm environment compatible with Next.js 16 and React 19; current workspace uses Node v22.19.0 and npm 11.14.1.
- Run `npm install` from `package-lock.json` before `npm run dev`, `npm run build`, `npm run lint`, or `npm test`.
- Provide `JWT_SECRET` for app/API startup because `src/lib/auth.ts` throws without it.
- Provide `DATABASE_URL` for non-default DB; absent value uses local SQLite file `file:./prisma/dev.db` in `src/lib/prisma.ts`.

**Production:**
- Next.js production server via `npm run build` then `npm start` from `package.json`.
- Database provider is SQLite in `prisma/schema.prisma`; runtime connection uses libSQL adapter in `src/lib/prisma.ts`, so production should provide a valid `DATABASE_URL`.
- HTTPS proxy header `x-forwarded-proto: https` affects secure auth cookie setting in `app/api/auth/login/route.ts`.

---

*Stack analysis: 2026-05-16*
