# 12 — Security Hardening

Mục tiêu: tìm bug bảo mật bằng cách tấn công có hệ thống các ranh giới bảo mật.

---

## SEC-01 — Phân quyền ngang (Horizontal privilege escalation)

**Nghi vấn**: employee A có thể truy cập data của employee B không?

| Test | Expected |
|------|----------|
| Login A, gọi `GET /api/registrations` | Chỉ trả về data của A |
| Login A, gọi `PATCH /api/registrations/REG_ID_CUA_B` | 403 hoặc 404 |
| Login A, vào `/admin/employees/[id_B]/registrations` | Redirect |
| Login A, gọi `GET /api/admin/employees/[id_B]/registrations` | 403 |

---

## SEC-02 — Phân quyền dọc (Vertical privilege escalation)

**Nghi vấn**: employee có thể leo thành admin không?

| Test | Expected |
|------|----------|
| Login employee, gọi `POST /api/users` để tạo admin mới | 403 |
| Login employee, gọi `PATCH /api/settings/cutoff` | 403 |
| Login employee, vào `/admin/*` | Redirect |
| Login employee, gọi `POST /api/daily-menus/batch` | 403 |

---

## SEC-03 — IDOR (Insecure Direct Object Reference)

Thay `id` trong URL bằng giá trị khác đoán được.

```bash
# Login admin, lấy id của user X
USER_X_ID="abc123"
# Login employee, thử truy cập
curl -b emp.cookies http://127.0.0.1:3000/api/users/$USER_X_ID
curl -b emp.cookies http://127.0.0.1:3000/api/admin/employees/$USER_X_ID/registrations
```

| Expected | |
|----------|---|
| 403/404 cho mọi request không phải admin | |

---

## SEC-04 — Cookie tampering

```bash
# Lấy cookie token
TOKEN=$(grep token admin.cookies | awk '{print $7}')
# Sửa 1 char
TAMPERED="${TOKEN:0:-1}X"
curl -b "token=$TAMPERED" http://127.0.0.1:3000/api/auth/me
```

| Expected | |
|----------|---|
| 401, không crash | |

---

## SEC-05 — JWT secret brute-force

```bash
# Nếu attacker biết JWT_SECRET, họ có thể tạo token admin giả
```

| Test | Expected |
|------|----------|
| Tạo JWT với payload `{userId:'admin_id', role:'admin'}` và một secret khác | 401 (verify fail) |
| Tạo JWT với đúng secret | 200 |
| Tạo JWT với `alg: none` | 401 (server KHÔNG chấp nhận none alg) |

> ⚠ Cần check code `verifyToken()` trong `src/lib/auth.ts` xem có explicit check `alg === 'HS256'` không.

---

## SEC-06 — XSS (Cross-Site Scripting)

Mỗi trường input user → output render.

| Vector | Test point |
|--------|-----------|
| `<script>alert(1)</script>` | Tên user, tên meal, description holiday, note registration |
| `<img src=x onerror=alert(1)>` | |
| `javascript:alert(1)` | URL input (nếu có) |
| `<svg onload=alert(1)>` | |

Verify React tự escape (mặc định OK) nhưng:
- `dangerouslySetInnerHTML` (nếu có) → check.
- URL render qua `<a href={userInput}>` → `javascript:` có bị chặn không?

---

## SEC-07 — CSRF (Cross-Site Request Forgery)

JWT cookie `sameSite=lax`. Verify:
- `POST /api/users` từ origin khác có bị chặn không?
- Nếu `sameSite=none` → cần CSRF token.

| Test | Expected |
|------|----------|
| Tạo 1 trang HTML ở domain khác, submit form POST tới `/api/users` | Bị browser chặn (sameSite=lax chỉ cho top-level navigation) |

---

## SEC-08 — SQL Injection

Prisma parameterize queries. Test vẫn cần thiết:

```bash
# Qua URL param
curl -b admin.cookies "http://127.0.0.1:3000/api/admin/stats/date/2026-06-20'%20OR%20'1'='1"
# Qua body
curl -b admin.cookies -X POST .../users -d '{"username":"admin'\''--","password":"x"}'
```

| Expected | |
|----------|---|
| 400 / 401 / 500 không leak SQL | |

---

## SEC-09 — Path traversal

```bash
curl -b admin.cookies http://127.0.0.1:3000/api/meals/../../etc/passwd
```

| Expected | |
|----------|---|
| 400 / 404 / không trả file hệ thống | |

---

## SEC-10 — Open redirect

```bash
curl -i -X POST http://127.0.0.1:3000/api/auth/login \
  -d '{"username":"admin","password":"admin123","redirect":"https://evil.com"}'
```

| Expected | |
|----------|---|
| Redirect chỉ tới whitelist path | |

---

## SEC-11 — Sensitive data exposure

| Test | Expected |
|------|----------|
| Response user object có chứa `password` không? | KHÔNG |
| Stack trace lộ ở 500 error? | KHÔNG |
| `.env` truy cập qua static? | KHÔNG |
| JWT_SECRET leak trong log? | KHÔNG |

---

## SEC-12 — Bcrypt cost factor

```bash
# Verify password hash bắt đầu bằng $2a$12$... hoặc $2b$12$
sqlite3 prisma/dev.db "SELECT password FROM User LIMIT 1;"
```

| Expected | |
|----------|---|
| Cost factor ≥ 10 | |

---

## SEC-13 — Middleware matcher đầy đủ

`middleware.ts` chỉ bắt `/admin/:path*`. Verify các admin route thực tế có prefix `/admin/`:

```bash
# Lấy tất cả route admin
find app -path '*/admin/*' -name '*.tsx' -o -path '*/admin/*' -name '*.ts'
# Nếu có route nào KHÔNG dưới /admin/ (ví dụ /employees/), middleware KHÔNG bảo vệ
```

| Expected | |
|----------|---|
| Mọi admin route đều dưới `/admin/` | |

> Lưu ý đã quan sát: `/employees` ở root có thể không được bảo vệ.

---

## SEC-14 — Auth bypass qua header

```bash
curl -H "X-User-Id: admin_id" -H "X-User-Role: admin" http://127.0.0.1:3000/api/users
```

| Expected | |
|----------|---|
| Server KHÔNG tin header, chỉ tin cookie | |

---

## SEC-15 — Race condition trong override

2 admin cùng override 1 registration → cuối cùng ai thắng? Có audit log cho cả 2 không?

---

## SEC-16 — Information disclosure qua error messages

```bash
# Gửi payload invalid để trigger error
curl -b admin.cookies -X POST http://127.0.0.1:3000/api/users \
  -H "Content-Type: application/json" \
  -d 'INVALID_JSON'
```

| Expected | |
|----------|---|
| Error message không chứa stack trace, file path, internal logic | |

---

## SEC-17 — HTTP Security Headers

```bash
curl -I http://127.0.0.1:3000/login
```

Check:
- `Strict-Transport-Security` (chỉ prod)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (chống clickjacking)
- `Content-Security-Policy`
- `Referrer-Policy`

---

## SEC-18 — Logout có thật sự invalidate token?

```bash
# Login, lưu token, logout, dùng lại token cũ
curl -b old_cookie http://127.0.0.1:3000/api/auth/me
```

| Expected | |
|----------|---|
| Token cũ vẫn hợp lệ (JWT stateless), trừ khi `tokenVersion` được bump khi logout | |

Nếu tokenVersion không bump → severity Medium (token reuse sau logout).

---

## SEC-19 — Email enumeration qua forgot password?

Nếu có link "Quên mật khẩu?" (xem E2E_TEST_SPEC):
- Có trang forgot password thật không?
- Nếu có, response có phân biệt "user tồn tại" vs "không"?

---

## SEC-20 — Audit log coverage

Mỗi action quan trọng có log vào `AuditLog` không?
- Tạo user
- Đổi role
- Override registration
- Đổi cutoff
- Đổi menu

```sql
SELECT * FROM AuditLog ORDER BY createdAt DESC LIMIT 20;
```

---

## Checklist ghi nhanh

```
SEC-01 □  SEC-02 □  SEC-03 □  SEC-04 □  SEC-05 □
SEC-06 □  SEC-07 □  SEC-08 □  SEC-09 □  SEC-10 □
SEC-11 □  SEC-12 □  SEC-13 □  SEC-14 □  SEC-15 □
SEC-16 □  SEC-17 □  SEC-18 □  SEC-19 □  SEC-20 □
```