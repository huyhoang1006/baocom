# BUG-006: /api/admin/reports/export trả XLSX thay vì CSV (sai Content-Type vs URL)

**Severity**: High
**Category**: Functional, API Contract
**Module**: reports, api
**Test case ID**: RPT-04, API-18
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open

## URL / Endpoint
- API: `GET http://127.0.0.1:3000/api/admin/reports/export?startDate=...&endDate=...`

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- User role: admin
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
1. Login admin
2. Gọi export:
   ```bash
   curl -O -J "http://127.0.0.1:3000/api/admin/reports/export?startDate=2026-06-22&endDate=2026-06-22" \
     -H "Cookie: token=<admin>"
   ```
3. Kiểm tra `Content-Type` header

## Expected Behavior
- URL `/api/admin/reports/export` gợi ý CSV export (theo tên route và theo E2E_TEST_SPEC)
- Content-Type: `text/csv; charset=utf-8`
- File extension: `.csv`

## Actual Behavior
- HTTP 200 OK
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX!)
- File extension thực tế: `.xlsx`
- Cả `/api/admin/reports/export` VÀ `/api/admin/reports/export-xlsx` đều trả XLSX (cùng response 7316 bytes)

## Evidence
```
GET /api/admin/reports/export?startDate=2026-06-22&endDate=2026-06-22:
    HTTP 200 CT=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet size=7316
    First 100 bytes: PK 003 004 ...   (XLSX magic bytes)
```

```
GET /api/admin/reports/export-xlsx?startDate=2026-06-22&endDate=2026-06-22:
    HTTP 200 CT=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet size=7316
    (same content!)
```

## Impact
- API contract không nhất quán — clients dựa vào URL `/export` expect CSV nhưng nhận XLSX.
- Nếu Excel/Google Sheets user tải `.xlsx` và save lại, format có thể khác.
- E2E test (`E2E_TEST_SPEC.md`) định nghĩa `Xuất CSV` button nhưng backend không có endpoint CSV thực sự.

## Root Cause
- `app/api/admin/reports/export/route.ts:14` gọi `controller.exportXlsx(req)` thay vì `exportCsv`.
- Hoặc: route `/export` nên được đổi tên thành `/export-xlsx` để khớp với implementation.

## Suggested Fix
Option A: Đổi URL `/export` → `/export-xlsx` (xóa duplicate), tạo route mới `/export-csv` cho CSV.

Option B: Sửa `/export` để gọi đúng `exportCsv` controller, giữ `/export-xlsx` cho XLSX.

## File reference
- `app/api/admin/reports/export/route.ts:14` (calls exportXlsx)
- `app/api/admin/reports/export-xlsx/route.ts` (duplicate)