# XLSX Export Format for Meal Report

## Overview

Thay thế CSV export hiện tại bằng XLSX export với format mới cho báo cáo suất ăn.

## Current State

- Endpoint `GET /api/admin/reports/export` trả về CSV
- CSV chỉ chứa danh sách nhân viên vắng mặt
- Frontend dùng `xlsx` library để export phía client

## New Format

### Structure

| Sheet | Content |
|-------|---------|
| "Báo Cáo" | Header info + bảng chi tiết |

### Header Section

```
BAOCOM LUNCH REPORT
Date Range: {startDate} - {endDate}
Generated: {timestamp}
```

### Data Table

| Column | Header | Description |
|--------|--------|-------------|
| A | STT | Số thứ tự |
| B | Họ tên | Tên nhân viên |
| C | Tổng báo cơm | Số suất đã đăng ký ăn |
| D | Báo cắt cơm | Số suất đã hủy |

### Summary Row

Dòng cuối bảng chứa tổng cộng cho mỗi cột số.

## Implementation

### Backend Changes

1. **AdminReportsController** - Thêm method `exportXlsx()` mới
2. **API Route** - Tạo endpoint mới `GET /api/admin/reports/export-xlsx`

### Data Aggregation

Query từ RegistrationService, group by userId:
- `Tổng báo cơm` = COUNT(status = 'eating' OR status = 'registered')
- `Báo cắt cơm` = COUNT(status = 'not_eating')

### XLSX Styling

- Dòng tiêu đề (row 1): Bold, nền primary color, text white
- Dòng header (row 2): Bold, nền xám nhạt
- Data rows: Normal weight
- Summary row: Bold, nền vàng nhạt
- Freeze top 2 rows
- Auto-fit column width
- Border cho cells

## Files to Modify

1. `src/controllers/AdminReportsController.ts` - Thêm exportXlsx method
2. `app/api/admin/reports/export-xlsx/route.ts` - Tạo endpoint mới
3. `src/lib/api.ts` - Thêm API function cho frontend
4. `app/admin/reports/page.tsx` - Cập nhật button export, bỏ CSV

## Rejected Options

- **Client-side XLSX generation**: Không dùng vì data aggregation nên làm ở backend để đảm bảo consistency
- **Multi-sheet**: Chỉ cần 1 sheet "Báo Cáo" là đủ
