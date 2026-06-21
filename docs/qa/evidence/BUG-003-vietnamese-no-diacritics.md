# BUG-003: Error message tiếng Việt bị mất dấu trong source code

**Severity**: Medium
**Category**: UX, Content
**Module**: booking
**Test case ID**: BOOK-04, BOOK-05, BOOK-08
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open

## URL / Endpoint
- API: `POST http://127.0.0.1:3000/api/registrations`

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
1. Login employee
2. POST registration với date quá khứ / weekend / quá 4 tuần:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"date":"2026-06-21","status":"eating"}' \
     http://127.0.0.1:3000/api/registrations
   ```

## Expected Behavior
- Error message tiếng Việt có dấu: "Ngày này không nằm trong lịch báo cơm"
- Hoặc message tiếng Anh nhất quán: "Date not in booking window"

## Actual Behavior
- Error tiếng Việt không dấu: `"Ngay nay khong nam trong lich bao com"`
- Hai error liên quan: `Ngay nay da khoa bao com` (đã khóa), `Ngay nay khong nam trong lich bao com` (ngoài window)

## Evidence
```
=== BOOK-04: POST today (DATE_NOT_FUTURE) ===
{"error":"Ngay nay khong nam trong lich bao com"}
HTTP 400
```

## Impact
- UX kém: text hiển thị không tự nhiên, gây khó hiểu cho người dùng Việt Nam
- Frontend có thể không hiển thị được đúng (do copy/paste dấu)
- Vi phạm consistency: các error khác trong hệ thống dùng tiếng Anh có dấu cách rõ ràng (VD: "Missing date or status", "Invalid status")

## Suggested Fix
Sửa trong source:
```typescript
// src/services/RegistrationService.ts:30
throw new Error('Ngày này đã khóa báo cơm')

// src/services/RegistrationService.ts:33
throw new Error('Ngày này không nằm trong lịch báo cơm')
```

Hoặc dùng error code thay vì message text để frontend localize:
```typescript
throw new BookingError('DATE_LOCKED')  // kèm i18n key
```

## File reference
- `src/services/RegistrationService.ts:30,33`
- `src/controllers/RegistrationsController.ts:61,90` (pass-through error message)