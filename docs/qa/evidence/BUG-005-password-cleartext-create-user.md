# BUG-005: POST /api/users trả về password cleartext trong response.credentials

**Severity**: Medium (design choice nhưng vẫn risk)
**Category**: Security
**Module**: api, employees
**Test case ID**: EMP-03, SEC-11
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open (design decision cần review)

## URL / Endpoint
- API: `POST http://127.0.0.1:3000/api/users` (admin cookie)

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- User role: admin
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
1. Login admin
2. POST tạo user mới với password biết trước:
   ```bash
   curl -X POST -H "Cookie: token=<admin>" -H "Content-Type: application/json" \
     -d '{"username":"test_qa_leakcheck","password":"Sup3rS3cret!","name":"Leak Check","role":"employee"}' \
     http://127.0.0.1:3000/api/users
   ```
3. Tìm password trong response

## Expected Behavior
- Response chỉ chứa user info (id, username, name, role)
- KHÔNG chứa password dưới bất kỳ hình thức nào

## Actual Behavior
- HTTP 201 Created
- Response chứa:
  ```json
  {
    "user": {"id":"...","username":"test_qa_leakcheck","name":"Leak Check","role":"employee"},
    "credentials": {"username":"test_qa_leakcheck","password":"Sup3rS3cret!"}
  }
  ```
- Password cleartext hiển thị trong field `credentials.password`

## Evidence
```
=== POST /api/users with known password ===
Response:
{"user":{"id":"cmqnmfb3o000bjkv6ky240n72","username":"test_qa_leakcheck","name":"Leak Check","role":"employee"},"credentials":{"username":"test_qa_leakcheck","password": "Sup3rS3cret!"}}
=== Search for 'Sup3rS3cret!' in response ===
BUG CONFIRMED: Password leaked in cleartext!
```

## Impact
- Cleartext password bị leak trong response body.
- Nếu API gateway/proxy log request/response (phổ biến trong production), password bị ghi vào log files.
- Nếu developer console/devtools log response (rất phổ biến), password cũng leak.
- Trong REST best practices, response chỉ nên chứa resource mới tạo, KHÔNG chứa credentials.

## Note (Design Intent)
- Có vẻ design intent là để admin hiển thị 1 lần cho user copy (giống AWS tạo user mới).
- Nhưng việc trả qua API là không an toàn — nên dùng modal riêng để generate password mà không qua HTTP response.

## Suggested Fix
Option 1 (Best): Xóa `credentials` khỏi response. Generate password phía client (UI), hoặc gửi qua email/SMS.

Option 2: Chỉ trả password nếu client explicitly request qua query param `?returnCredentials=true`:
```typescript
const shouldReturn = new URL(req.url).searchParams.get('returnCredentials') === 'true'
return NextResponse.json({
  user: ...,
  ...(shouldReturn && { credentials: {...} })
})
```

Option 3: Thêm security warning + audit log mỗi lần password được trả.

## File reference
- `src/controllers/UsersController.ts:60-69` (return statement with credentials)
- `src/services/UserService.ts:7-13, 67` (CreateUserResult interface with credentials)