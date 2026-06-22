# Hydration Investigation — 2026-06-21

## Environment
- Dev: Next.js 16.2.6 + Turbopack + React 19.2.4
- Prod: (same versions, different bundler)

## Production build test
- Build result: PARTIAL — `next build` **compiled successfully** in 13.2s, but **TypeScript check failed** on a pre-existing error in `app/admin/departments/page.tsx` (Department type mismatch: `string | undefined` vs `string | null`). This is **unrelated** to hydration. Build artifacts (`.next/server`, `.next/static`) were produced and `next start` could boot from them.
- Server started: **YES** (HTTP 200 on `/login`)
- SSR with cookie on `/book` and `/my-history`:
  - `<aside>` markers: **0**
  - `nav-link` markers: **0**
  - `/dashboard` link: **0**
  - Vietnamese sidebar text (`Vai trò`, `Đặt lịch`, `Lịch sử`, `Nguyễn`): **0**
  - Only `/book`/`/my-history` and the literal string `BaoCom` (mobile header title) appear.
  - Sidebar **absent** in production SSR HTML.

## Conclusion
**Root cause: `app/(employee)/layout.tsx` (and `app/admin/layout.tsx`) are `"use client"` components** that gate the entire `EmployeeSidebar` / `AdminSidebar` on a client-only `useEffect` that calls `authApi.me()`. On the server pass, `loading` is `true`, so the sidebar JSX is never emitted into the HTML stream. After client hydration, the effect runs, `setUser` populates state, and the sidebar appears — but the server-rendered HTML and the first post-hydration render diverge (no `<aside>` vs. an `<aside>`), which is a classic SSR-mismatch / hydration failure.

**Why production does NOT fix it:** Turbopack-vs-webpack is irrelevant here. The layout component is a client component in both modes and depends on async `useEffect` to learn who the user is, so the server has no way to render the sidebar at all. Confirmed by inspecting the source:

```tsx
// app/(employee)/layout.tsx (line 46)
{!loading && user && (
  <EmployeeSidebar username={user.username} fullName={user.fullName} />
)}
```

The fix is to make the layout a **Server Component** that reads the cookie via `next/headers`, calls `verifyToken` + `prisma` on the server, and renders the sidebar on the first paint. Mobile-only interactivity (drawer toggle) is moved into a small `ClientSidebarWrapper`. See Tasks 2 & 3 for the refactor.
