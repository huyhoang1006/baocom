# BUG-008: Thiếu HTTP security headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)

**Severity**: Medium
**Category**: Security
**Module**: global
**Test case ID**: SEC-17
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open

## URL / Endpoint
- Page: `http://127.0.0.1:3000/login` (và mọi page khác)

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
1. Gọi `curl -I http://127.0.0.1:3000/login`
2. Kiểm tra response headers

## Expected Behavior
Có các headers:
- `X-Content-Type-Options: nosniff` (chống MIME sniffing)
- `X-Frame-Options: DENY` hoặc `SAMEORIGIN` (chống clickjacking)
- `Strict-Transport-Security: max-age=...` (chỉ HTTPS, prod)
- `Content-Security-Policy: default-src 'self'...` (chống XSS)
- `Referrer-Policy: strict-origin-when-cross-origin`

## Actual Behavior
- Chỉ có `X-Powered-By: Next.js` (làm lộ tech stack)
- Không có security header nào

## Evidence
```
=== Headers check (login page) ===
X-Powered-By: Next.js
```

## Impact
- Clickjacking: có thể iframe app và trick user.
- XSS: không có CSP để giới hạn script sources.
- MIME sniffing: có thể upload file nhưng bị interpret sai type.
- Tech stack leak: attacker biết dùng Next.js → tìm exploits tương ứng.

## Suggested Fix
Thêm vào `next.config.ts`:
```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      // CSP cần test kỹ — có thể break Next.js inline scripts
      { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' data: https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'" },
      // Tắt X-Powered-By
      { key: 'X-Powered-By', value: '' }
    ]
  }]
}
```

## File reference
- `next.config.ts`