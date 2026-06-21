# BUG-001: GET /api/settings/cutoff không yêu cầu authentication

**Severity**: Medium
**Category**: Security
**Module**: api
**Test case ID**: SEC-13, API-16
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open

## URL / Endpoint
- API: `GET http://127.0.0.1:3000/api/settings/cutoff`

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- User role: anonymous
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
1. Không login
2. Gọi `curl http://127.0.0.1:3000/api/settings/cutoff`
3. Quan sát response

## Expected Behavior
- Trả 401 Unauthorized (vì cấu hình cutoff là admin operation)
- Hoặc 200 OK nhưng admin-only endpoint không bao giờ public

## Actual Behavior
- HTTP 200 OK
- Response: `{"cutoffHour":17,"cutoffMinute":10}`
- Bất kỳ ai (anonymous) cũng xem được giờ chốt đăng ký

## Evidence
```
=== GET /api/settings/cutoff (no auth) ===
{"cutoffHour":17,"cutoffMinute":10}
HTTP 200
```

## Impact
- Information disclosure nhẹ: attacker biết được giờ chốt để brute-force timing.
- Vi phạm principle of least privilege.
- Tuy nhiên admin endpoint PUT thì đúng là `/api/admin/settings/cutoff` (đã check, có auth).

## Suggested Fix
Hoặc:
- Thêm auth check vào `app/api/settings/cutoff/route.ts`
- Hoặc xóa endpoint public này (vì frontend dùng `/api/admin/settings/cutoff` rồi)

## File reference
- `app/api/settings/cutoff/route.ts` (no auth wrapper)