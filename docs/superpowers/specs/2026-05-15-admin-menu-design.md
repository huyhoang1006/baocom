# Design Spec: Admin Quản lý Thực đơn

**Dự án:** BaoCom
**Ngày:** 2026-05-15
**Trạng thái:** Approved

---

## 1. Tổng quan

Admin cần 2 trang mới trong sidebar:
- **Thực đơn** (`/admin/menu`) — bảng 5 cột tuần, inline edit từng cell
- **Ngày lễ/ngày nghỉ** (`/admin/holidays`) — cards list + modal CRUD

---

## 2. Sidebar Navigation

File: `app/components/sidebar/AdminSidebar.tsx`

Nav items mới:
```
Dashboard | Thực đơn | Ngày lễ/ngày nghỉ | Nhân sự | Báo cáo
```

- Dashboard → `/admin/dashboard`
- Thực đơn → `/admin/menu` (icon: `restaurant_menu`)
- Ngày lễ/ngày nghỉ → `/admin/holidays` (icon: `event_note`)

---

## 3. Thực đơn Page (`/admin/menu`)

### 3.1 Layout

- **Header**: "Thực đơn" + tuần hiện tại (VD: "Tuần 20/05/2026 - 24/05/2026")
- **Toolbar**:
  - Nút "◀ Tuần trước" / "Tuần sau ▶"
  - Nút "Lưu thay đổi" (primary button)
- **Body**: Bảng 5 cột (T2-T6), mỗi cột là 1 ngày

### 3.2 Bảng cấu trúc

|          | T2        | T3        | T4        | T5        | T6        |
|----------|-----------|-----------|-----------|-----------|-----------|
| **Món chính** | cell      | cell      | cell      | cell      | cell      |
| **Món rau**   | cell      | cell      | cell      | cell      | cell      |
| **Tráng miệng** | cell   | cell      | cell      | cell      | cell      |

### 3.3 Cell Behavior

- **Click** vào cell → hiện input inline
- **Enter** hoặc **click ra ngoài** → save giá trị
- **Escape** → hủy thay đổi, revert về giá trị cũ
- Nếu cell trống → hiển thị chữ "Nhấn để thêm..." (text-muted)
- Mỗi cell có thể chứa nhiều món, phân cách bằng dấu phẩy

### 3.4 Save Behavior

- Nút "Lưu thay đổi" → gọi API tạo/cập nhật daily menu cho 5 ngày
- Nếu chưa có menu cho ngày → tạo mới (upsert)
- Nếu đã có → cập nhật mealIds từ danh sách món đã nhập
- Khi save thành công → hiện toast notification

### 3.5 API Endpoints

- `GET /api/daily-menus?take=5` — lấy 5 ngày gần nhất
- `PUT /api/daily-menus/[date]` — cập nhật menu 1 ngày (body: `{ mealIds: string[] }`)

### 3.6 Meal Parsing

Khi admin nhập text trong cell, parse theo quy tắc:
- Mỗi món phân cách bằng dấu phẩy `,`
- Trim whitespace
- Nếu món chưa tồn tại trong DB → tạo mới với type = row hiện tại (main/vegetable/dessert)
- Nếu món đã tồn tại (theo tên, ignore case) → dùng lại ID, giữ nguyên type gốc

---

## 4. Ngày lễ Page (`/admin/holidays`)

### 4.1 Layout

- **Header**: "Ngày lễ / Ngày nghỉ"
- **Toolbar**: Nút "Thêm ngày lễ" (primary button, icon: `add`)
- **Body**: Cards list (giống Employees page)

### 4.2 Card hiển thị

Mỗi card gồm:
- Ngày (format: `DD/MM/YYYY`)
- Mô tả (VD: "Ngày lễ Quốc khánh")
- Nút sửa / xóa

### 4.3 Modal thêm/sửa

- **Ngày**: date picker input
- **Mô tả**: text input
- Nút "Lưu" / "Hủy"

### 4.4 Validation

- Ngày không được trùng với ngày đã có (unique)
- Ngày không được trong quá khứ

### 4.5 API Endpoints

- `GET /api/holidays` — lấy tất cả holidays
- `POST /api/holidays` — tạo holiday mới (body: `{ date: string, description?: string }`)
- `PATCH /api/holidays/[id]` — cập nhật holiday
- `DELETE /api/holidays/[id]` — xóa holiday

---

## 5. Component Inventory

### 5.1 AdminSidebar
- Thêm 2 nav items: Thực đơn, Ngày lễ/ngày nghỉ
- Giữ nguyên các nav items hiện tại

### 5.2 MenuEditor (thực đơn page)
- State: weekDates, menus, editingCell, cellValues
- Props: none (self-contained)

### 5.3 InlineCell
- Props: `value`, `onSave`, `placeholder`
- States: display mode, edit mode

### 5.4 HolidaysPage
- Giống EmployeesPage về cấu trúc
- State: holidays, modal state, form data

### 5.5 HolidayModal
- Props: `isOpen`, `mode`, `holiday?`, `onSave`, `onClose`

---

## 6. Files cần tạo mới

- `app/admin/menu/page.tsx` — Thực đơn page
- `app/admin/holidays/page.tsx` — Ngày lễ page

---

## 7. Files cần sửa

- `app/components/sidebar/AdminSidebar.tsx` — thêm nav items

---

## 8. Out of Scope

- Không có trang quản lý Món ăn riêng (meals được tạo inline khi nhập trong cell)
- Không có drag-drop, chỉ click và nhập text
- Không có bảng/table view cho thực đơn