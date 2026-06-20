# 10 — Admin Settings (Cutoff Config)

Trang: `/admin/settings`
API: `/api/settings/cutoff`.

---

## SET-01 — Xem cutoff hiện tại

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login admin, vào `/admin/settings` | Hiển thị: Cutoff hour, Cutoff minute, Updated at, Updated by |
| 2 | Verify giá trị hiện tại | Khớp với DB |

---

## SET-02 — Đổi cutoff hour/minute

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Đổi hour = 18, minute = 30 | |
| 2 | Save | API POST → 200 |
| 3 | Refresh | Giá trị mới hiển thị |
| 4 | Vào `/book` (employee khác) | Lock state cập nhật đúng theo cutoff mới |

**Edge**:
- Đổi cutoff nhỏ hơn giờ hiện tại → registration ngày mai bị lock ngay?
- Đổi cutoff lớn (30h) → reject?

---

## SET-03 — Validation input

**Loại**: Exception Flow

| Input | Expected |
|-------|----------|
| Hour = -1 | Reject |
| Hour = 24 | Reject (chỉ 0-23) |
| Hour = "abc" | Reject (phải number) |
| Minute = -1 | Reject |
| Minute = 60 | Reject (chỉ 0-59) |
| Empty hour | Reject |

---

## SET-04 — Audit trail

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Sau khi save, có hiển thị "Updated by admin at 2026-06-20 14:30"? | |
| 2 | Có log vào bảng AuditLog không? | (verify qua DB) |

---

## SET-05 — Concurrency

**Loại**: Edge case

| Step | Action | Expected |
|------|--------|----------|
| 1 | Mở 2 tab admin `/admin/settings` | |
| 2 | Tab 1 save với hour=18 | OK |
| 3 | Tab 2 save với hour=20 (không refresh) | Last write wins? Hay 409? |

---

## SET-06 — Employee không thể truy cập

**Loại**: Security

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login employee, vào `/admin/settings` | Redirect |
| 2 | API `POST /api/settings/cutoff` không có admin cookie | 403 |

---

## SET-07 — Effect trên booking page

**Loại**: Integration

| Step | Action | Expected |
|------|--------|----------|
| 1 | Đặt cutoff = 23:00 | Booking ngày mai OK |
| 2 | Đổi cutoff = 23:59 | Vẫn OK |
| 3 | Đổi cutoff = 00:00 | Ngày mai bị lock ngay (vì cutoff ngày hôm trước = 00:00 đã qua) |
| 4 | Đổi cutoff = 23:59 lại | Hết lock |

---

## SET-08 — Timezone effect

**Loại**: Edge case

Nghi vấn: nếu server timezone không phải Asia/Ho_Chi_Minh thì `getCutoffAt` có chính xác không?

| Step | Action | Expected |
|------|--------|----------|
| 1 | Xem code `getCutoffAt` | Dùng local server time hay chuyển về UTC? |
| 2 | Nếu server chạy UTC, set cutoff=23:00 | Lock xảy ra lúc 16:00 UTC (= 23:00 ICT) — phải test để confirm |

---

## Checklist ghi nhanh

```
SET-01 □  SET-02 □  SET-03 □  SET-04 □  SET-05 □
SET-06 □  SET-07 □  SET-08 □
```