# BUG-010: Holiday endpoint không public như E2E_TEST_SPEC mong đợi

**Severity**: Low
**Category**: API Contract, Documentation
**Module**: api
**Test case ID**: HOL-07, API-15
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open

## URL / Endpoint
- API: `GET http://127.0.0.1:3000/api/holidays`

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
1. Không login
2. `curl http://127.0.0.1:3000/api/holidays`

## Expected Behavior
- Theo `E2E_TEST_SPEC.md` và mục đích UI (employee cần biết ngày lễ để hiển thị trên dashboard), endpoint này có thể được expect là public read-only.

## Actual Behavior
- HTTP 401 Unauthorized
- Holiday endpoint yêu cầu auth.

## Evidence
```
=== Holiday endpoint GET as anonymous ===
{"error":"Unauthorized"}
  HTTP 401
```

## Impact
- Nếu frontend cần fetch holidays để hiển thị employee dashboard, phải dùng token.
- Không phải bug nặng nhưng tạo friction.

## Suggested Fix
Nếu design intent là cho employee đọc holidays:
- Cho phép GET public (hoặc GET with any auth)
- Giữ POST/PATCH/DELETE admin-only

## File reference
- `app/api/holidays/route.ts` (GET handler — cần verify auth wrapper)