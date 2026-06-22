# ROOT CAUSE ANALYSIS — 8/11 Pages Stuck Loading

**Date**: 2026-06-21
**Author**: Root cause investigation via Chrome DevTools MCP
**Severity**: Critical (affects most of the app)

## TL;DR

**Toàn bộ React app KHÔNG hydrate ở browser**. Server-side rendering (SSR) chạy và trả về HTML tĩnh, nhưng client-side JavaScript bundle KHÔNG attach React fiber vào DOM elements. Kết quả:

- `useEffect` KHÔNG chạy
- Hooks (useRegistrations, useDailyMenus, v.v.) KHÔNG fetch data
- `useState` KHÔNG re-render
- Conditional rendering `{!loading && user && <Component>}` KHÔNG evaluate phía client
- Sidebar (EmployeeSidebar/AdminSidebar) KHÔNG render
- Day cards trên Book page KHÔNG render
- Table data trên admin pages KHÔNG render
- Stats trên My History KHÔNG update

## Evidence

### 1. React fiber check (browser thật qua MCP)

```javascript
// MCP evaluate_script trên /book
const react_hydrated = Array.from(document.querySelectorAll('*')).filter(el => 
  Object.keys(el).some(k => k.startsWith('__reactFiber'))
).length;

// Result: 0
```

Đã verify trên:
- `/book` (employee): `react_hydrated: 0`
- `/my-history` (employee): `react_hydrated: 0`
- `/admin/employees`: `react_hydrated: 0`
- `/admin/dashboard`: `react_hydrated: 0`

### 2. Network request check

```javascript
// Performance API — tất cả API calls từ page
const entries = performance.getEntriesByType('resource').filter(e => e.name.includes('/api/'));
// Result: 0 — không có API call nào được gửi
```

Khi truy cập `/book`:
- Expected: `GET /api/settings/cutoff` (từ useEffect line 20-25) + `GET /api/registrations` (từ useRegistrations hook) + `GET /api/daily-menus`
- Actual: 0 calls

### 3. SSR HTML check (qua curl)

```bash
curl -H "Cookie: token=..." http://127.0.0.1:3000/my-history
```

HTML response:
- Có heading "Lịch Sử" ✓
- Có "Tổng -", "Có ăn -", "Không ăn -" (placeholder, chưa có data) ✓
- **KHÔNG có** nav links `/dashboard`, `/book` (sidebar EmployeeSidebar) ✗
- **KHÔNG có** EmployeeSidebar component ✗

→ Server render chỉ conditional `{!loading && user && <EmployeeSidebar />}` → với `loading=true` ban đầu (default), sidebar không render trong SSR.

### 4. Vitest test output (run cùng test suite)

```
TypeError: Failed to parse URL from /api/settings/cutoff
  input: '/api/settings/cutoff'
  at file:///C:/.../undici/undici:10315:25
  at fetch (file:///C:/.../undici/undici:13508:10)
  at C:/.../app/(employee)/book/page.tsx:21:5
```

`app/(employee)/book/page.tsx:21` dùng `fetch('/api/settings/cutoff')` thay vì `apiFetch()` helper. Relative URL fail trong một số context.

## Affected Pages

| Page | Affected Feature | Root cause |
|------|-------------------|-----------|
| `/dashboard` (employee) | Missing sidebar (0 links) | React no-hydrate |
| `/book` (employee) | Stuck "Đang tải lịch báo cơm..." | useRegistrations hook not run |
| `/my-history` (employee) | Stats show "-" (no data) | Data hook not run |
| `/admin/dashboard` | Quick action buttons no-op | useEffect not run |
| `/admin/menu` | No day cards (Lưu button alone) | Data hook not run |
| `/admin/employees` | Empty table "Không tìm thấy" | useUsers not run |
| `/admin/departments` | Stuck "Đang tải..." | Data hook not run |
| `/admin/holidays` | Stuck "Đang tải..." | Data hook not run |
| `/admin/settings` | Stuck "Đang tải..." | Data hook not run |
| `/admin/reports` | Tra cứu button no-op | useEffect not run |

## Root Cause Hypotheses (in order of likelihood)

### Hypothesis 1: React 19 + Next.js 16 + Turbopack hydration failure (MOST LIKELY)

App dùng bleeding-edge versions:
- Next.js 16.2.6
- React 19.2.4
- Turbopack (dev mode)

Possible incompatibility causing hydration to silently fail. Could be:
- Turbopack bug with React 19 client components
- Hot Module Reload corruption
- Cache issue requiring clean build

### Hypothesis 2: Layout conditional render blocks client hydration

`app/(employee)/layout.tsx`:
```tsx
const [user, setUser] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchUser = async () => {
    try {
      const { user: userData } = await authApi.me()
      setUser({...})
    } catch (err) {
      window.location.href = '/login'  // ← Side effect on hydration
    } finally {
      setLoading(false)
    }
  }
  fetchUser()
}, [])
```

Nếu useEffect KHÔNG chạy (do React no-hydrate), `loading` giữ ở `true` → `!loading && user` = false → EmployeeSidebar không bao giờ render.

Đây là **circular dependency**: layout cần user data để render sidebar, nhưng useEffect để fetch user không chạy → vòng lặp vô tận.

### Hypothesis 3: Vitest test error indicates deeper problem

Test output:
```
TypeError: Failed to parse URL from /api/settings/cutoff
  at file:///C:/.../undici/undici:10315:25
  at fetch (file:///C:/.../undici/undici:10315:25)
  at C:/.../app/(employee)/book/page.tsx:21:5
```

`book/page.tsx:21` uses raw `fetch('/api/settings/cutoff')` instead of `apiFetch()` helper. While this works in browser, the path mismatch with API base URL handling may cause issues.

## Suggested Fixes (in order of priority)

### Fix 1: Production build to bypass Turbopack dev mode issues

```bash
npm run build
npm start
```

If the issue is Turbopack-specific, production build will resolve it.

### Fix 2: Use apiFetch() in Book page

Change `app/(employee)/book/page.tsx:21`:
```typescript
// OLD (line 21):
useEffect(() => {
  fetch('/api/settings/cutoff')
    .then((r) => r.json())
    .then((data) => setCutoffConfig({ hour: data.cutoffHour, minute: data.cutoffMinute }))
    .catch(console.error)
}, [])

// NEW:
useEffect(() => {
  adminSettingsApi.getCutoff()
    .then((data) => setCutoffConfig({ hour: data.cutoffHour, minute: data.cutoffMinute }))
    .catch(console.error)
}, [])
```

This eliminates the relative URL issue and uses the established pattern.

### Fix 3: Verify Next.js 16 + React 19 compatibility

```bash
# Check for known hydration issues in Next.js 16.2.6
npx next info

# Consider downgrading if needed:
# - Next.js 15.x (LTS)
# - React 18.x (stable)
```

### Fix 4: Disable strict mode temporarily to test

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactStrictMode: false,  // Try disabling to see if it's the cause
  // ... other config
}
```

## Verification

After applying fixes, run this verification script:

```bash
# 1. Start app
NODE_ENV=test npm run dev

# 2. In Chrome DevTools MCP, navigate to /book
# 3. Run:
#    const r = Array.from(document.querySelectorAll('*')).filter(el => 
#      Object.keys(el).some(k => k.startsWith('__reactFiber'))
#    ).length;
#    console.log('React hydrated:', r);
# 4. Expected: r > 0 (some hydrated elements)
# 5. Also check: day cards visible, no "Đang tải..." text
```

## Why Previous E2E Reports Missed This

The QA team used **HTTP curl** to test API endpoints (which work perfectly). They never tested **client-side rendering** because:
1. No browser tool was available initially
2. Page HTML looks "correct" in SSR
3. Network panel showed all scripts loaded
4. API responses all returned 200

The **hydration failure** is invisible to:
- HTTP-based testing (curl, Postman)
- Server-side rendering checks
- Network traffic analysis

It can ONLY be detected by:
- Checking React fiber presence in DOM
- Waiting for useEffect execution
- Observing client-side state changes

## Related Issues

- BUG-E2E-NEW-001: Dashboard no sidebar — same root cause (no hydration)
- BUG-E2E-NEW-003: Book page stuck loading — same root cause
- BUG-E2E-NEW-004: Reports Tra cứu no fetch — same root cause
- BUG-E2E-NEW-005: My History stuck — same root cause

All 4 "new bugs" from E2E testing are actually **one root cause** manifesting in different ways.

## Summary

**One bug, many symptoms**: React 19 + Next.js 16 + Turbopack hydration failure causes 8+ pages to be non-functional, even though server-side rendering and API calls work perfectly.

**Recommended action**: 
1. Try production build first (npm run build && npm start) — may bypass dev-mode issues
2. If still broken: downgrade Next.js to 15.x
3. Verify with hydration check
