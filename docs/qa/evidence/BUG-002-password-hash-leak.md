# BUG-002: /api/registrations leak password hash và tokenVersion của user

**Severity**: Critical
**Category**: Security
**Module**: api, booking
**Test case ID**: SEC-11, BOOK-12
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open

## URL / Endpoint
- API: `GET http://127.0.0.1:3000/api/registrations` (employee cookie)

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- User role: employee (nguyenvana)
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
1. Login employee `nguyenvana`
2. Gọi `curl -H "Cookie: token=<token>" http://127.0.0.1:3000/api/registrations`
3. Đếm số lần xuất hiện `password` trong response

## Expected Behavior
- Response chỉ trả về registration info
- User object embedded chỉ chứa public fields: id, username, name, role, departmentId
- KHÔNG chứa password (dù đã hash) và tokenVersion

## Actual Behavior
- HTTP 200 OK
- Mỗi registration trả về embedded `user` object chứa:
  - `"password": "$2b$12...R9a6"` (bcrypt hash — 58 occurrences trong response)
  - `"tokenVersion": 0`
  - Toàn bộ `User` table fields

## Evidence
```
=== Check API responses for password leak ===
--- /api/registrations (employee) ---
  'password' occurrences:
58
```

## Impact
- **CRITICAL**: bcrypt hash leak qua API response.
- Kết hợp với timing attack hoặc dictionary attack có thể crack weak passwords.
- tokenVersion leak cho phép attacker biết khi nào user thay đổi pass (có thể kết hợp với brute-force).
- Vi phạm nguyên tắc tối thiểu quyền truy cập (least privilege).

## Suggested Fix
Trong `RegistrationsRepository` hoặc controller, loại bỏ sensitive fields khi embed user:
```typescript
select: {
  id: true, username: true, name: true, role: true,
  departmentId: true  // Bỏ password, tokenVersion
}
```

## File reference (cần verify)
- `src/controllers/RegistrationsController.ts`
- `src/repositories/RegistrationsRepository.ts` (hoặc tương tự)
- `src/services/RegistrationService.ts:list` (nếu có)