# Thiết kế: Admin Dashboard — Luôn hiển thị "Ngày mai", bỏ filter

## 1. Mục tiêu
- Admin Dashboard `/admin/dashboard` luôn mặc định hiển thị dữ liệu của **"ngày mai"** (next workday)
- Bỏ hoàn toàn date picker / date filter
- Bỏ nút "Hôm nay"
- Tự động tạo record mặc định "eating" cho ngày mai nếu chưa có

## 2. Tính "Ngày mai"

### Logic
```
"Today" = hôm nay theo Asia/Ho_Chi_Minh
"Tomorrow" = ngày tiếp theo trong tuần làm việc (T2-T6)
```

### Quy tắc
| Hôm nay | "Ngày mai" |
|---------|------------|
| T2-T5   | Ngày tiếp theo (T3-T6) |
| T6      | Thứ 2 tuần sau |
| T7      | Thứ 2 tuần sau |
| CN      | Thứ 2 tuần sau |

### Xử lý ngày lễ
- Nếu "ngày mai" là ngày lễ (trong bảng `Holiday`) → nhảy sang ngày làm việc tiếp theo
- Cứ tiếp tục kiểm tra cho đến khi tìm được ngày T2-T6 không phải ngày lễ

### Chưa có dữ liệu
- Nếu ngày mai chưa có `DailyMenu` hoặc `Registration` → hệ thống tự tạo record mặc định:
  - `status = "eating"` cho tất cả employees (đăng ký mặc định ăn)
  - `isDefault = true`

## 3. Thay đổi UI

### Header
```
Dashboard — Ngày mai: Thứ 6, 23/05
```

### Layout Desktop
```
┌──────────────────────────────────────┐
│  Dashboard — Ngày mai: Thứ 6, 23/05  │
│  [Ngày mai là ngày làm việc]         │
├────────────────┬─────────────────────┤
│  Stats Cards   │  Absences Table     │
│  Tổng | Ăn     │  Danh sách nghỉ     │
│  Nghỉ | Chưa   │                     │
└────────────────┴─────────────────────┘
```

### Layout Mobile
```
┌─────────────────────┐
│ Dashboard — Ngày   │
│ mai: Thứ 6, 23/05  │
├─────────────────────┤
│ Stats (stacked)     │
├─────────────────────┤
│ Absences Table     │
└─────────────────────┘
```

### KHÔNG CÓ
- ❌ Date picker input
- ❌ Nút "Hôm nay"
- ❌ Week navigation (← Tuần trước / Tuần sau →)

## 4. Thay đổi code

### 4.1 `src/lib/registrationWindow.ts` — Thêm hàm `getNextWorkday`
```ts
export function getNextWorkday(fromDate: Date): Date {
  // Trả về ngày làm việc tiếp theo (T2-T6), bỏ qua T7/CN và ngày lễ
  // fromDate: ngày bắt đầu tính (không tính chính nó)
}
```

### 4.2 `src/lib/registrationWindow.ts` — Thêm hàm `isHoliday`
```ts
export function isHoliday(date: Date): boolean {
  // Check date against Holiday table or a hardcoded list
}
```

### 4.3 `app/admin/dashboard/page.tsx`
- Xóa `selectedDate` state và date picker
- Xóa nút "Hôm nay"
- Default date = `getNextWorkday(today)` thay vì `getNextLockedDay`
- Header hiển thị "Ngày mai: [Tên ngày], DD/MM"
- Nếu chưa có dữ liệu → tự động seed defaults

### 4.4 `src/services/RegistrationService.ts` — Thêm method `ensureDefaultRegistrations`
```ts
async ensureDefaultRegistrations(date: Date): Promise<void> {
  // Tạo Registration record mặc định (eating) cho tất cả employee
  // chưa có đăng ký cho ngày đó
}
```

## 5. Không thay đổi
- `/book` employee page — không đụng gì
- `/admin/reports` — giữ nguyên date filter (báo cáo cần chọn ngày)
- Các hàm `isWeekend()`, `getWeekdaysForOffset()` — giữ nguyên

## 6. Test checklist
- [ ] Hôm nay T2-T5 → dashboard hiển thị ngày tiếp theo
- [ ] Hôm nay T6 → dashboard hiển thị Thứ 2 tuần sau
- [ ] Hôm nay T7/CN → dashboard hiển thị Thứ 2 tuần sau
- [ ] "Ngày mai" là ngày lễ → tự động nhảy sang ngày tiếp theo
- [ ] Không có date picker trên UI
- [ ] Không có nút "Hôm nay"
- [ ] Header hiển thị đúng format "Dashboard — Ngày mai: Thứ X, DD/MM"
- [ ] Chưa có dữ liệu → tự tạo record mặc định "eating"
- [ ] /book và /my-history không bị ảnh hưởng