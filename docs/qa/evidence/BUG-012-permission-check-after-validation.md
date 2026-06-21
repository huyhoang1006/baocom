# BUG-012: PATCH /api/registrations/[id] trả 400 (date error) trước khi check permission (employee)

**Severity**: Low
**Category**: Security, Information Disclosure
**Module**: booking, api
**Test case ID**: SEC-02, SEC-11
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open

## URL / Endpoint
- API: `PATCH http://127.0.0.1:3000/api/registrations/[id]` (employee cookie)

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- User role: employee
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
1. Login employee
2. PATCH một registration (của employee khác hoặc của chính mình) với date invalid
3. Quan sát status code

## Expected Behavior
- HTTP 403 Forbidden (vì employee không được PATCH registrations — admin only)

## Actual Behavior
- HTTP 400 với error: `"Ngay nay khong nam trong lich bao com"`
- Permission check chạy SAU date validation

## Evidence
```
=== PATCH registration by employee — should be 403 ===
{"error":"Ngay nay khong nam trong lich bao com"}
HTTP 400
```

## Impact
- Information disclosure nhỏ: employee biết được registration có/không trong window.
- Vi phạm "permission first" principle.

## Suggested Fix
Trong `RegistrationsController.update()` (xem file), check role admin TRƯỚC khi validate date:
```typescript
async update(id, req, userId, role) {
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // ... date validation
}
```

## File reference
- `src/controllers/RegistrationsController.ts:69-96`