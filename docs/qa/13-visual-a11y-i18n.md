# 13 — Visual, Accessibility & i18n

Mục tiêu: kiểm tra chất lượng hiển thị, khả năng tiếp cận (accessibility), và tính nhất quán tiếng Việt.

---

## VIS-01 — Layout tổng thể

| Trang | Check |
|-------|-------|
| `/login` | Center form, background gradient, không tràn |
| `/dashboard` (emp) | Sidebar trái + content phải |
| `/book` | Grid 5 ngày T2-T6 (responsive 1 col trên mobile) |
| `/admin/dashboard` | Date picker + stats cards |
| `/admin/menu` | Grid theo tuần |
| `/admin/reports` | Table với horizontal scroll nếu nhiều cột |
| `/admin/employees` | Table với pagination |
| `/admin/settings` | Form đơn giản |

---

## VIS-02 — Responsive breakpoints

Dùng DevTools → toggle device toolbar.

| Width | Test |
|-------|------|
| 320px (mobile S) | Sidebar có collapse thành hamburger? |
| 375px (mobile M) | |
| 768px (tablet) | Grid có 2 cols? |
| 1024px (desktop S) | |
| 1440px (desktop L) | Container có max-width? |
| 1920px (4K) | Không bị kéo dãn quá |

---

## VIS-03 — Color & contrast

- Primary: xanh (xem `tailwind.config` / `globals.css`)
- Background: gradient nhẹ
- Text contrast ratio ≥ 4.5:1 (WCAG AA)
- Error state: đỏ rõ
- Success state: xanh lá rõ

Dùng browser extension như axe DevTools hoặc Lighthouse để audit.

---

## VIS-04 — Typography

- Font chính: Inter + Be Vietnam Pro (xem `app/layout.tsx`)
- Font size hierarchy: H1 > H2 > body > caption rõ ràng
- Line-height thoáng, không dồn chữ
- Tiếng Việt có dấu render đúng (Be Vietnam Pro cover diacritics)

---

## VIS-05 — Icons

- Dùng Material Symbols Outlined (xem layout)
- Icon có label ẩn cho screen reader không?
- Icon-alone button có aria-label không? (xem a11y section)

---

## VIS-06 — Empty states

| Trang empty | Test |
|-------------|------|
| `/book` chưa đăng ký gì | Có illustration/text hướng dẫn |
| `/my-history` rỗng | |
| `/admin/reports` ngày không data | |
| `/admin/employees` filter rỗng | |

---

## VIS-07 — Loading states

- Click button → có spinner / disabled state?
- Page transition → có skeleton?
- Long-running API (export) → có loading indicator?

---

## VIS-08 — Error states

- Network failure → có toast / alert?
- 500 error → có trang lỗi thân thiện (không crash trắng)?
- Form validation → inline error ngay dưới field?

---

## A11Y-01 — Keyboard navigation

Test KHÔNG dùng chuột, chỉ dùng Tab / Shift+Tab / Enter / Esc / Arrow.

| Trang | Test |
|-------|------|
| `/login` | Tab qua username → password → button → Enter submit |
| `/book` | Tab qua từng nút "Có ăn"/"Không ăn", Enter chọn |
| `/admin/menu` | Tab qua dropdown, dùng arrow để chọn meal |
| Modal (nếu có) | Esc đóng, focus trap bên trong |

---

## A11Y-02 — Focus ring

- Focus ring hiển thị rõ (không `outline: none` không thay thế).
- Không mất focus khi re-render.

---

## A11Y-03 — ARIA labels

- Icon-only button có aria-label?
- Input có label (không chỉ placeholder)?
- Table có caption hoặc aria-label?
- Navigation landmark: `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`?

---

## A11Y-04 — Form accessibility

- Mỗi `<input>` có `<label for="...">` hoặc aria-labelledby.
- Error message có aria-describedby.
- Required field có aria-required.

---

## A11Y-05 — Screen reader (sanity)

Dùng ChromeVox (extension) hoặc NVDA (Windows):
- Trang `/login` đọc rõ username/password labels.
- Bảng `/admin/reports` đọc được headers + rows.
- Modal focus trap hoạt động.

---

## A11Y-06 — Color-only information

- Status badge "Ăn"/"Nghỉ" có khác màu + có text/icon?
- Không phụ thuộc vào màu đơn thuần để truyền tải thông tin.

---

## A11Y-07 — Lighthouse audit

Chạy Lighthouse:
- Accessibility ≥ 90
- Best Practices ≥ 90
- SEO ≥ 90
- Performance (optional)

---

## I18N-01 — Tiếng Việt đầy đủ

Mọi text user-facing phải là tiếng Việt, không lẫn Anh (trừ thuật ngữ kỹ thuật).

Tìm các từ tiếng Anh còn sót: Submit, Save, Cancel, Error, Loading...

---

## I18N-02 — Encoding

- UTF-8 với BOM cho CSV export (Excel mở đúng tiếng Việt).
- Content-Type header có `charset=utf-8`.

---

## I18N-03 — Date/Number format

- Ngày: DD/MM/YYYY (Việt Nam) hay MM/DD/YYYY?
- Verify cùng 1 ngày hiển thị giống nhau ở mọi trang.

```bash
# So sánh date format ở:
# - /book
# - /my-history
# - /admin/dashboard
# - /admin/reports
```

---

## I18N-04 — Lang attribute

```html
<html lang="vi">
```

Verify trong `<head>` (xem `app/layout.tsx`).

---

## I18N-05 — Currency / Number (nếu có)

Nếu có hiển thị số tiền: dùng `Intl.NumberFormat('vi-VN')`.

---

## I18N-06 — Số nhiều / đếm

"Ngày đã đăng ký: 1 ngày" hay "Ngày đã đăng ký: 1"?

---

## Checklist ghi nhanh

```
VIS-01 □  VIS-02 □  VIS-03 □  VIS-04 □  VIS-05 □
VIS-06 □  VIS-07 □  VIS-08 □
A11Y-01 □ A11Y-02 □ A11Y-03 □ A11Y-04 □ A11Y-05 □ A11Y-06 □ A11Y-07 □
I18N-01 □ I18N-02 □ I18N-03 □ I18N-04 □ I18N-05 □ I18N-06 □
```