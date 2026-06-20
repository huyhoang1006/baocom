# 07 — Admin Employees & Departments

Trang: `/admin/employees`, `/admin/employees/[id]/registrations`, `/admin/departments`
API: `/api/users`, `/api/users/[id]`, `/api/admin/employees/[id]/registrations`, `/api/departments`, `/api/departments/[id]`.

---

## EMP-01 — Xem danh sách nhân viên

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login admin, vào `/admin/employees` | Hiển thị bảng: tên, username, phòng ban, trạng thái |
| 2 | Có phân trang không? | Nếu có, test next/prev |
| 3 | Có sắp xếp theo cột không? | |
| 4 | Có filter isActive không? | |

---

## EMP-02 — Tìm kiếm nhân viên

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Nhập "nguyễn" vào ô tìm kiếm | Filter real-time hoặc sau Enter |
| 2 | Kết quả: các row có tên/username match | |
| 3 | Tìm theo username `admin` | OK |
| 4 | Tìm không có kết quả `zzzz` | Empty state |
| 5 | Tìm với ký tự đặc biệt `<script>` | Không XSS, kết quả an toàn |
| 6 | Clear search | Hiển thị lại toàn bộ |

---

## EMP-03 — Thêm nhân viên mới

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Thêm nhân viên" | Modal/form mở |
| 2 | Nhập: username, password, name, role, department, phone, email | Validation từng trường |
| 3 | Submit | API `POST /api/users` → 200, row mới hiển thị |
| 4 | Refresh | Vẫn còn |

**Validation matrix**:
| Input | Expected |
|-------|----------|
| Username rỗng | Reject |
| Username trùng | 409 / "Username đã tồn tại" |
| Username có khoảng trắng | Reject (whitespace?) |
| Username `admin` (trùng admin) | Reject |
| Password < 4 ký tự | Reject |
| Name rỗng | Reject |
| Email sai format | Reject |
| Phone sai format | Có validate không? |
| Role = "superadmin" | Reject (chỉ cho employee/admin) |

---

## EMP-04 — Sửa thông tin nhân viên

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click 1 row → mở form edit | |
| 2 | Đổi name, save | API PATCH `/api/users/[id]` |
| 3 | Đổi role từ employee → admin | OK, nhưng cần confirm? |
| 4 | Đổi departmentId | OK |
| 5 | Có cho đổi username không? | Nếu không: field disabled |

---

## EMP-05 — Đổi mật khẩu nhân viên (admin reset)

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Trong form edit, có trường "Mật khẩu mới"? | |
| 2 | Nhập mới, save | Password được hash lại |
| 3 | User đó login với mật khẩu mới | OK |
| 4 | Mật khẩu cũ không dùng được | OK |

**Edge**: Nếu có `tokenVersion` — verify có bump lên không khi đổi pass. Nếu không, user cũ vẫn dùng token cũ vào được.

---

## EMP-06 — Vô hiệu hóa nhân viên (soft delete)

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Vô hiệu hóa" trên 1 user | Confirm dialog |
| 2 | Confirm | Set isActive=false |
| 3 | User đó login lại | Fail (xem AUTH-05) |
| 4 | User đó vẫn tồn tại trong lịch sử registration | OK |

---

## EMP-07 — Xem chi tiết nhân viên + lịch sử đăng ký

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click row → `/admin/employees/[id]` | |
| 2 | Vào `/admin/employees/[id]/registrations` | Hiển thị bảng registration của user đó |
| 3 | Filter theo ngày | |
| 4 | Filter theo trạng thái (eating/not_eating) | |

---

## EMP-08 — Admin override registration của nhân viên

**Loại**: Alternative Flow (admin override)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Trong chi tiết user, có nút "Sửa" trên registration? | |
| 2 | Click → cho đổi status dù đã qua cutoff | OK (BUSINESS_RULES cho phép admin override) |
| 3 | API `PATCH /api/registrations/[id]` | 200, có audit log |
| 4 | Có note lý do override không? | Yêu cầu nhập note? |

**Quan sát bảng `RegistrationOverride`**:
- Mỗi override phải tạo 1 row trong `RegistrationOverride` (xem schema).

---

## EMP-09 — Phân quyền: employee truy cập `/admin/employees`

**Loại**: Security

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login employee, vào `/admin/employees` (URL trực tiếp) | Redirect (xem middleware) |
| 2 | API call `GET /api/users` không có admin cookie | 403 |

---

## EMP-10 — Departments: CRUD

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/admin/departments` | Hiển thị list phòng ban |
| 2 | Thêm phòng ban mới | OK |
| 3 | Sửa tên | OK |
| 4 | Xóa phòng ban | Phòng ban không có user → xóa OK; có user → confirm / disable |

---

## EMP-11 — Filter employees theo department

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Có dropdown filter theo department? | |
| 2 | Chọn 1 phòng ban | Chỉ hiển thị user thuộc phòng đó |

---

## EMP-12 — Validation input đặc biệt

**Loại**: Exception Flow

| Input | Expected |
|-------|----------|
| Username `   admin   ` (space đầu/cuối) | Trim? |
| Username `Admin` (case khác) | Coi là trùng `admin`? |
| Name có emoji | OK |
| Name 5000 ký tự | Reject |
| Department không tồn tại | 404 từ API |
| Email = `not-an-email` | Reject |
| Phone = `abc` | Reject |

---

## EMP-13 — Bulk actions

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Có checkbox chọn nhiều row? | |
| 2 | Bulk disable / enable / delete | Có confirm? Có audit log? |

---

## EMP-14 — Phân trang với data lớn

**Loại**: Performance (sanity)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Nếu có > 50 employees | Load từng trang < 1s |

---

## Checklist ghi nhanh

```
EMP-01 □  EMP-02 □  EMP-03 □  EMP-04 □  EMP-05 □
EMP-06 □  EMP-07 □  EMP-08 □  EMP-09 □  EMP-10 □
EMP-11 □  EMP-12 □  EMP-13 □  EMP-14 □
```