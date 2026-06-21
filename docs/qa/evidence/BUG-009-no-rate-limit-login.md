# BUG-009: Không có rate limiting trên login endpoint

**Severity**: Medium
**Category**: Security
**Module**: auth
**Test case ID**: BOOK-16, AUTH-12, SEC-13
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open

## URL / Endpoint
- API: `POST http://127.0.0.1:3000/api/auth/login`

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
1. Gọi 20 lần liên tiếp login sai password
2. Quan sát status codes

## Expected Behavior
- Sau N lần fail (thường 5-10), endpoint trả 429 Too Many Requests
- Có thể kèm `Retry-After` header

## Actual Behavior
- 20/20 request đều trả 401
- Không có rate limit
- Attacker có thể brute-force password

## Evidence
```
=== Rate limit test ===
  Codes: 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401
```

## Root Cause
- Source code KHÔNG có rate-limit middleware (verified bằng grep).
- `RATE_LIMIT_BYPASS=true` env flag tồn tại nhưng không có implementation thực sự.

## Impact
- Brute-force password attack không bị giới hạn.
- Có thể kết hợp với timing attack để crack nhanh hơn (mỗi attempt chỉ mất ~10ms).

## Suggested Fix
Thêm rate-limit middleware cho `/api/auth/login` (và các endpoint public khác).

Option A: Dùng Next.js middleware:
```typescript
// middleware.ts
const loginAttempts = new Map<string, number[]>()
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/auth/login') {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const attempts = (loginAttempts.get(ip) || []).filter(t => now - t < 60_000)
    attempts.push(now)
    loginAttempts.set(ip, attempts)
    if (attempts.length > 5) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }
}
```

Option B: Dùng Redis-backed rate limiter (production-grade).

## File reference
- (chưa có rate-limit code trong repo)
- Có thể thêm vào `app/api/auth/login/route.ts` hoặc `middleware.ts`