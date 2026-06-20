# 15 — Bug Report Template

Dùng template này cho MỖI bug phát hiện. Lưu file vào `evidence/BUG-NNN-<slug>.md`.

---

```markdown
# BUG-NNN: <Tiêu đề ngắn gọn, mô tả bản chất>

**Severity**: Critical | High | Medium | Low
**Category**: Functional | Visual | Accessibility | Console | Security | UX | Content | Performance
**Module**: <auth | booking | menu | employees | holidays | reports | settings | api | global>
**Test case ID**: <VD: AUTH-03, BOOK-07, API-12>
**Reported by**: dogfood agent
**Date**: <YYYY-MM-DD HH:MM>
**Status**: Open | Fixed | Won't Fix | Duplicate

## URL / Endpoint
- Page: `http://127.0.0.1:3000/<path>`
- API: `POST /api/<endpoint>` (nếu có)
- File code: `app/.../page.tsx:L<line>` (nếu xác định được)

## Environment
- Browser: Chromium via Hermes
- NODE_ENV: development
- User role: <admin | employee | anonymous>
- Date/time when reproduced: <YYYY-MM-DD HH:MM ICT>

## Steps to Reproduce
1. <Step 1>
2. <Step 2>
3. <Step 3>
4. Quan sát kết quả.

## Expected Behavior
<Mô tả hành vi đúng theo BUSINESS_RULES.md hoặc common sense>

## Actual Behavior
<Mô tả hành vi sai quan sát được>

## Evidence
- Screenshot: ![](<absolute-path>)
- Console log:
  ```
  <paste console errors>
  ```
- Network log:
  ```
  <paste relevant request/response>
  ```

## Impact
<Tác động: ai bị ảnh hưởng, scope, hậu quả nếu không fix>

## Suggested Fix
<Gợi ý cách sửa — không bắt buộc nhưng giúp dev tiết kiệm thời gian>

## Related
- Liên quan issue #X
- Liên quan bug BUG-NNN khác
```

---

## Severity rubric

| Severity | Định nghĩa | Ví dụ |
|----------|-----------|-------|
| Critical | App crash, mất dữ liệu, security breach (auth bypass, SQL injection hoàn chỉnh), toàn bộ user không dùng được | Login không hoạt động, admin có thể xoá toàn bộ DB |
| High | Chức năng chính sai, security leak vừa phải, ảnh hưởng >50% user flow | Đăng ký cơm không lưu, employee xem được data user khác |
| Medium | Chức năng phụ sai, UX kém, validation thiếu ở edge case | Validation thiếu với input có ký tự đặc biệt, empty state xấu |
| Low | Cosmetic, typo, warning lặt vặt | Sai chính tả, spacing không đều |

---

## Category rubric

- **Functional**: behavior sai so với spec.
- **Visual**: layout, color, spacing, font.
- **Accessibility**: keyboard, screen reader, contrast, ARIA.
- **Console**: JS error, network error không mong đợi.
- **Security**: auth, authz, XSS, CSRF, IDOR, SQLi.
- **UX**: flow khó hiểu, error message mơ hồ, missing confirm.
- **Content**: typo, sai chính tả, text sai ngữ cảnh.
- **Performance**: load chậm, render lag, memory leak.

---

## Ví dụ bug hoàn chỉnh

```markdown
# BUG-001: Route /employees không được middleware bảo vệ

**Severity**: High
**Category**: Security
**Module**: auth
**Test case ID**: SEC-13
**Reported by**: dogfood agent
**Date**: 2026-06-20 14:32
**Status**: Open

## URL / Endpoint
- Page: `http://127.0.0.1:3000/employees`
- File code: `middleware.ts:L31` (matcher chỉ bắt `/admin/:path*`)

## Environment
- Browser: Chromium via Hermes
- NODE_ENV: development
- User role: anonymous

## Steps to Reproduce
1. Mở browser ẩn dan, truy cập `http://127.0.0.1:3000/employees`
2. Quan sát

## Expected Behavior
Redirect về `/login` vì đây là admin-only route.

## Actual Behavior
Trang `/employees` hiển thị bình thường (hoặc có thể là trang login, cần verify) mà không có auth check. Nếu user paste cookie admin cũ vào, có thể truy cập thẳng.

## Evidence
- Screenshot: ![](C:/Users/ADMIN/AppData/Local/hermes/dogfood-output/screenshots/BUG-001.png)
- Console log: không có

## Impact
Employee (hoặc anonymous) có thể truy cập trang quản lý nhân sự nếu đoán được URL.

## Suggested Fix
Đổi matcher middleware thành bao gồm cả `/employees` và các admin route khác không dưới `/admin/`. Tốt nhất: gom tất cả admin route dưới `/admin/`.

## Related
- SEC-13
```

---

## Checklist ghi nhanh

Khi ghi 1 bug, đảm bảo có đủ:
- [ ] Severity (1 trong 4)
- [ ] Category (1 trong 8)
- [ ] URL + steps
- [ ] Expected vs Actual
- [ ] Screenshot path
- [ ] Impact
```