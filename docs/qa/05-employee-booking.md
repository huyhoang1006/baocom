# 05 — Employee Booking Flows

Mục tiêu: kiểm thử luồng đặt cơm của employee — happy path, alternative (sửa/đổi), exception (lock, weekend, holiday).

Nguồn nghiệp vụ: `BUSINESS_RULES.md > <registration_system>` + `src/lib/registrationWindow.ts`.

**Nguyên tắc cốt lõi** (BUSINESS_RULES):
- Mặc định = Ăn. Nhân viên KHÔNG cần đăng ký ăn, CHỈ báo nghỉ khi không ăn.
- Trạng thái hợp lệ: `eating | not_eating`.
- Sau cutoff (mặc định 23:00 ngày hôm trước), registration bị khóa.
- Window: chỉ trong tuần hiện tại + tối đa 4 tuần tới (`MAX_BOOKING_WEEK_OFFSET = 4`).
- Chỉ T2-T6 (weekend bị loại).
- Ngày lễ (`Holiday.isActive=true`) cũng không cho đặt.

---

## BOOK-01 — Happy path: đăng ký "Có ăn" cho ngày mai

**Loại**: Normal Flow
**Pre**: Login `nguyenvana`, hôm nay là ngày thường, trước cutoff.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/book` | Hiển thị tuần hiện tại (T2-T6), nút "Có ăn" / "Không ăn" cho từng ngày |
| 2 | Tìm ngày mai (T2 tuần sau hoặc T3-T6 tuần này) | Nút enabled |
| 3 | Click "Có ăn" | Status badge đổi sang "Ăn" hoặc hiển thị confirm |
| 4 | Refresh | Trạng thái được lưu |
| 5 | Vào `/my-history` | Có bản ghi mới |

**Assertion API**: `POST /api/registrations` với `{ date, status: 'eating' }` → 200, body có id.

---

## BOOK-02 — Đăng ký "Không ăn"

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/book` | |
| 2 | Click "Không ăn" cho 1 ngày | Status đổi sang "Nghỉ" |
| 3 | Refresh | Lưu được |
| 4 | Click "Có ăn" lại cho cùng ngày đó | Đổi được trạng thái qua lại |

---

## BOOK-03 — Click 2 nút cùng lúc (rapid click)

**Loại**: Alternative Flow (race condition UI)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Double-click "Có ăn" rồi "Không ăn" cùng ngày | UI phải disable nút khi đang submit, tránh POST trùng |
| 2 | Refresh | Chỉ có 1 registration với status cuối cùng |

> Nếu cả 2 request đều chạy → có thể tạo 2 row hoặc 409 conflict. Verify API trả về status gì.

---

## BOOK-04 — Đăng ký cho ngày hôm nay (quá khứ)

**Loại**: Exception Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Tìm ngày "Hôm nay" trên `/book` | Nút disabled hoặc hiển thị "Đã qua" |
| 2 | Click thử (nếu không disabled) | Server trả lỗi `DATE_NOT_FUTURE` |

**Xem `BUSINESS_RULES.md`**: `target <= today → reject`.

---

## BOOK-05 — Đăng ký cho T7 / CN (weekend)

**Loại**: Exception Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Kiểm tra UI có hiển thị T7/CN không | Theo `registrationWindow.ts`: chỉ trả T2-T6 (`[0,1,2,3,4].map`) |
| 2 | Nếu có hiển thị (do logic khác), click | Server reject `WEEKEND` |

---

## BOOK-06 — Sau cutoff: button disabled

**Loại**: Alternative Flow (time-based)

**Setup**:
```bash
# Option A: đợi qua cutoff thực (chỉ chạy được 23:00 VN)
# Option B: tạm thời set cutoffHour=current+1 để test nhanh
UPDATE CutoffConfig SET cutoffHour=23, cutoffMinute=59 WHERE id='global';
```

| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/book` | Ngày mai hiển thị với badge "Đã khóa" hoặc button disabled |
| 2 | Hover badge | Tooltip giải thích "Đã qua thời hạn đăng ký" |
| 3 | Click thử | Không có action, không gửi request |
| 4 | Verify POST API thủ công | `POST /api/registrations` → 4xx với reason LOCKED |

---

## BOOK-07 — Ngày lễ: không thể đăng ký

**Loại**: Alternative Flow

**Setup**: thêm holiday cho ngày mai.
```bash
POST /api/holidays { "date": "<ngày mai YYYY-MM-DD>", "description": "Test holiday" }
```

| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/book` | Ngày mai hiển thị là "Ngày lễ" với badge khác |
| 2 | Button "Có ăn"/"Không ăn" | Disabled |

> ⚠ Cần verify: code hiện có thực sự filter Holiday không? (xem `getNextWorkday` trong `registrationWindow.ts` dùng `holidays` param nhưng chưa chắc `book/page.tsx` đã pass vào). Test case này có thể tìm ra bug.

---

## BOOK-08 — Đăng ký ngoài cửa sổ 4 tuần

**Loại**: Exception Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/book` | Hiển thị tuần hiện tại, có nút "Tuần sau" |
| 2 | Click "Tuần sau" liên tiếp 4 lần | Đến tuần thứ 5 → button "Tuần sau" disabled hoặc API reject `OUTSIDE_CURRENT_WEEK` |
| 3 | Thử POST trực tiếp ngày thuộc tuần 5 | API 4xx |

---

## BOOK-09 — Xem lịch sử

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login `nguyenvana`, đăng ký vài ngày ăn/nghỉ | |
| 2 | Vào `/my-history` | Hiển thị danh sách registration sắp xếp theo ngày |
| 3 | Có filter theo trạng thái không? | Nếu có, test filter "Ăn"/"Nghỉ"/"Tất cả" |
| 4 | Phân trang | Nếu >20 records, test next/prev page |

---

## BOOK-10 — Dashboard hiển thị thông tin tóm tắt

**Loại**: Normal Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login `nguyenvana`, vào `/dashboard` | Hiển thị: tên user, số ngày đã đăng ký trong tuần, ngày tiếp theo có đăng ký, có thể có quick-link |
| 2 | Click quick-link | Navigate đến `/book` hoặc `/my-history` |
| 3 | Check responsive | Trên mobile, layout không vỡ |

---

## BOOK-11 — Concurrent edit từ 2 tab

**Loại**: Alternative Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Mở 2 tab `/book` cùng lúc | |
| 2 | Tab 1 click "Có ăn" cho ngày X | OK |
| 3 | Tab 2 click "Không ăn" cho ngày X | OK, status đổi sang not_eating |
| 4 | Refresh tab 1 | Phản ánh đúng trạng thái mới nhất |

---

## BOOK-12 — Đổi múi giờ hệ thống (timezone)

**Loại**: Edge case

Nghi vấn: `registrationWindow.ts` dùng `Asia/Ho_Chi_Minh` cố định (UTC+7). Nếu máy user ở timezone khác có ảnh hưởng?

| Step | Action | Expected |
|------|--------|----------|
| 1 | Mở DevTools → Application → Service Workers (không có) → kiểm tra cách tính ngày | Phía server: dùng `Date.now()` local Node, có thể lệch nếu server timezone không phải Asia/Ho_Chi_Minh |
| 2 | Set OS timezone sang UTC, refresh | Date key hiển thị có đúng ngày VN không? |
| 3 | Browser DevTools → Sensors → Location → Singapore | UI có đổi không? (Không nên — phải cố định VN) |

---

## BOOK-13 — Ký tự đặc biệt trong note

**Loại**: Alternative Flow

Một số registration API có trường `note`. Nếu UI cho phép nhập:

| Input | Expected |
|-------|----------|
| `Ghi chú bình thường` | OK |
| `<script>alert(1)</script>` | Không XSS — hiển thị nguyên văn hoặc escape |
| Emoji 🍱 | Hiển thị đúng |
| 5000 ký tự | Có maxLength không? |
| `   nhiều space   ` | Trim đầu cuối |

---

## BOOK-14 — Empty state

**Loại**: Edge case

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login employee mới (chưa đăng ký gì), vào `/book` | UI có empty state rõ ràng — ví dụ "Bạn chưa đăng ký ngày nào trong tuần này" |
| 2 | Vào `/my-history` | Empty state tương tự |

---

## BOOK-15 — Network failure khi đang đăng ký

**Loại**: Exception Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Mở DevTools → Network → Offline | |
| 2 | Click "Có ăn" | Hiển thị lỗi "Không thể kết nối", KHÔNG crash, button enabled lại |
| 3 | Online lại, click "Có ăn" | Thành công |

---

## BOOK-16 — Rate-limit / Spam click

**Loại**: Security

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click 20 lần "Có ăn"/"Không ăn" liên tục trong 5 giây | Có rate-limit chưa? (xem `RATE_LIMIT_BYPASS=true` đã bypass chưa) |
| 2 | Nếu không bypass | Phải nhận 429 sau N request |

---

## Checklist ghi nhanh

```
BOOK-01 □  BOOK-02 □  BOOK-03 □  BOOK-04 □  BOOK-05 □
BOOK-06 □  BOOK-07 □  BOOK-08 □  BOOK-09 □  BOOK-10 □
BOOK-11 □  BOOK-12 □  BOOK-13 □  BOOK-14 □  BOOK-15 □
BOOK-16 □
```