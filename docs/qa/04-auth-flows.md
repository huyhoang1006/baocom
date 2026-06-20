# 04 — Authentication Flows

Mục tiêu: kiểm thử đầy đủ luồng xác thực — đăng nhập, đăng xuất, session, phân quyền, redirect.

Nguồn nghiệp vụ: `BUSINESS_RULES.md > <authentication>` + `middleware.ts`.

---

## AUTH-01 — Login thành công (admin)

**Loại**: Normal Flow
**Quyền**: anonymous
**Severity chờ**: —

| Step | Action | Expected |
|------|--------|----------|
| 1 | Truy cập `http://127.0.0.1:3000/` | Auto redirect → `/login` |
| 2 | Nhập `admin` / `admin123` vào form | Trường input có giá trị, button enabled |
| 3 | Click "Đăng nhập" | Request `POST /api/auth/login` 200, cookie `token` được set |
| 4 | Đợi redirect | URL đổi sang `/admin/dashboard` (admin) hoặc `/dashboard` (employee) |
| 5 | Mở DevTools → Application → Cookies | Cookie `token` tồn tại, httpOnly=true, sameSite=lax |
| 6 | Check console | Không có JS error / network 4xx-5xx |

**Edge phụ**:
- Refresh trang `/admin/dashboard` — vẫn vào được (cookie hợp lệ).
- Mở tab mới cùng URL — vẫn login (cookie chia sẻ).

---

## AUTH-02 — Login thành công (employee)

**Loại**: Normal Flow
**Quyền**: anonymous

Lặp lại AUTH-01 với `nguyenvana` / `employee123`. Expected: redirect → `/dashboard`.

**Assertion bổ sung**:
- Sidebar employee chỉ có 3 mục: Dashboard / Báo cơm / Lịch sử (KHÔNG có mục admin).
- Truy cập trực tiếp `/admin/dashboard` → phải redirect (xem AUTH-07).

---

## AUTH-03 — Sai mật khẩu

**Loại**: Exception Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/login`, nhập `admin` / `sai_password` | Form validate ≥ 4 ký tự (client) |
| 2 | Submit | Server trả 401 hoặc hiển thị "Sai tên đăng nhập hoặc mật khẩu" |
| 3 | URL | Vẫn ở `/login`, KHÔNG set cookie `token` |
| 4 | Thử lại 5 lần liên tiếp | Kiểm tra có rate-limit chưa (xem `RATE_LIMIT_BYPASS`) |

**Quan sát**: Thời gian response có đều giữa user-không-tồn-tại và user-sai-mật-khẩu (timing attack prevention) — yêu cầu trong BUSINESS_RULES.

---

## AUTH-04 — Username không tồn tại

**Loại**: Exception Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/login`, nhập `khongtontai` / `anything` | |
| 2 | Submit | Server trả lỗi generic "Sai tên đăng nhập hoặc mật khẩu" — KHÔNG phân biệt "user not found" |
| 3 | Verify timing | Response time tương đương AUTH-03 |

---

## AUTH-05 — Tài khoản bị vô hiệu (isActive=false)

**Loại**: Exception Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Setup: `UPDATE User SET isActive=0 WHERE username='hoangvane';` | |
| 2 | Login với `hoangvane` / `employee123` | Thất bại, message generic |
| 3 | Cleanup: `UPDATE User SET isActive=1 WHERE username='hoangvane';` | |

---

## AUTH-06 — Validation input phía client

**Loại**: Alternative Flow (validation)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Để trống cả 2 trường, click "Đăng nhập" | Browser required validation chặn |
| 2 | Nhập username=`<script>alert(1)</script>`, password=`pwd1234` | Không bị XSS — hiển thị nguyên văn |
| 3 | Password `< 4 ký tự` | Client block (xem `BUSINESS_RULES > security_rules`) |
| 4 | Password = 4 ký tự `abcd` | Submit được (đạt min) |
| 5 | Username với khoảng trắng đầu/cuối: ` admin` | Verify xem có trim không |
| 6 | Username với chữ hoa: `ADMIN` | Có phân biệt hoa/thường không? |

---

## AUTH-07 — Auth guard cho route admin

**Loại**: Exception Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | **Không login**, truy cập `/admin/dashboard` | Redirect → `/login` |
| 2 | **Login employee** (`nguyenvana`), truy cập `/admin/dashboard` | Redirect → `/` (home) hoặc `/dashboard` |
| 3 | **Cookie hết hạn** (set thủ công expired token), truy cập `/admin/*` | Redirect → `/login` |
| 4 | **Cookie sửa linh tinh**, truy cập `/admin/*` | Redirect → `/login`, KHÔNG crash |

> ⚠ Lưu ý: middleware chỉ bắt `/admin/:path*` (xem `middleware.ts`). Cần test thêm:
> - `/employees` (KHÔNG có prefix `/admin/`) — có được bảo vệ không?
> - `/api/admin/*` — controller có kiểm tra role không?
>
> Xem chi tiết ở `12-security-hardening.md`.

---

## AUTH-08 — Logout

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login thành công | Cookie `token` set |
| 2 | Click "Đăng xuất" | Request `POST /api/auth/logout`, cookie `token` bị xoá/expire |
| 3 | Redirect | Về `/login` |
| 4 | Truy cập `/dashboard` (employee) hoặc `/admin/dashboard` (admin) | Bị redirect `/login` |

---

## AUTH-09 — Session vẫn sống sau khi đóng tab

**Loại**: Normal Flow (persistence)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login, đóng tab, mở lại URL `/dashboard` | Vẫn vào được (cookie persistent 7 ngày) |

---

## AUTH-10 — Token bị thu hồi / tokenVersion tăng

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login admin, lưu cookie | |
| 2 | Admin update user X (tăng `tokenVersion`) | |
| 3 | User X (đang login ở tab khác) gọi API | Phải nhận 401 và redirect login |

> Kiểm tra field `tokenVersion` ở `User` model có thực sự được so sánh ở `verifyToken()` không.

---

## AUTH-11 — 403 page

**Loại**: Edge case

| Step | Action | Expected |
|------|--------|----------|
| 1 | Truy cập `/403` | Hiển thị page lỗi, có nút "Về trang chủ" / "Đăng nhập lại" |
| 2 | Truy cập trực tiếp URL không tồn tại `/admin/xyz` | Redirect `/login` (không 404 — middleware catch trước) |

---

## AUTH-12 — Nhập liệu XSS qua trường login

**Loại**: Security

| Input | Expected |
|-------|----------|
| `admin<img src=x onerror=alert(1)>` | Không trigger script |
| `' OR '1'='1` | Không bypass auth |
| `admin; DROP TABLE User;--` | Không crash DB (Prisma parameter hóa) |

---

## Báo cáo

Mỗi case → ghi 1 dòng vào checklist này (Pass/Fail/Block) + chụp ảnh khi fail vào `evidence/AUTH-NNN-*.png`.