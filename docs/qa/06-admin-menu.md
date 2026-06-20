# 06 — Admin Menu Management

Trang: `/admin/menu`
API liên quan: `/api/daily-menus`, `/api/daily-menus/[date]`, `/api/daily-menus/batch`, `/api/daily-menus/[date]/meals/[mealId]`, `/api/meals`, `/api/meals/find-or-create`.

---

## MENU-01 — Xem thực đơn tuần hiện tại

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login admin, vào `/admin/menu` | Hiển thị label "Tuần DD/MM - DD/MM" |
| 2 | Verify mỗi ngày T2-T6 có danh sách món | Mỗi ngày có main + vegetable + dessert |
| 3 | Verify món đang active (`isActive=true`) | Không hiển thị món đã soft-delete |

---

## MENU-02 — Đổi tuần

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Tuần trước" | UI hiển thị tuần trước, có menu (nếu đã seed) hoặc empty state |
| 2 | Click "Tuần này" | Về tuần hiện tại |
| 3 | Click "Tuần sau" | UI hiển thị tuần sau |

---

## MENU-03 — Sửa món cho 1 ngày

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào 1 ngày có menu, mở dropdown/select đổi món chính | List meal hiển thị |
| 2 | Chọn món khác | State local cập nhật |
| 3 | Click "Lưu thay đổi" | Request PATCH `/api/daily-menus/[date]` thành công |
| 4 | Refresh | Món mới hiển thị |

---

## MENU-04 — Thêm món mới vào menu ngày

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Có nút "Thêm món" cho ngày chưa có menu? | |
| 2 | Nếu có: chọn meal từ dropdown, save | OK |
| 3 | Nếu không có: verify endpoint `POST /api/daily-menus/[date]/meals/[mealId]` hoạt động qua curl | |

---

## MENU-05 — Xóa món khỏi ngày

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click icon xóa cạnh 1 món | Confirm dialog (nếu có) |
| 2 | Confirm | Request DELETE `/api/daily-menus/[date]/meals/[mealId]` |
| 3 | UI cập nhật, refresh giữ trạng thái |

---

## MENU-06 — Tạo món mới (Meal CRUD)

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Trong menu editor, có nút "Tạo món mới" | Mở modal/form |
| 2 | Nhập tên + chọn type (main/vegetable/dessert) | Submit |
| 3 | API `POST /api/meals` → 200, món mới xuất hiện trong dropdown | |
| 4 | Test tên trùng | API có unique không? |

---

## MENU-07 — Soft-delete món

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Mở danh sách món (`/api/meals` có filter `isActive`) | |
| 2 | Click "Ẩn" / "Xóa" trên 1 món | Set isActive=false |
| 3 | Verify món không còn trong dropdown menu editor | |
| 4 | Verify món vẫn còn trong lịch sử menu ngày đã dùng | (nên giữ để audit) |

---

## MENU-08 — Batch update menu cho cả tuần

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Có UI batch edit? | Nếu có, test |
| 2 | Không có UI: test `POST /api/daily-menus/batch` qua curl | |

---

## MENU-09 — Sort thứ tự món trong ngày

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | UI có cho kéo-thả sắp xếp? | (sortOrder) |
| 2 | Nếu không: verify default sort ở API | |

---

## MENU-10 — Validation input

**Loại**: Exception Flow

| Input | Expected |
|-------|----------|
| Tên món rỗng | Client + server reject |
| Tên món chỉ có space | Reject |
| Tên món 5000 ký tự | Có maxLength không? |
| Type không hợp lệ (ví dụ `drink`) | Reject |
| Date ở quá khứ cho menu | Cho phép hay không? |

---

## MENU-11 — Empty state tuần chưa có menu

**Loại**: Edge case

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Tuần sau" nhiều lần đến tuần chưa có menu | UI hiển thị "Chưa có thực đơn" + nút "Tạo thực đơn" |
| 2 | Click tạo | Cho phép thêm món |

---

## MENU-12 — Concurrent edit bởi 2 admin

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Mở 2 tab admin `/admin/menu` | |
| 2 | Tab 1 sửa → Save | OK |
| 3 | Tab 2 sửa cùng ngày → Save | Last-write-wins hoặc 409 conflict? |
| 4 | Refresh | Status mới nhất hiển thị |

---

## MENU-13 — Performance với nhiều ngày

**Loại**: Performance (sanity)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click qua nhiều tuần | Load < 1s mỗi tuần |
| 2 | Check network waterfall | Có N+1 query không? |

---

## Checklist ghi nhanh

```
MENU-01 □  MENU-02 □  MENU-03 □  MENU-04 □  MENU-05 □
MENU-06 □  MENU-07 □  MENU-08 □  MENU-09 □  MENU-10 □
MENU-11 □  MENU-12 □  MENU-13 □
```