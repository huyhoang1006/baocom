# BUG-011: Malformed JSON trong /api/auth/login trả HTTP 500 thay vì 400

**Severity**: Low
**Category**: Functional, Error Handling
**Module**: auth, api
**Test case ID**: AUTH-06, SEC-16
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
1. `curl -X POST -H "Content-Type: application/json" -d 'NOT_JSON' http://127.0.0.1:3000/api/auth/login`

## Expected Behavior
- HTTP 400 Bad Request
- Error: "Invalid JSON body"

## Actual Behavior
- HTTP 500 Internal Server Error
- Error: "Internal server error"

## Evidence
```
=== AUTH-06c: Malformed JSON ===
{"error":"Internal server error"}
HTTP 500
```

## Impact
- Low: Client error bị treat như server error → confusing.
- Monitoring sẽ cảnh báo 500 cho lỗi client → false positives.

## Suggested Fix
Trong `app/api/auth/login/route.ts`, wrap JSON parse:
```typescript
let body
try {
  body = await req.json()
} catch {
  return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
}
```
(Tương tự như đã làm ở `/api/admin/settings/cutoff/route.ts:17-20`).

## File reference
- `app/api/auth/login/route.ts`