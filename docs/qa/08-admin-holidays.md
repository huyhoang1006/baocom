# 08 — Admin Holidays

Trang: `/admin/holidays`
API: `/api/holidays`, `/api/holidays/[id]`.

---

## HOL-01 — Xem danh sách ngày lễ

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login admin, vào `/admin/holidays` | Hiển thị bảng các ngày lễ |
| 2 | Có sort theo ngày không? | Mặc định sort ascending |
| 3 | Có filter isActive không? | |

---

## HOL-02 — Thêm ngày lễ

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Thêm ngày lễ" | Modal/form mở |
| 2 | Nhập date + description | Validation |
| 3 | Submit | API POST → 200 |
| 4 | Verify ngày lễ mới không xuất hiện trên `/book` của employee | (xem BOOK-07) |

**Validation matrix**:
| Input | Expected |
|-------|----------|
| Date rỗng | Reject |
| Date ở quá khứ xa (10 năm trước) | Cho phép hay không? |
| Date ở tương lai xa | Cho phép |
| Date trùng với holiday đã tồn tại | Reject (DB unique) |
| Description rỗng | Cho phép (optional) |
| Description 10000 ký tự | Có maxLength? |
| Date không phải ngày hợp lệ | Reject |

---

## HOL-03 — Sửa ngày lễ

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click 1 row → edit | |
| 2 | Đổi date, save | OK |
| 3 | Đổi description, save | OK |
| 4 | Đổi isActive = false | Verify không còn hiển thị như ngày lễ |

---

## HOL-04 — Xóa ngày lễ

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click xóa | Confirm |
| 2 | Confirm | API DELETE → 200 |
| 3 | Verify holiday bị xóa | |

> Cân nhắc: nên xóa cứng hay soft-delete (set isActive=false)? Nếu soft-delete thì UI cần cho "Khôi phục".

---

## HOL-05 — Holiday ảnh hưởng booking

**Loại**: Integration

| Step | Action | Expected |
|------|--------|----------|
| 1 | Add holiday cho ngày X | |
| 2 | Login employee, vào `/book` | Ngày X hiển thị là "Ngày lễ" — không cho đăng ký |
| 3 | Verify `getNextWorkday` skip ngày lễ | |

---

## HOL-06 — Holiday ở T7/CN

**Loại**: Edge case

| Step | Action | Expected |
|------|--------|----------|
| 1 | Add holiday cho 1 ngày T7 hoặc CN | Cho phép? Vì T7/CN đã bị filter rồi, holiday ở đó có ý nghĩa gì? |

---

## HOL-07 — Employee xem holidays

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | API `GET /api/holidays` từ employee cookie | Có trả về danh sách không? |
| 2 | Nếu có, employee dùng để làm gì? | (Có thể để hiển thị trên dashboard) |

---

## HOL-08 — Race condition: add + delete holiday cùng lúc

**Loại**: Edge case

| Step | Action | Expected |
|------|--------|----------|
| 1 | Mở 2 tab admin | |
| 2 | Tab 1 thêm holiday X | OK |
| 3 | Tab 2 xóa holiday X (chưa refresh) | Có bị 404 không? |

---

## Checklist ghi nhanh

```
HOL-01 □  HOL-02 □  HOL-03 □  HOL-04 □  HOL-05 □
HOL-06 □  HOL-07 □  HOL-08 □
```