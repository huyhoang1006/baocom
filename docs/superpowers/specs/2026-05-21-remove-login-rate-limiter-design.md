# Spec: Remove Login Rate Limiter

**Date:** 2026-05-21
**Topic:** Remove login rate limiting (lockout feature)

## Summary

Xóa bỏ hoàn toàn tính năng khóa IP (rate limit lockout) khi đăng nhập thất bại nhiều lần. Tính năng này gây khó khăn khi test và không cần thiết cho hệ thống nội bộ nhỏ (< 50 nhân viên).

## Root Cause

Hệ thống hiện tại khóa IP sau 5 lần đăng nhập thất bại trong 15 phút. Điều này gây vấn đề:
- Developer bị khóa khi test nhiều lần
- Không cần thiết cho môi trường nội bộ với < 50 nhân viên
- Không có threat model rõ ràng cho việc brute-force attack trong mạng nội bộ

## Scope

### Files to DELETE
1. `src/lib/rateLimiter.ts` - Class `InMemoryRateLimiter` và singleton `loginRateLimiter`
2. `tests/lib/rateLimiter.test.ts` - Unit tests cho rate limiter

### Files to MODIFY
3. `app/api/auth/login/route.ts` - Remove all rate limiter imports and calls
4. `BUSINESS_RULES.md` - Remove `LOGIN_RATE_LIMIT_WINDOW` and `LOGIN_RATE_LIMIT_MAX` constants
5. `CLAUDE.md` - Remove "login rate limiter singleton" from global state description

## Changes Detail

### 1. Delete `src/lib/rateLimiter.ts`

### 2. Delete `tests/lib/rateLimiter.test.ts`

### 3. Modify `app/api/auth/login/route.ts`

**Before:**
```typescript
import { loginRateLimiter } from '@/lib/rateLimiter'
// ...
const bypassRateLimit = process.env.RATE_LIMIT_BYPASS === 'true'
let ip: string | undefined

if (!bypassRateLimit) {
  ip = loginRateLimiter.getClientIP(request as unknown as NextRequest)
  const limitCheck = loginRateLimiter.checkLimit(ip)
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Please try again after 15 minutes.', retryAfter: limitCheck.retryAfter },
      { status: 429 }
    )
  }
}

const { username, password } = await request.json()
// ...
if (!isValid) {
  if (!bypassRateLimit) loginRateLimiter.recordFailedAttempt(ip!)
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
// ...
if (!user || !user.isActive) {
  if (!bypassRateLimit) loginRateLimiter.recordFailedAttempt(ip!)
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
// ...
if (!bypassRateLimit) loginRateLimiter.recordSuccess(ip!)
```

**After:**
```typescript
// Remove all rate limiter logic
const { username, password } = await request.json()
```

Also remove `RATE_LIMIT_BYPASS` handling since rate limiter is gone.

### 4. Modify `BUSINESS_RULES.md`

Remove these constants:
- `LOGIN_RATE_LIMIT_WINDOW` (15 minutes)
- `LOGIN_RATE_LIMIT_MAX` (5 attempts)

### 5. Modify `CLAUDE.md`

**Before (line ~313):**
> **Global state:** Shared Prisma singleton in `src/lib/prisma.ts`; login rate limiter singleton imported by `app/api/auth/login/route.ts` from `src/lib/rateLimiter.ts`.

**After:**
> **Global state:** Shared Prisma singleton in `src/lib/prisma.ts`.

## Test Plan

1. Verify `/api/auth/login` still works with valid credentials
2. Verify `/api/auth/login` returns 401 with invalid credentials (no lockout)
3. Run `npm test` - confirm rate limiter tests are removed
4. Run `npm run lint` - confirm no import errors

## Non-Breaking

- Không ảnh hưởng đến chức năng đăng nhập cơ bản
- Không ảnh hưởng đến các API khác
- Không ảnh hưởng đến JWT authentication