# Thiết kế: Trang /book — Layout 5 ngày (T2-T6), Mobile-first

## 1. Mục tiêu
- Trang `/book` của nhân viên chỉ hiển thị **5 ngày làm việc (T2 → T6)**
- Ẩn hoàn toàn T7 và CN khỏi UI
- Xóa toàn bộ registration data cũ trong DB
- Reset và seed lại DB với dữ liệu sạch (chỉ T2-T6)

## 2. Layout

### Desktop (≥768px)
```
┌───────────┬───────────┬───────────┬───────────┬───────────┐
│    T2     │    T3     │    T4     │    T5     │    T6     │
│  [card]   │  [card]   │  [card]   │  [card]   │  [card]   │
└───────────┴───────────┴───────────┴───────────┴───────────┘
```
- Grid 5 cột bằng nhau
- Mỗi card chiếm equal width

### Mobile (<768px) — 2 + 3 grid
```
┌───────────┬───────────┐
│    T2     │    T3     │
│  [card]   │  [card]   │
├───────────┼───────────┤
│    T4     │    T5     │    T6     │
│  [card]   │  [card]   │  [card]   │
└───────────────────────────┘
```
- Row 1: T2, T3 (2 cột)
- Row 2: T4, T5, T6 (3 cột)

## 3. Thay đổi code

### 3.1 `src/lib/registrationWindow.ts`
- Sửa `getWeekdaysForOffset` — filter bỏ `dayOfWeek === 0 || dayOfWeek === 6`
- Chỉ trả về 5 ngày T2-T6
- `isWeekend()` và `isWorkday()` giữ nguyên (dùng cho `/my-history`)

### 3.2 `app/(employee)/book/page.tsx`
- Xóa logic `opacity-50` và `disabled` cho `!day.isWorkday`
- Grid layout đổi thành responsive 5 cột (desktop) / 2+3 grid (mobile)
- Các ngày trong tuần vẫn navigate bằng `weekOffset` (prev/next week)

### 3.3 Database
- Xóa toàn bộ `Registration`, `RegistrationOverride`, `DailyMenu`, `DailyMenuMeal`, `Holiday`
- Re-seed: tạo lại users, meals, và weekly menus cho tuần hiện tại (T2-T6)

## 4. Không thay đổi
- Trang `/my-history` — vẫn hiển thị đầy đủ 7 ngày
- Các hàm `isWeekend()`, `isWorkday()` trong `registrationWindow.ts`
- Logic API registration (GET/POST) — vẫn nhận data T7/CN nếu có (backward compatible)

## 5. Test checklist
- [ ] `/book` hiển thị đúng 5 ngày T2-T6
- [ ] Layout mobile: row 1 có 2 card, row 2 có 3 card
- [ ] Layout desktop: 5 cột bằng nhau
- [ ] Prev/Next week navigate đúng 5 ngày
- [ ] Registration hoạt động bình thường
- [ ] `/my-history` không bị ảnh hưởng
