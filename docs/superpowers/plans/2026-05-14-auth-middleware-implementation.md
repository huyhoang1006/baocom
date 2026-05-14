# Auth Middleware Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Next.js middleware to protect routes with proper role-based authorization (employee vs admin), showing 403 page for unauthorized access.

**Architecture:** Middleware intercepts all requests before rendering. It reads JWT token from cookie, verifies it, checks role against requested route pattern, then either allows, redirects to /login (if unauthenticated), or rewrites to 403 page (if unauthorized).

**Tech Stack:** Next.js 14 App Router, Middleware (Edge Runtime), JWT (jsonwebtoken), TypeScript

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `middleware.ts` | Create | Auth check + role routing logic |
| `app/403.tsx` | Create | Custom 403 forbidden page |
| `src/lib/auth.ts` | Read | Uses `verifyToken()` function |
| `app/(auth)/login/page.tsx` | Read | Verify auth flow |

---

## Task 1: Create Custom 403 Page

**Files:**
- Create: `app/403.tsx`

- [ ] **Step 1: Create 403 page with BaoCom design**

```tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ForbiddenPage() {
  const router = useRouter()
  const [role, setRole] = useState<"employee" | "admin" | null>(null)

  useEffect(() => {
    // Try to determine role from current URL path
    const path = window.location.pathname
    if (path.startsWith("/admin")) {
      setRole("employee")
    } else {
      setRole("admin")
    }
  }, [])

  const handleGoHome = () => {
    if (role === "admin") {
      router.push("/admin/dashboard")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-dvh bg-canvas flex items-center justify-center px-6">
      <div className="w-full max-w-[400px] text-center">
        <div className="w-20 h-20 rounded-full bg-error-bg flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
            block
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-ink mb-2">403</h1>
        <p className="text-lg text-ink-muted-80 mb-6">Bạn không có quyền truy cập trang này</p>
        <button
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all press-effect"
        >
          <span className="material-symbols-outlined">home</span>
          Quay về trang chủ
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify file exists**

Run: `ls app/403.tsx`
Expected: `app/403.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/403.tsx
git commit -m "feat: add custom 403 forbidden page with role-based redirect button

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Create Auth Middleware

**Files:**
- Create: `middleware.ts` (root, alongside package.json)

- [ ] **Step 1: Verify auth.ts location for import**

Run: `ls src/lib/auth.ts`
Expected: `src/lib/auth.ts`

- [ ] **Step 2: Read verifyToken function signature**

```typescript
// From src/lib/auth.ts
export function verifyToken(token: string): { userId: string; role: string } | null
```

- [ ] **Step 3: Create middleware.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Protected routes that require employee role
const EMPLOYEE_ROUTES = ['/dashboard', '/book', '/my-history']

// Protected routes that require admin role
const ADMIN_ROUTES = ['/admin/dashboard', '/admin/employees', '/admin/reports']

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login']

// Check if route is public
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith('/api/'))
}

// Check if route requires employee role
function isEmployeeRoute(path: string): boolean {
  return EMPLOYEE_ROUTES.some(route => path === route)
}

// Check if route requires admin role
function isAdminRoute(path: string): boolean {
  return ADMIN_ROUTES.some(route => path.startsWith('/admin/'))
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Allow public routes and API routes
  if (isPublicRoute(path)) {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get('token')?.value

  // No token - redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify token
  const payload = verifyToken(token)

  // Invalid or expired token - redirect to login
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    // Clear invalid cookie
    response.cookies.delete('token')
    return response
  }

  const { role } = payload

  // Admin route accessed by non-admin (employee or invalid role)
  if (isAdminRoute(path) && role !== 'admin') {
    return NextResponse.rewrite(new URL('/403', request.url))
  }

  // Employee route accessed by admin
  if (isEmployeeRoute(path) && role === 'admin') {
    return NextResponse.rewrite(new URL('/403', request.url))
  }

  // Role matches route requirement - allow
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

- [ ] **Step 4: Verify middleware file location**

Run: `ls middleware.ts`
Expected: `middleware.ts`

- [ ] **Step 5: Test middleware compilation**

Run: `npm run build 2>&1 | head -30`
Expected: No errors about middleware

- [ ] **Step 6: Commit**

```bash
git add middleware.ts
git commit -m "feat: add auth middleware with role-based route protection

- Check JWT token from cookie on all protected routes
- Redirect unauthenticated users to /login
- Show 403 page for unauthorized role access
- Employee routes: /dashboard, /book, /my-history
- Admin routes: /admin/*

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Integration Testing

**Files:**
- None (manual testing)

- [ ] **Step 1: Test unauthenticated access to /dashboard**

Run: Clear all cookies → Visit `http://localhost:3000/dashboard`
Expected: Redirect to `/login`

- [ ] **Step 2: Test employee login + access /dashboard**

Run: Login as `nguyenvana/employee123` → Visit `/dashboard`
Expected: Dashboard page loads (no flash)

- [ ] **Step 3: Test employee trying to access /admin/dashboard**

Run: Login as `nguyenvana/employee123` → Visit `/admin/dashboard`
Expected: 403 page displays

- [ ] **Step 4: Test admin login + access /admin/dashboard**

Run: Login as `admin/admin123` → Visit `/admin/dashboard`
Expected: Admin dashboard loads

- [ ] **Step 5: Test admin trying to access /dashboard**

Run: Login as `admin/admin123` → Visit `/dashboard`
Expected: 403 page displays

- [ ] **Step 6: Test logout flow**

Run: Login → Click logout → Try accessing `/dashboard`
Expected: Redirect to `/login` immediately (no flash)

---

## Task 4: Push to Remote

- [ ] **Step 1: Pull and push**

```bash
git pull --rebase
git push
git status
```
Expected: `up to date with origin/main`

---

## Acceptance Criteria Checklist

- [ ] Custom 403 page created with "Quay về trang chủ" button
- [ ] Middleware created at project root
- [ ] Unauthenticated users redirected to /login
- [ ] Employees accessing /admin/* see 403 page
- [ ] Admins accessing employee routes see 403 page
- [ ] No page flash on logout + protected route access
- [ ] Login/Logout flows work correctly
- [ ] All changes committed and pushed

---

## Notes

- API routes (`/api/*`) are NOT handled by middleware - they use `withAuth` and `withAdmin` wrappers in route handlers
- Middleware runs on Edge Runtime, uses `verifyToken` from `src/lib/auth.ts`
- 403 page uses client-side routing to determine correct home page based on role