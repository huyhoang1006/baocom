# Design: CRUD Món Ăn Trong Thực Đơn Ngày

**Ngày:** 2026-05-22
**Trạng thái:** Approved

## Tổng quan

Cho phép admin **sửa** và **xóa** món ăn trong thực đơn từng ngày từ trang `/admin/menu`.

- **Sửa**: Cập nhật tên/loại món trong DB → ảnh hưởng mọi thực đơn dùng món này
- **Xóa**: Chỉ gỡ món khỏi thực đơn ngày cụ thể → món vẫn tồn tại trong DB

---

## API

### 1. Sửa món (đã có)

```
PATCH /api/meals/:id
Body: { name?: string, type?: string }
Response: { meal: { id, name, type, isActive } }
```

### 2. Xóa món khỏi ngày (MỚI)

```
DELETE /api/daily-menus/:date/meals/:mealId
Response:
- 200: { success: true }
- 404: { error: "Not found" }
- 500: { error: "..." }
```

---

## UI Components

### Meal Badge với Menu

```
┌─────────────────────────────────┐
│ 🍖 Thịt kho trứng          ⋮    │
└─────────────────────────────────┘
```

- Badge hiển thị tên món + icon loại
- Nút ⋮ (3 chấm) ở cuối badge
- Tap ⋮ → hiện popover menu

### Popover Menu

```
┌──────────────┐
│ ✏️ Sửa tên  │  ← min-height: 44px, touch-friendly
├──────────────┤
│ 🗑️ Xóa      │
└──────────────┘
```

- Hiện ngay dưới badge vừa tap
- Tap ra ngoài → đóng menu

### Modal Sửa

```
┌─────────────────────────────────┐
│           Sửa tên món            │
├─────────────────────────────────┤
│                                   │
│  [Thịt kho trứng____________]   │  ← Input tên
│                                   │
│  Loại: [Món chính ▼]            │  ← Select loại
│                                   │
│  [        Hủy        ]           │
│  [        Lưu        ]           │
└─────────────────────────────────┘
```

- Modal centered trên màn hình
- Input tên món (pre-fill với tên hiện tại)
- Select loại: Món chính / Món rau / Tráng miệng
- Nút Hủy (secondary) và Lưu (primary)

### Confirm Xóa

```
┌─────────────────────────────────┐
│        Xác nhận xóa             │
├─────────────────────────────────┤
│                                   │
│  Xóa "Thịt kho trứng" khỏi      │
│  thực đơn ngày này?             │
│  (Món vẫn còn trong hệ thống)   │
│                                   │
│  [        Hủy        ]           │
│  [        Xóa        ]           │
└─────────────────────────────────┘
```

---

## Luồng Hoạt Động

### Flow Sửa

```
Tap ⋮ → Chọn "Sửa tên"
           ↓
     Modal sửa hiện ra
           ↓
   Đổi tên / đổi loại
           ↓
      [Lưu]
           ↓
   PATCH /api/meals/:id
           ↓
   Cập nhật cellValues
           ↓
   Hiện notification "Đã cập nhật"
```

### Flow Xóa

```
Tap ⋮ → Chọn "Xóa"
           ↓
     Confirm dialog hiện ra
           ↓
      [Xóa]
           ↓
   DELETE /api/daily-menus/:date/meals/:mealId
           ↓
   Cập nhật cellValues
           ↓
   Hiện notification "Đã xóa"
```

---

## Data Flow

```typescript
// State: cellValues[dateKey][type] = string[]
// Ví dụ: cellValues["2024-05-20"]["main"] = ["Thịt kho trứng", "Thịt bò"]

// Sửa món
await PATCH /api/meals/:id → { name, type }
→ Cập nhật tên trong cellValues

// Xóa món khỏi ngày
await DELETE /api/daily-menus/:date/meals/:mealId
→ Xóa tên khỏi cellValues[dateKey][type]
```

---

## File Cần Thay Đổi

| File | Thay đổi |
|------|----------|
| `app/api/daily-menus/[date]/meals/[mealId]/route.ts` | **MỚI** - API xóa món khỏi ngày |
| `src/controllers/DailyMenusController.ts` | Thêm method xóa món |
| `src/services/DailyMenuService.ts` | Thêm method xóa món |
| `src/repositories/DailyMenuMealRepository.ts` | Thêm method xóa |
| `src/lib/api.ts` | Thêm `mealsApi.deleteFromDate(date, mealId)` |
| `app/admin/menu/page.tsx` | Thêm UI menu, modal sửa, confirm xóa, logic |

---

## Edge Cases

- Xóa món cuối cùng của 1 loại → Hiện "Chưa có món nào" (placeholder)
- Sửa tên trùng với món đã có → Vẫn cho phép (mỗi món là entity riêng)
- Xóa thất bại → Hiện lỗi, giữ nguyên state, không đóng menu
- API thất bại → Toast lỗi, retry option

---

## Dependencies

- `MealService.update()` - đã có
- `DailyMenuMealRepository.delete()` - cần thêm
- API `DELETE /daily-menus/:date/meals/:mealId` - cần tạo mới