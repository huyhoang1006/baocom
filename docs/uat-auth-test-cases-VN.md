# UAT: Xác thực & Luồng Đăng nhập

**Dự án:** BaoCom    **Ngày:** 2026-05-14    **Loại:** Kiểm thử Chấp nhận Black Box

---

## 1. Tổng quan Hệ thống

### Kiến trúc Xác thực
- **API Đăng nhập:** `POST /api/auth/login` — xác thực thông tin, đặt cookie `token` (httpOnly, hết hạn 7 ngày)
- **API Đăng xuất:** `POST /api/auth/logout` — xóa cookie `token`
- **API Phiên:** `GET /api/auth/me` — trả về người dùng hiện tại từ JWT payload
- **Middleware:** `withAuth` bảo vệ các route; `withAdmin` yêu cầu vai trò admin
- **Bộ giới hạn tốc độ:** 5 lần thử trong 15 phút; khóa 15 phút sau khi vượt ngưỡng

### Vai trò được hỗ trợ
| Vai trò | Route Dashboard | Mức độ truy cập |
|--------|----------------|-----------------|
| `admin` | `/admin/dashboard` | Toàn quyền |
| `user` (mặc định) | `/dashboard` | Tiêu chuẩn |

---

## 2. Yêu cầu Dữ liệu Test

### Thông tin đăng nhập hợp lệ
| Tên đăng nhập | Mật khẩu | Vai trò | Trạng thái |
|---------------|----------|---------|------------|
| `admin` | `admin123` | admin | Hoạt động |
| Bất kỳ tên đăng nhập nào chứa `admin` | Mật khẩu hợp lệ | admin | Hoạt động |
| `testuser` | `password` | user | Hoạt động |
| `inactive_user` | `password` | user | **Không hoạt động** |

### Thông tin đăng nhập không hợp lệ
| Tên đăng nhập | Mật khẩu | Lỗi mong đợi |
|---------------|----------|--------------|
| `nonexistent` | bất kỳ | `Invalid credentials` |
| `admin` | `wrongpassword` | `Invalid credentials` |
| `` | bất kỳ | `Missing username or password` |
| `admin` | `` | `Missing username or password` |
| `<script>` | `admin123` | `Invalid credentials` (được lọc qua kiểm tra độ dài >255) |

---

## 3. Các Trường hợp Test

### TC-UAT-001: Đăng nhập với thông tin hợp lệ
**Ưu tiên:** P0 | **Luồng:** Đăng nhập

**Điều kiện tiên quyết:** Người dùng tồn tại, đang hoạt động, biết thông tin đăng nhập hợp lệ

**Các bước thực hiện:**
1. Điều hướng đến `/login`
2. Nhập tên đăng nhập và mật khẩu hợp lệ
3. Nhấn nút "Đăng nhập"

**Kết quả mong đợi:**
- HTTP 200 được trả về từ `/api/auth/login`
- Body phản hồi chứa object `user` với `id`, `username`, `name`, `role`
- Cookie `token` được đặt với httpOnly, sameSite=lax
- Trang chuyển hướng đến `/dashboard` (hoặc `/admin/dashboard` nếu vai trò=admin)
- Không hiển thị thông báo lỗi

**Tiêu chí đạt:** Người dùng đến đúng dashboard; không có lỗi hiển thị

---

### TC-UAT-002: Đăng nhập với tên đăng nhập không tồn tại
**Ưu tiên:** P0 | **Luồng:** Đăng nhập

**Các bước thực hiện:**
1. Điều hướng đến `/login`
2. Nhập tên đăng nhập không tồn tại
3. Nhập bất kỳ mật khẩu nào
4. Nhấn "Đăng nhập"

**Kết quả mong đợi:**
- HTTP 401 được trả về
- Phản hồi: `{ "error": "Invalid credentials" }`
- Bộ đếm giới hạn tốc độ tăng lên
- Trang hiển thị lỗi: "Sai tên đăng nhập hoặc mật khẩu"
- Không có chuyển hướng

**Tiêu chí đạt:** Thông báo lỗi hiển thị; không tạo phiên

---

### TC-UAT-003: Đăng nhập với mật khẩu sai
**Ưu tiên:** P0 | **Luồng:** Đăng nhập

**Các bước thực hiện:**
1. Điều hướng đến `/login`
2. Nhập tên đăng nhập hợp lệ
3. Nhập mật khẩu sai
4. Nhấn "Đăng nhập"

**Kết quả mong đợi:**
- HTTP 401 được trả về
- Phản hồi: `{ "error": "Invalid credentials" }`
- Bộ đếm giới hạn tốc độ tăng lên
- Trang hiển thị lỗi: "Sai tên đăng nhập hoặc mật khẩu"

**Tiêu chí đạt:** Thông báo lỗi hiển thị; không tạo phiên

---

### TC-UAT-004: Đăng nhập thiếu tên đăng nhập
**Ưu tiên:** P1 | **Luồng:** Đăng nhập

**Các bước thực hiện:**
1. Điều hướng đến `/login`
2. Để trống tên đăng nhập
3. Nhập bất kỳ mật khẩu nào
4. Nhấn "Đăng nhập"

**Kết quả mong đợi:**
- HTTP 400 được trả về
- Phản hồi: `{ "error": "Missing username or password" }`

**Tiêu chí đạt:** Trả về lỗi phù hợp trước khi gọi API (validation phía client có thể chặn)

---

### TC-UAT-005: Đăng nhập thiếu mật khẩu
**Ưu tiên:** P1 | **Luồng:** Đăng nhập

**Các bước thực hiện:**
1. Điều hướng đến `/login`
2. Nhập tên đăng nhập
3. Để trống mật khẩu
4. Nhấn "Đăng nhập"

**Kết quả mong đợi:**
- HTTP 400 được trả về (nếu validation phía client passes)
- Phản hồi: `{ "error": "Missing username or password" }`

**Validation UI:** Kiểm tra phía client hiển thị "Mật khẩu phải có ít nhất 4 ký tự" nếu mật khẩu < 4 ký tự

**Tiêu chí đạt:** Lỗi hiển thị; không gửi request đến API với mật khẩu trống

---

### TC-UAT-006: Đăng nhập với mật khẩu quá ngắn (Validation phía client)
**Ưu tiên:** P2 | **Luồng:** Đăng nhập

**Các bước thực hiện:**
1. Điều hướng đến `/login`
2. Nhập tên đăng nhập
3. Nhập mật khẩu với 1-3 ký tự
4. Nhấn "Đăng nhập"

**Kết quả mong đợi:**
- Validation phía client: Hiển thị "Mật khẩu phải có ít nhất 4 ký tự"
- Không có cuộc gọi API

**Tiêu chí đạt:** Client chặn submit; không có request API

---

### TC-UAT-007: Đăng nhập với tài khoản không hoạt động
**Ưu tiên:** P0 | **Luồng:** Đăng nhập

**Các bước thực hiện:**
1. Đăng nhập với người dùng có `isActive = false`
2. Gửi thông tin đăng nhập hợp lệ

**Kết quả mong đợi:**
- HTTP 401 được trả về
- Phản hồi: `{ "error": "Invalid credentials" }`
- Lỗi giống như thông tin đăng nhập không hợp lệ (giảm thiểu timing attack)
- Không tạo phiên

**Tiêu chí đạt:** Người dùng không hoạt động không thể đăng nhập; lỗi không tiết lộ user tồn tại

---

### TC-UAT-008: Giới hạn tốc độ đăng nhập — Tiếp cận Ngưỡng Khóa
**Ưu tiên:** P0 | **Luồng:** Đăng nhập

**Điều kiện tiên quyết:** Không có lần thử thất bại trước đó từ IP test

**Các bước thực hiện:**
1. Thử đăng nhập với mật khẩu sai 5 lần liên tiếp
2. Sử dụng tên đăng nhập không hợp lệ cho mỗi lần thử (để tránh nhầm lẫn khóa tài khoản)

**Kết quả mong đợi:**
- Sau 5 lần thử thất bại: HTTP 429 được trả về
- Phản hồi: `{ "error": "Too many failed attempts. Please try again after 15 minutes.", "retryAfter": 900 }`
- Các lần thử đăng nhập tiếp theo bị chặn trong 15 phút
- Giới hạn tốc độ reset khi đăng nhập thành công

**Tiêu chí đạt:** Khóa được thực thi; thời gian retry được trả về

---

### TC-UAT-009: Đăng nhập sau khi hết thời gian khóa
**Ưu tiên:** P1 | **Luồng:** Đăng nhập

**Các bước thực hiện:**
1. Bị khóa qua 5 lần thử thất bại
2. Đợi 15 phút (hoặc xác minh khóa đã hết hạn)
3. Thử đăng nhập với thông tin hợp lệ

**Kết quả mong đợi:**
- Khóa đã được xóa
- Đăng nhập thành công nếu thông tin hợp lệ

**Tiêu chí đạt:** Người dùng đã bị khóa có thể đăng nhập sau khi hết thời gian khóa

---

### TC-UAT-010: Duy trì phiên — Token hợp lệ
**Ưu tiên:** P0 | **Luồng:** Phiên

**Các bước thực hiện:**
1. Đăng nhập thành công; ghi nhận cookie `token`
2. Gọi `GET /api/auth/me` với `Cookie: token=<value>`

**Kết quả mong đợi:**
- HTTP 200 được trả về
- Phản hồi: `{ "user": { "id", "username", "name", "role" } }`

**Tiêu chí đạt:** Dữ liệu người dùng đã xác thực được trả về

---

### TC-UAT-011: Duy trì phiên — Thiếu Token
**Ưu tiên:** P0 | **Luồng:** Phiên

**Các bước thực hiện:**
1. Gọi `GET /api/auth/me` mà không có cookie nào

**Kết quả mong đợi:**
- HTTP 401 được trả về
- Phản hồi: `{ "error": "Unauthorized" }`

**Tiêu chí đạt:** Yêu cầu không xác thực bị từ chối

---

### TC-UAT-012: Duy trì phiên — Token không hợp lệ
**Ưu tiên:** P0 | **Luồng:** Phiên

**Các bước thực hiện:**
1. Gọi `GET /api/auth/me` với `Cookie: token=invalid_token_string`

**Kết quả mong đợi:**
- HTTP 401 được trả về
- Phản hồi: `{ "error": "Invalid token" }`

**Tiêu chí đạt:** Token bị giả mạo bị từ chối

---

### TC-UAT-013: Duy trì phiên — Token hết hạn
**Ưu tiên:** P0 | **Luồng:** Phiên

**Điều kiện tiên quyết:** JWT được cấu hình với thời hạn 7 ngày

**Các bước thực hiện:**
1. Lấy token gần hết hạn hoặc đợi 7 ngày
2. Gọi `GET /api/auth/me` với cookie đã hết hạn

**Kết quả mong đợi:**
- HTTP 401 được trả về
- Phản hồi: `{ "error": "Invalid token" }` (JWT verification thất bại)

**Tiêu chí đạt:** Token hết hạn bị từ chối; phải đăng nhập lại

---

### TC-UAT-014: Đăng xuất — Xóa Phiên
**Ưu tiên:** P0 | **Luồng:** Đăng xuất

**Các bước thực hiện:**
1. Đăng nhập thành công
2. Gọi `POST /api/auth/logout` với token cookie

**Kết quả mong đợi:**
- HTTP 200 được trả về
- Cookie `token` được đặt thành rỗng với `maxAge=0`
- Lệnh gọi tiếp theo đến `/api/auth/me` trả về 401

**Tiêu chí đạt:** Phiên kết thúc; cookie token đã được xóa

---

### TC-UAT-015: Định tuyến theo vai trò — Admin Chuyển hướng
**Ưu tiên:** P0 | **Luồng:** Đăng nhập

**Các bước thực hiện:**
1. Đăng nhập với người dùng có vai trò `admin`
2. Quan sát đích chuyển hướng

**Kết quả mong đợi:**
- Chuyển hướng đến `/admin/dashboard`

**Tiêu chí đạt:** Admin đến dashboard quản trị

---

### TC-UAT-016: Định tuyến theo vai trò — Người dùng thường Chuyển hướng
**Ưu tiên:** P0 | **Luồng:** Đăng nhập

**Các bước thực hiện:**
1. Đăng nhập với người dùng có vai trò `user` (mặc định)
2. Quan sát đích chuyển hướng

**Kết quả mong đợi:**
- Chuyển hướng đến `/dashboard`

**Tiêu chí đạt:** Người dùng thường đến dashboard tiêu chuẩn

---

### TC-UAT-017: Truy cập Route được bảo vệ mà không có Auth
**Ưu tiên:** P1 | **Luồng:** Ủy quyền

**Các bước thực hiện:**
1. Thử truy cập `/admin/dashboard` mà không đăng nhập trước (không có token cookie)

**Kết quả mong đợi:**
- Chuyển hướng đến `/login` (hoặc 403/401 tùy implementation)

**Tiêu chí đạt:** Route được bảo vệ không thể truy cập không có auth

---

### TC-UAT-018: Truy cập Route Admin với Token người dùng thường
**Ưu tiên:** P0 | **Luồng:** Ủy quyền

**Các bước thực hiện:**
1. Đăng nhập như người dùng không phải admin
2. Thử truy cập `/admin/dashboard`

**Kết quả mong đợi:**
- HTTP 403 Forbidden (qua middleware `withAdmin`)
- HOẶC chuyển hướng đến `/dashboard` với lỗi

**Tiêu chí đạt:** Người dùng thường không thể truy cập route admin

---

### TC-UAT-019: Thuộc tính bảo mật Cookie Đăng nhập
**Ưu tiên:** P1 | **Luồng:** Bảo mật

**Các bước thực hiện:**
1. Đăng nhập và kiểm tra header `Set-Cookie`

**Kết quả mong đợi:**
- `HttpOnly: true` — không truy cập được qua JavaScript
- `SameSite: Lax` — bảo vệ CSRF
- `Secure: true` (trong production với HTTPS)
- `Max-Age: 604800` (7 ngày tính bằng giây)

**Tiêu chí đạt:** Cookie có các cờ bảo mật phù hợp

---

### TC-UAT-020: Kiểm tra độ dài tên đăng nhập (Ngăn chặn lạm dụng)
**Ưu tiên:** P2 | **Luồng:** Bảo mật

**Các bước thực hiện:**
1. Thử đăng nhập với tên đăng nhập > 255 ký tự

**Kết quả mong đợi:**
- HTTP 401 được trả về
- Phản hồi: `{ "error": "Invalid credentials" }` (generic, không tiết lộ validation thất bại)

**Tiêu chí đạt:** Input quá kích thước được từ chối một cách duyên dáng

---

### TC-UAT-021: Xử lý phiên đồng thời
**Ưu tiên:** P2 | **Luồng:** Phiên

**Các bước thực hiện:**
1. Đăng nhập trên Thiết bị A; ghi nhận token
2. Đăng nhập trên Thiết bị B với cùng thông tin; ghi nhận token mới
3. Sử dụng token Thiết bị A để gọi `/api/auth/me`

**Kết quả mong đợi:**
- Cả hai token đều hợp lệ (không có enforce single-session observed)
- HOẶC token trước đó bị vô hiệu hóa (chế độ single-session)

**Tiêu chí đạt:** Hành vi phù hợp với yêu cầu hệ thống

---

### TC-UAT-022: Endpoint gốc API Auth
**Ưu tiên:** P2 | **Luồng:** Đăng nhập

**Các bước thực hiện:**
1. Gọi `GET /api/auth`

**Kết quả mong đợi:**
- HTTP 200 được trả về
- Phản hồi: `{ "message": "Auth API" }`

**Tiêu chí đạt:** Health check trả về phản hồi như mong đợi

---

### TC-UAT-023: Liên kết Quên mật khẩu hiện diện
**Ưu tiên:** P3 | **Luồng:** Đăng nhập

**Các bước thực hiện:**
1. Điều hướng đến `/login`
2. Tìm liên kết "Quên mật khẩu?"

**Kết quả mong đợi:**
- Liên kết hiện diện và trỏ đến `/forgot-password`

**Tiêu chí đạt:** Đường dẫn khôi phục có sẵn

---

### TC-UAT-024: Thông báo lỗi không tiết lộ sự tồn tại của người dùng
**Ưu tiên:** P1 | **Luồng:** Bảo mật

**Các bước thực hiện:**
1. Thử đăng nhập với tên đăng nhập hợp lệ nhưng mật khẩu sai
2. Thử đăng nhập với tên đăng nhập không tồn tại

**Kết quả mong đợi:**
- Cả hai trả về lỗi giống nhau: `Invalid credentials`
- Lỗi KHÔNG tiết lộ tên đăng nhập có tồn tại hay không

**Tiêu chí đạt:** Timing/semantic attack được giảm thiểu

---

### TC-UAT-025: Ẩn trường mật khẩu
**Ưu tiên:** P3 | **Luồng:** UI

**Các bước thực hiện:**
1. Điều hướng đến `/login`
2. Nhập mật khẩu

**Kết quả mong đợi:**
- Các ký tự mật khẩu được ẩn (dots/asterisks)
- Nút toggle để hiện không có (có thể là enhancement)

**Tiêu chí đạt:** Mật khẩu không hiển thị khi đang nhập

---

## 4. Ma trận Tóm tắt Test

| ID | Trường hợp Test | Ưu tiên | Luồng | Trạng thái |
|----|-----------------|---------|-------|------------|
| TC-UAT-001 | Đăng nhập hợp lệ | P0 | Đăng nhập | |
| TC-UAT-002 | Tên đăng nhập không hợp lệ | P0 | Đăng nhập | |
| TC-UAT-003 | Mật khẩu không hợp lệ | P0 | Đăng nhập | |
| TC-UAT-004 | Thiếu tên đăng nhập | P1 | Đăng nhập | |
| TC-UAT-005 | Thiếu mật khẩu | P1 | Đăng nhập | |
| TC-UAT-006 | Mật khẩu ngắn (client) | P2 | Đăng nhập | |
| TC-UAT-007 | Người dùng không hoạt động | P0 | Đăng nhập | |
| TC-UAT-008 | Khóa giới hạn tốc độ | P0 | Đăng nhập | |
| TC-UAT-009 | Đăng nhập sau khóa | P1 | Đăng nhập | |
| TC-UAT-010 | Phiên hợp lệ | P0 | Phiên | |
| TC-UAT-011 | Thiếu token | P0 | Phiên | |
| TC-UAT-012 | Token không hợp lệ | P0 | Phiên | |
| TC-UAT-013 | Token hết hạn | P0 | Phiên | |
| TC-UAT-014 | Đăng xuất xóa phiên | P0 | Đăng xuất | |
| TC-UAT-015 | Chuyển hướng admin | P0 | Routing | |
| TC-UAT-016 | Chuyển hướng người dùng | P0 | Routing | |
| TC-UAT-017 | Route được bảo vệ không có auth | P1 | Auth | |
| TC-UAT-018 | Route admin với người dùng | P0 | Auth | |
| TC-UAT-019 | Cờ bảo mật cookie | P1 | Bảo mật | |
| TC-UAT-020 | Giới hạn độ dài tên đăng nhập | P2 | Bảo mật | |
| TC-UAT-021 | Phiên đồng thời | P2 | Phiên | |
| TC-UAT-022 | Auth API gốc | P2 | Health | |
| TC-UAT-023 | Liên kết quên mật khẩu | P3 | UI | |
| TC-UAT-024 | Tính đồng nhất thông báo lỗi | P1 | Bảo mật | |
| TC-UAT-025 | Ẩn mật khẩu | P3 | UI | |

---

## 5. Định nghĩa Ưu tiên

| Ưu tiên | Định nghĩa | Số Test |
|---------|-------------|---------|
| **P0** | Đường dẫn quan trọng — phải pass để phát hành | 14 |
| **P1** | Quan trọng — nên pass | 6 |
| **P2** | Trung bình — có thì tốt | 4 |
| **P3** | Thấp — cosmetic/enhancement | 2 |

---

## 6. Yêu cầu Môi trường

- **Base URL:** `http://localhost:3000` (dev)
- **Database:** Prisma với SQLite (dev); PostgreSQL (staging)
- **Environment Vars:** `JWT_SECRET` bắt buộc
- **Test Users:** Seed script tạo admin + người dùng thường
- **Rate Limiter:** Bị bypass trong môi trường test (NODE_ENV=test)

---

## 7. Tài liệu liên quan

- Specification: `docs/api-auth-test-spec.md`
- E2E Tests: `tests/e2e/auth-flows.spec.ts`
- Authorization Tests: `tests/e2e/authorization.spec.ts`