# 11 — API Contract Testing

Mục tiêu: kiểm thử từng REST endpoint độc lập bằng `curl` (không qua UI) để verify status code, payload, auth boundary.

**Quy ước**:
- Cookie: dùng `-b cookies.txt` và `-c cookies.txt` để lưu session.
- Base URL: `http://127.0.0.1:3000`.
- Mỗi test case ghi rõ: setup → request → expected status + body schema.

---

## Cú pháp chung

```bash
# Login admin
curl -s -c admin.cookies -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Login employee
curl -s -c emp.cookies -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nguyenvana","password":"employee123"}'

# Test API với cookie
curl -s -b admin.cookies http://127.0.0.1:3000/api/users
```

---

## API-01 — POST /api/auth/login

```bash
# Normal
curl -i -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

| Case | Expected |
|------|----------|
| Valid admin | 200, Set-Cookie token, body có user info |
| Valid employee | 200 |
| Wrong password | 401, message generic |
| Missing username | 400 |
| Missing password | 400 |
| Empty body | 400 |
| Malformed JSON | 400 |
| SQL injection username `' OR '1'='1` | 401 |
| XSS username `<script>` | 401 |
| Very long username (10000 chars) | 400 hoặc 401 |

---

## API-02 — POST /api/auth/logout

```bash
curl -i -b admin.cookies -X POST http://127.0.0.1:3000/api/auth/logout
```

| Case | Expected |
|------|----------|
| Có cookie | 200, Set-Cookie xoá token |
| Không cookie | 401 |
| GET thay vì POST | 405 |

---

## API-03 — GET /api/auth/me

```bash
curl -i -b admin.cookies http://127.0.0.1:3000/api/auth/me
```

| Case | Expected |
|------|----------|
| Admin cookie | 200, body chứa user admin |
| Employee cookie | 200 |
| Không cookie | 401 |
| Cookie tampered (đổi 1 char) | 401 |

---

## API-04 — GET /api/users

| Case | Expected |
|------|----------|
| Admin cookie | 200, array users (ẩn password) |
| Employee cookie | 403 |
| Không cookie | 401 |

**Schema assertion**: mỗi user có `{ id, username, name, role, isActive, departmentId, ... }` — KHÔNG có `password`.

---

## API-05 — POST /api/users

```bash
curl -i -b admin.cookies -X POST http://127.0.0.1:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test1234","name":"Test User","role":"employee"}'
```

| Case | Expected |
|------|----------|
| Valid | 201, body có user mới |
| Trùng username | 409 |
| Thiếu field | 400 |
| Password < 4 | 400 |
| Role không hợp lệ | 400 |
| Employee gọi | 403 |

---

## API-06 — PATCH /api/users/[id]

```bash
curl -i -b admin.cookies -X PATCH http://127.0.0.1:3000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","isActive":false}'
```

| Case | Expected |
|------|----------|
| Valid | 200 |
| ID không tồn tại | 404 |
| Empty body | 400 (validation?) |
| PATCH password | Có cho phép? Nếu có → bump tokenVersion |
| Admin tự set role mình thành employee | Có cho không? |

---

## API-07 — DELETE /api/users/[id]

| Case | Expected |
|------|----------|
| Valid | 200/204 |
| ID không tồn tại | 404 |
| Xóa chính mình | Có cho? |

---

## API-08 — GET/POST /api/departments

| Case | Expected |
|------|----------|
| Admin GET | 200 |
| Employee GET | 200 hoặc 403 (tuỳ thiết kế) |
| Admin POST valid | 201 |
| POST trùng tên | 409 |

---

## API-09 — /api/meals + /api/meals/find-or-create

`find-or-create` đáng chú ý:

| Case | Expected |
|------|----------|
| Gửi name mới | Tạo mới |
| Gửi name đã tồn tại | Trả về existing, không tạo mới |
| Gửi empty name | 400 |

---

## API-10 — /api/daily-menus (CRUD)

```bash
# GET tất cả
curl -b admin.cookies http://127.0.0.1:3000/api/daily-menus

# GET theo ngày
curl -b admin.cookies http://127.0.0.1:3000/api/daily-menus/2026-06-22

# POST tạo
curl -b admin.cookies -X POST http://127.0.0.1:3000/api/daily-menus \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-06-22","mealIds":["m1","m2"]}'

# PATCH update
curl -b admin.cookies -X PATCH http://127.0.0.1:3000/api/daily-menus/2026-06-22 \
  -H "Content-Type: application/json" \
  -d '{"mealIds":["m3"]}'

# DELETE 1 meal
curl -b admin.cookies -X DELETE http://127.0.0.1:3000/api/daily-menus/2026-06-22/meals/MEAL_ID
```

| Case | Expected |
|------|----------|
| Admin GET ngày có menu | 200 |
| Admin GET ngày không có | 404 hoặc empty |
| Employee GET | 200 (read-only OK) |
| Employee POST | 403 |
| Trùng date | 409 |

---

## API-11 — /api/daily-menus/batch

```bash
curl -b admin.cookies -X POST http://127.0.0.1:3000/api/daily-menus/batch \
  -H "Content-Type: application/json" \
  -d '{"weekStart":"2026-06-22","menus":[{"date":"2026-06-22","mealIds":["m1"]},...]}'
```

| Case | Expected |
|------|----------|
| Valid | 200, tất cả ngày tạo/cập nhật |
| Empty array | 400 |
| Một ngày invalid | Toàn bộ rollback hay chỉ ngày đó fail? |

---

## API-12 — /api/registrations

```bash
# Tạo registration
curl -b emp.cookies -X POST http://127.0.0.1:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-06-22","status":"eating"}'

# List của mình
curl -b emp.cookies http://127.0.0.1:3000/api/registrations

# Admin list all
curl -b admin.cookies http://127.0.0.1:3000/api/registrations
```

| Case | Expected |
|------|----------|
| Employee POST ngày mai | 201 |
| Employee POST hôm nay | 400 DATE_NOT_FUTURE |
| Employee POST T7/CN | 400 WEEKEND |
| Employee POST quá 4 tuần | 400 OUTSIDE_CURRENT_WEEK |
| Employee POST sau cutoff | 400 LOCKED |
| Employee POST ngày lễ | 400 |
| Employee POST trùng ngày đã đăng ký | Update hay 409? |
| Employee GET | Chỉ trả về registration của chính mình (không leak data user khác) |
| Admin GET all | Tất cả |

---

## API-13 — PATCH /api/registrations/[id] (admin override)

```bash
curl -b admin.cookies -X PATCH http://127.0.0.1:3000/api/registrations/REG_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"not_eating","note":"Test override"}'
```

| Case | Expected |
|------|----------|
| Admin valid | 200, tạo RegistrationOverride row |
| Admin không có note | Cho phép? |
| Employee gọi | 403 |
| Override registration không tồn tại | 404 |

**Verify**: `SELECT * FROM RegistrationOverride WHERE registrationId='REG_ID'` có row mới.

---

## API-14 — DELETE /api/registrations/[id]

| Case | Expected |
|------|----------|
| Admin | 200, xóa |
| Employee | 403 |
| Không tồn tại | 404 |

---

## API-15 — /api/holidays

| Case | Expected |
|------|----------|
| Admin POST valid | 201 |
| Admin POST trùng date | 409 |
| Employee GET | 200 (cho đọc) |
| Employee POST | 403 |
| Date format sai | 400 |

---

## API-16 — /api/settings/cutoff

```bash
curl -b admin.cookies -X POST http://127.0.0.1:3000/api/settings/cutoff \
  -H "Content-Type: application/json" \
  -d '{"cutoffHour":18,"cutoffMinute":30}'
```

| Case | Expected |
|------|----------|
| Admin valid | 200 |
| Hour/Minute ngoài range | 400 |
| Employee | 403 |

---

## API-17 — /api/admin/stats

```bash
curl -b admin.cookies http://127.0.0.1:3000/api/admin/stats
curl -b admin.cookies http://127.0.0.1:3000/api/admin/stats/date/2026-06-20
```

| Case | Expected |
|------|----------|
| Admin | 200 |
| Employee | 403 |
| Date invalid | 400 |

---

## API-18 — /api/admin/reports + export

| Case | Expected |
|------|----------|
| Admin GET `/api/admin/reports?type=day&date=2026-06-20` | 200 |
| Admin GET `/api/admin/reports/export?type=day&date=2026-06-20` | 200, Content-Type: text/csv, attachment |
| Admin GET `/api/admin/reports/export-xlsx?...` | 200, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |
| Employee | 403 |
| Query injection | Escape |

---

## API-19 — Content-Type validation

Mỗi POST endpoint: gửi thiếu Content-Type hoặc sai → 415 hoặc 400?

```bash
curl -i -b admin.cookies -X POST http://127.0.0.1:3000/api/users \
  -d '{"username":"x"}'  # không có Content-Type
```

---

## API-20 — Large payload

Gửi body 10MB → server có giới hạn không?

---

## API-21 — Method không hợp lệ

```bash
curl -i -X DELETE http://127.0.0.1:3000/api/auth/login
```

Expected: 405 Method Not Allowed.

---

## API-22 — Rate limit

Trong `RATE_LIMIT_BYPASS=true`, rate-limit có bị tắt không?
Nếu tắt, bật lại (`false`) và test:

```bash
for i in {1..100}; do curl -X POST .../login -d '{...}'; done
```

Sau N request → 429?

---

## Checklist ghi nhanh

```
API-01 □ ... API-22 □
```