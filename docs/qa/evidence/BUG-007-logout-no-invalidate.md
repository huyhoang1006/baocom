# BUG-007: Logout không invalidate JWT token (vẫn dùng được sau khi logout)

**Severity**: High
**Category**: Security
**Module**: auth
**Test case ID**: AUTH-08, AUTH-18
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open

## URL / Endpoint
- API: `POST http://127.0.0.1:3000/api/auth/logout`

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- User role: admin
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
1. Login admin (lưu cookie token)
2. Verify token hoạt động: `GET /api/auth/me` → 200 OK
3. POST `/api/auth/logout` → 200 OK
4. **Dùng lại token cũ** (cookie đã expire nhưng JWT vẫn còn trong browser nếu attacker sniff)
5. Verify: `GET /api/auth/me` với token cũ → **vẫn 200 OK**

## Expected Behavior
- Sau logout, token phải bị invalidate ngay.
- Có thể bằng cách:
  - Bump `tokenVersion` của user trong DB khi logout
  - Hoặc duy trì blacklist (Redis)
- Trong `withAuth` đã có check `tokenVersion !== payload.tokenVersion` → chỉ cần bump.

## Actual Behavior
- HTTP 200 với token cũ sau logout
- Token vẫn hợp lệ cho đến khi hết 7-day expiry
- Attacker đánh cắp cookie có thể dùng tiếp sau khi user logout

## Evidence
```
=== SEC-18: Logout invalidates token ===
  Token len=205
  Verify BEFORE logout:
{"user":{"id":"cmph425dn00004ov65epfsqhk","username":"admin","name":"Administrator","role":"admin"}}
  POST logout:
{"success":true}
    HTTP 200
  Re-use old token AFTER logout:
{"user":{"id":"cmph425dn00004ov65epfsqhk","username":"admin","name":"Administrator","role":"admin"}}
    HTTP 200
```

## Impact
- High: User logout không bảo vệ khỏi session hijacking.
- Nếu máy tính bị compromise, attacker có cookie có thể bypass logout.
- Vi phạm kỳ vọng security: user tin rằng logout = terminate session.

## Suggested Fix
Trong `app/api/auth/logout/route.ts`, bump `tokenVersion`:
```typescript
export const POST = withAuth(async (req, userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } }
  })
  // ... clear cookie
})
```

Vì `withAuth` đã check `tokenVersion`, việc bump sẽ tự động invalidate token.

## File reference
- `app/api/auth/logout/route.ts` (cần check)
- `src/lib/auth.ts` (verifyToken)
- `src/lib/authMiddleware.ts:21-27` (tokenVersion check đã có)