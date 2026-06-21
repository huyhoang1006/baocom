# BUG-004: GET /api/users/nonexistent ban đầu timeout nhưng thực tế trả 404 (intermittent)

**Severity**: Low
**Category**: Console, Performance
**Module**: api
**Test case ID**: API-06
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open

## URL / Endpoint
- API: `GET http://127.0.0.1:3000/api/users/{nonexistent_id}` (admin cookie)

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- User role: admin
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
1. Login admin
2. Gọi nhanh nhiều request: `GET /api/users/nonexistent_id`
3. Quan sát timing

## Expected Behavior
- HTTP 404 ngay lập tức
- Stable timing (~10-50ms)

## Actual Behavior
- Lần đầu timeout (HTTP 000), return từ connection pool.
- Lần sau trả 404 đúng (`{"error":"Not found"}`).
- Có thể do Next.js dev mode slow first compile của route handler.

## Evidence
```
=== GET /api/users/nonexistent (1st) ===
HTTP 000 (timeout)
=== GET /api/users/nonexistent (2nd) ===
{"error":"Not found"}
HTTP 404
```

## Impact
- Có thể ảnh hưởng UX khi admin click vào user đã xóa.
- Không critical vì retry works.

## Suggested Fix
- Optimize cold start của Next.js API routes
- Hoặc: thêm caching/precompile để tránh timeout lần đầu.

## Note
- Bug này có thể là artifact của dev mode. Trong production có thể không xảy ra.