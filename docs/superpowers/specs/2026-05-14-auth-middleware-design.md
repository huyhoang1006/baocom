# Authentication & Authorization Middleware Specification

**Document:** BAOCOM-SPEC-2026-001  
**Version:** 1.0  
**Date:** 2026-05-14  
**Author:** AI Test Engineer

---

## 1. Mục tiêu

Triển khai Next.js Middleware để bảo vệ routes và API endpoints, đảm bảo:

- User đã đăng nhập mới được truy cập protected routes
- Phân quyền chính xác theo role (employee vs admin)
- Không có hiện tượng flash trang khi redirect
- Employee không thể truy cập admin routes
- Admin không nên truy cập employee routes (nên về dashboard của mình)

---

## 2. Kiến trúc hiện tại

### 2.1 Auth Flow (Không có middleware)

```
Request → Render Page → Client Check Auth → 401 → Redirect
              ↓
         FLASH! (trang hiển thị trước khi redirect)
```

### 2.2 Auth Flow (Có middleware)

```
Request → Middleware Check → Redirect/Allow → Response
              ↓
         Không FLASH (chặn ngay từ đầu)
```

---

## 3. Role Definitions

| Role | Allowed Routes | Allowed APIs |
|------|---------------|-------------|
| `employee` | `/dashboard`, `/book`, `/my-history` | `/api/daily-menus`, `/api/registrations` |
| `admin` | `/admin/dashboard`, `/admin/employees`, `/admin/reports` | `/api/admin/*`, `/api/daily-menus`, `/api/registrations` |
| (none) | `/login`, `/` | `POST /api/auth/login`, `POST /api/auth/logout` |

---

## 4. Middleware Specification

### 4.1 File Location

```
middleware.ts  (root of project, alongside package.json)
```

### 4.2 Protected Routes

```typescript
const PROTECTED_EMPLOYEE_ROUTES = ['/dashboard', '/book', '/my-history']
const PROTECTED_ADMIN_ROUTES = ['/admin/dashboard', '/admin/employees', '/admin/reports']
const PUBLIC_ROUTES = ['/', '/login', '/api/auth/login', '/api/auth/logout']
```

### 4.3 Logic Flow

```
1. Get token from cookie
2. If no token and route is protected → redirect /login
3. If token invalid/expired → redirect /login
4. Decode token to get role
5. If accessing admin route and role != 'admin' → redirect /dashboard
6. If accessing employee route and role == 'admin' → redirect /admin/dashboard
7. If accessing employee route and role == 'employee' → allow
8. If accessing admin route and role == 'admin' → allow
9. If public route → allow
```

### 4.4 Token Structure

JWT payload chứa:
```json
{
  "userId": "uuid",
  "role": "employee" | "admin",
  "exp": timestamp
}
```

### 4.5 Redirect Rules

| Route Pattern | User Role | Action |
|--------------|----------|--------|
| `PROTECTED_*` | No token | Redirect to `/login` |
| `/admin/*` | `employee` | Show 403 Forbidden page |
| `/dashboard`, `/book`, `/my-history` | `admin` | Show 403 Forbidden page |
| Any protected route | Invalid token | Redirect to `/login` |

### 4.6 403 Forbidden Page

When user accesses route without proper role:
- Create custom 403 page with BaoCom design
- Display message: "Bạn không có quyền truy cập trang này"
- Show "Quay về trang chủ" button (redirects to appropriate dashboard based on role)
- Maintain consistent design with rest of app

```typescript
// In middleware - instead of redirect, show 403
if (path.startsWith('/admin') && role !== 'admin') {
  return NextResponse.rewrite(new URL('/403', request.url))
}
if (isEmployeeRoute(path) && role === 'admin') {
  return NextResponse.rewrite(new URL('/403', request.url))
}
```

---

## 5. Edge Cases

### 5.1 Logout Flow
- User logout → Cookie bị xóa
- Middleware check next request → No token → Redirect /login
- User KHÔNG thấy protected page flash

### 5.2 Token Expiration
- JWT hết hạn sau 7 ngày
- Middleware decode thất bại → Redirect /login

### 5.3 Role Mismatch After Login
- User đổi role trong DB (admin disable user)
- Next request → Token hết hạn hoặc invalid → Redirect /login

### 5.4 API Routes
- API routes `/api/*` vẫn được bảo vệ bởi `withAuth` và `withAdmin` wrappers
- Middleware không redirect API routes, chỉ redirect pages

---

## 6. Implementation Details

### 6.1 Dependencies
- Sử dụng `jwt` từ `jsonwebtoken` (đã có trong project)
- Sử dụng `next/server` cho `NextRequest`, `NextResponse`

### 6.2 Files to Modify/Create
1. **CREATE:** `middleware.ts` (root)
2. **CREATE:** `app/403.tsx` (custom 403 page with "Quay về trang chủ" button)
3. **NO CHANGE:** `src/lib/auth.ts` (verifyToken đã có)
4. **NO CHANGE:** API routes (withAuth/withAdmin wrappers đã có)

### 6.3 Middleware Code Structure

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const path = request.nextUrl.pathname

  // Public routes - allow
  if (isPublicRoute(path)) {
    return NextResponse.next()
  }

  // No token - redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Invalid token - redirect to login
  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { role } = payload

  // Admin route accessed by non-admin
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Employee route accessed by admin
  if (isEmployeeRoute(path) && role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## 7. Security Considerations

- Token stored in httpOnly cookie (already implemented)
- Middleware runs on edge, cannot be bypassed by client
- Role check happens server-side, not client-side
- Invalid tokens are rejected immediately

---

## 8. Testing Scenarios

| Test | Setup | Action | Expected |
|------|-------|--------|----------|
| T1 | Not logged in | Visit /dashboard | Redirect /login |
| T2 | Employee logged in | Visit /dashboard | Show dashboard |
| T3 | Employee logged in | Visit /admin/dashboard | Redirect /dashboard |
| T4 | Admin logged in | Visit /admin/dashboard | Show admin dashboard |
| T5 | Admin logged in | Visit /dashboard | Redirect /admin/dashboard |
| T6 | Employee logged in | Call GET /api/admin/employees | 403 Forbidden |
| T7 | After logout | Visit /dashboard | Redirect /login (no flash) |

---

## 9. Acceptance Criteria

- [ ] Middleware created at root level
- [ ] Unauthenticated users redirected to /login when accessing protected routes
- [ ] Employees accessing /admin/* routes see 403 page
- [ ] Admins accessing employee routes see 403 page
- [ ] Custom 403 page with "Quay về trang chủ" button works
- [ ] No page flash on logout + accessing protected route
- [ ] All existing API auth wrappers still work
- [ ] Login/Logout flows unaffected

---

## 10. Related Files

- `src/lib/auth.ts` - verifyToken function
- `src/lib/authMiddleware.ts` - withAuth/withAdmin wrappers (for API routes)
- `app/(auth)/login/page.tsx` - Login page
- `app/components/sidebar/EmployeeSidebar.tsx` - Logout button
- `app/components/sidebar/AdminSidebar.tsx` - Logout button

---

**End of Specification**