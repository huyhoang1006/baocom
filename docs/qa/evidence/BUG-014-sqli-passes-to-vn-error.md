# BUG-014: SQL injection payload vẫn lọt qua validation và trả message tiếng Việt mất dấu (kết hợp BUG-003)

**Severity**: Low (defense in depth)
**Category**: Security, Content
**Module**: booking, api
**Test case ID**: SEC-08, BOOK-13
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
```bash
curl -X POST -H "Cookie: token=<emp>" -H "Content-Type: application/json" \
  -d '{"date":"2026-06-01'\'' OR '\''1'\''='\''1","status":"eating"}' \
  http://127.0.0.1:3000/api/registrations
```

## Expected Behavior
- HTTP 400 với error rõ ràng: "Invalid date format"
- Hoặc 400 với error ngắn gọn hơn error nghiệp vụ

## Actual Behavior
- HTTP 400 với error nghiệp vụ tiếng Việt mất dấu: "Ngay nay khong nam trong lich bao com"
- (không phải SQL injection thực sự vì Prisma parameterized — nhưng message confusing)

## Evidence
```
=== SQL injection date ===
{"error":"Ngay nay khong nam trong lich bao com"}
HTTP 400
```

## Impact
- Không phải SQL injection thật (Prisma an toàn).
- Nhưng error message sai ngữ nghĩa (input invalid → báo "ngoài window").

## Suggested Fix
Validate format date trước khi check window:
```typescript
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  return NextResponse.json({ error: 'Invalid date format (YYYY-MM-DD)' }, { status: 400 })
}
```

## File reference
- `src/services/RegistrationService.ts`