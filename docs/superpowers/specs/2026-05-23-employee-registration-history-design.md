# Design: Xem Lịch Sử Đặt Cơm Nhân Viên

## Overview

Cho phép admin xem toàn bộ lịch sử đặt cơm/báo cơm của bất kỳ nhân viên nào từ trang Nhân Sự. Mở trang riêng để hiển thị danh sách chi tiết.

## Architecture

### Route Structure
- `/admin/employees/[id]/registrations` — Trang lịch sử đặt cơm của một nhân viên
- `GET /api/admin/employees/[id]/registrations` — API lấy lịch sử (không giới hạn ngày)

### Data Flow
1. Admin click nút "Lịch sử đặt cơm" trong modal chi tiết nhân viên
2. Navigate sang `/admin/employees/{userId}/registrations`
3. Trang gọi API lấy toàn bộ registration của nhân viên đó
4. Hiển thị bảng với ngày, trạng thái, ghi chú

## API Design

### Endpoint
```
GET /api/admin/employees/:id/registrations
```

### Response
```json
{
  "user": { "id", "name", "username" },
  "registrations": [
    {
      "id": "...",
      "date": "2026-05-20",
      "status": "eating" | "not_eating",
      "note": "...",
      "createdAt": "...",
      "overrides": [
        {
          "originalStatus": "eating",
          "newStatus": "not_eating",
          "note": "Lý do",
          "performedAt": "...",
          "performedBy": "Admin Name"
        }
      ]
    }
  ],
  "stats": {
    "total": 45,
    "eating": 38,
    "notEating": 7
  }
}
```

### Query Parameters
- `?startDate=YYYY-MM-DD` (optional)
- `?endDate=YYYY-MM-DD` (optional)

Nếu không có date params, trả về tất cả.

## Page Layout

### Header
- Nút back quay về trang Nhân Sự
- Tên nhân viên + username
- Stats tổng quan: Tổng ngày | Ăn | Không ăn

### Filter (tùy chọn)
- Date range picker: Từ ngày - Đến ngày
- Mặc định: all (không filter)

### Table
| Ngày | Trạng thái | Ghi chú | Thao tác |
|------|------------|---------|----------|
| 20/05/2026 | Ăn | - | - |
| 19/05/2026 | Không ăn | Không ăn được món này | Xem chi tiết |

- Trạng thái: badge màu xanh (ăn) / đỏ (không ăn)
- Ngày nghỉ lễ: hiển thị badge "Nghỉ lễ" thay vì trạng thái
- Sort theo ngày giảm dần (mới nhất trước)

### Empty State
"Không có lịch sử đặt cơm cho nhân viên này"

## Components

### StatsCard
3 ô stats: Tổng | Ăn | Không ăn
- Background: surface-container
- Border-radius: 12px

### RegistrationTable
- Columns: Ngày, Trạng thái, Ghi chú
- Row hover highlight
- Empty state khi không có data

### DateRangeFilter
- 2 date inputs với nút "Lọc" và "Xóa lọc"
- Optional - page hoạt động không cần filter

## Implementation

### Files to create/modify:
1. `app/api/admin/employees/[id]/registrations/route.ts` — API endpoint
2. `app/admin/employees/[id]/registrations/page.tsx` — New page
3. `src/controllers/AdminEmployeesController.ts` — Add method for employee registrations
4. `src/services/RegistrationService.ts` — Add method to get by userId without date limit
5. `src/repositories/RegistrationRepository.ts` — Add method to find by userId with overrides
6. `app/admin/employees/page.tsx` — Add "Xem lịch sử" button in detail modal

## Security
- Admin only (withAdmin middleware)
- Validate employee belongs to org (always true for single-tenant)