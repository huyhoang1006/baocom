# 09 — Admin Reports

Trang: `/admin/reports`, `/admin/dashboard`
API: `/api/admin/reports`, `/api/admin/reports/export` (CSV), `/api/admin/reports/export-xlsx` (XLSX), `/api/admin/stats`, `/api/admin/stats/date/[date]`.

---

## RPT-01 — Xem báo cáo theo ngày

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login admin, vào `/admin/reports` | Mặc định chọn "Ngày" |
| 2 | Chọn ngày hôm nay | |
| 3 | Click "Xem trước" | Hiển thị bảng: từng nhân viên × status (eating/not_eating/no-data) |
| 4 | Verify số liệu | Tổng eating + not_eating = tổng active employees (trừ ngày lễ) |

---

## RPT-02 — Xem báo cáo theo tuần

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Tuần" | |
| 2 | Chọn tuần | |
| 3 | Click "Xem trước" | Bảng: nhân viên × từng ngày T2-T6 |
| 4 | Có thống kê tổng cuối bảng? | |

---

## RPT-03 — Xem báo cáo theo tháng

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Tháng" | |
| 2 | Chọn tháng | |
| 3 | Click "Xem trước" | Bảng tháng |

---

## RPT-04 — Export CSV

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Xuất CSV" | Browser trigger download file .csv |
| 2 | Mở file CSV | Đúng encoding UTF-8 (có BOM để hiển thị tiếng Việt) |
| 3 | Verify cột | đủ cột như preview |
| 4 | Filter Excel/Google Sheets mở được | Tiếng Việt hiển thị đúng |

**Edge**:
- File tên có chứa ngày tháng: `report-YYYY-MM-DD.csv` chẳng hạn?
- File rỗng (không có data) — content-length=0?

---

## RPT-05 — Export XLSX

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Xuất Excel" | Download file .xlsx |
| 2 | Mở bằng Excel/LibreOffice | Format đẹp, có header bold? |
| 3 | Tiếng Việt | Hiển thị đúng |

**Edge**:
- Có nhiều sheet không?
- Có chart/pivot không?
- File lớn (>10MB) — download timeout?

---

## RPT-06 — Filter theo phòng ban

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Có dropdown filter department? | |
| 2 | Chọn 1 phòng | Chỉ hiển thị user phòng đó |

---

## RPT-07 — Filter theo trạng thái

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Filter "Ăn" / "Nghỉ" / "Chưa đăng ký" | Đúng |

---

## RPT-08 — Dashboard stats

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/admin/dashboard` | Hiển thị số liệu hôm nay: tổng eating, tổng not_eating, tổng chưa đăng ký |
| 2 | Có date picker để chọn ngày khác? | (xem E2E_TEST_SPEC locator) |
| 3 | Click "Hôm nay" | Reset về hôm nay |
| 4 | Có chart không? | |

---

## RPT-09 — Empty report (ngày không có data)

**Loại**: Edge case

| Step | Action | Expected |
|------|--------|----------|
| 1 | Chọn ngày lễ không có ai đăng ký | Hiển thị bảng trống với thông báo rõ ràng |

---

## RPT-10 — Data mismatch giữa UI và export

**Loại**: Validation

| Step | Action | Expected |
|------|--------|----------|
| 1 | Xem preview, đếm số dòng | |
| 2 | Export CSV, đếm số dòng (trừ header) | Phải khớp |
| 3 | Export XLSX, đếm | Phải khớp |

---

## RPT-11 — Performance với data lớn

**Loại**: Performance

| Step | Action | Expected |
|------|--------|----------|
| 1 | Chọn tháng có nhiều ngày + nhiều user | Render < 3s |
| 2 | Export Excel | < 10s |

---

## RPT-12 — Quyền truy cập

**Loại**: Security

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login employee, vào `/admin/reports` | Redirect |
| 2 | Gọi `GET /api/admin/reports/export` không có admin cookie | 403/401 |

---

## RPT-13 — SQL injection qua filter

**Loại**: Security

| Step | Action | Expected |
|------|--------|----------|
| 1 | Nhập date = `2026-06-01' OR '1'='1` | Reject hoặc escape |
| 2 | Nhập departmentId = `'; DROP TABLE--` | Reject |

---

## Checklist ghi nhanh

```
RPT-01 □  RPT-02 □  RPT-03 □  RPT-04 □  RPT-05 □
RPT-06 □  RPT-07 □  RPT-08 □  RPT-09 □  RPT-10 □
RPT-11 □  RPT-12 □  RPT-13 □
```