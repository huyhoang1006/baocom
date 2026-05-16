# Project State — Báo Cơm Trưa Công Ty v1

**Last updated:** 2026-05-16
**Mode:** mvp

## Project Reference

**Core value:** Giảm thao tác tổng hợp cơm trưa thủ công bằng cách cho admin biết đúng số suất cần đặt mỗi ngày.

**Current focus:** Roadmap created. Ready to plan Phase 1: Business Date & Brownfield Correctness.

**Project mode:** Brownfield v1 on existing Next.js App Router + React + TypeScript + Prisma SQLite/libSQL codebase.

## Current Position

| Field | Value |
|-------|-------|
| Current phase | Phase 1: Business Date & Brownfield Correctness |
| Current plan | None |
| Status | Roadmap ready |
| Progress | 0/8 phases complete |

Progress: [--------] 0%

## Performance Metrics

| Metric | Value |
|--------|-------|
| v1 requirements mapped | 38/38 |
| phases defined | 8 |
| orphaned requirements | 0 |
| duplicate mappings | 0 |
| plans complete | 0 |

## Accumulated Context

### Decisions

- Keep existing stack: Next.js 16, React 19, TypeScript, Prisma, SQLite/libSQL.
- Keep layered pattern: App Router → API route → Controller → Service → Repository → Prisma.
- Use absence-first domain model: active employee + eligible day + no absence means eating.
- Use `Asia/Ho_Chi_Minh` as business timezone for date keys, cutoff, reports, menus, and history.
- Use server-generated CSV for v1 exports.
- Defer kitchen role, payroll, native app, notifications, and meal choice.

### Known Concerns To Carry Forward

- Admin reports date filtering currently passes `startDate` as `userId`.
- Date handling mixes local `Date` with UTC ISO conversion.
- Daily menu by-date API response shape mismatches client type.
- Admin menu save can show success despite partial save failures.
- Large admin/employee pages can regress when business rules change.
- Logout token revocation remains limited by stateless JWT design; v1 scope should avoid overbuilding unless requirements change.

### TODOs

- Plan Phase 1 with focused fixes for date helpers, report date filter bug, menu response contract, and regression tests.
- Preserve v1 scope guardrails during planning and implementation.
- Use project issue tracker (`bd`) for task tracking during implementation sessions.

### Blockers

- None for roadmap. Deployment target and logout revocation policy remain open context, not roadmap blockers.

## Session Continuity

**Next command:** `/gsd:plan-phase 1`

**What happened this session:** Roadmap created from PROJECT.md, REQUIREMENTS.md, research summary, config, architecture notes, and concerns audit. All 38 v1 requirements mapped exactly once across 8 phases.

**Files created/updated:**
- C:/Users/ADMIN/Downloads/temp_v9/baocom/.planning/ROADMAP.md
- C:/Users/ADMIN/Downloads/temp_v9/baocom/.planning/STATE.md
- C:/Users/ADMIN/Downloads/temp_v9/baocom/.planning/REQUIREMENTS.md
