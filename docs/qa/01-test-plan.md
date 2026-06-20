# 01 — Test Plan

## 1. Mục tiêu

Kiểm thử thăm dò (exploratory) toàn bộ web **baocom** bằng skill `dogfood`:
- Phát hiện bug hành vi, bug UI, bug logic nghiệp vụ.
- Đảm bảo happy path + alternative + exception flow đều hoạt động đúng theo `BUSINESS_RULES.md`.
- Tạo evidence (screenshot + console log) cho từng phát hiện.
- Sinh báo cáo cuối ở `reports/`.

## 2. Phạm vi (in-scope)

### Module
| Module | Trang | Quyền | File checklist |
|--------|-------|-------|----------------|
| Public landing | `/` | anonymous | 04 |
| Auth | `/login`, `/logout` | anonymous | 04 |
| Employee — Dashboard | `/dashboard` | employee | 05 |
| Employee — Book | `/book` | employee | 05 |
| Employee — History | `/my-history` | employee | 05 |
| Admin — Dashboard | `/admin/dashboard` | admin | 06,09 |
| Admin — Menu | `/admin/menu` | admin | 06 |
| Admin — Employees | `/admin/employees`, `/admin/employees/[id]/registrations` | admin | 07 |
| Admin — Departments | `/admin/departments` | admin | 07 |
| Admin — Holidays | `/admin/holidays` | admin | 08 |
| Admin — Reports | `/admin/reports` | admin | 09 |
| Admin — Settings | `/admin/settings` | admin | 10 |
| API | `/api/**` | mixed | 11 |
| Cross-cutting | security, a11y, i18n | — | 12, 13 |

### Out-of-scope
- Performance / load testing.
- Mobile native app (chỉ test responsive ở mức visual).
- Backend logic không qua UI (Prisma trực tiếp, scripts seed).
- CI/CD pipeline.

## 3. Môi trường

| Thành phần | Giá trị |
|------------|---------|
| App URL | `http://127.0.0.1:3000` (Next.js dev server) |
| Browser | Chromium qua Hermes `browser_*` tool |
| DB | SQLite tại `prisma/dev.db` (seed sẵn) |
| Timezone | Asia/Ho_Chi_Minh (UTC+7, không DST) — quan trọng cho cutoff test |
| Locale | `vi-VN` |
| NODE_ENV | `test` hoặc `development` |
| RATE_LIMIT_BYPASS | `true` (xem playwright.config.ts) |

## 4. Test accounts (seed sẵn — xem `03-test-data.md`)

| Role | Username | Password | Dùng để |
|------|----------|----------|---------|
| admin | `admin` | `admin123` | Mọi test admin |
| employee | `nguyenvana` | `employee123` | Happy path |
| employee | `tranthib` | `employee123` | Edge / concurrent |
| employee | `levanc` | `employee123` | Override scenario |
| employee | `hoangvane` | `employee123` | Disabled account test |
| employee | `hungpx` | `employee123` | Test đặc biệt |

## 5. Chiến lược thực thi

### 5.1 Phases (chạy tuần tự)
1. **Setup** — verify app + DB + login được.
2. **Auth gate** — đảm bảo middleware redirect đúng cho `/admin/*`.
3. **Employee flow** — book → cancel → history.
4. **Admin CRUD** — menu, employees, holidays, departments.
5. **Reports & export** — render + CSV + XLSX.
6. **Settings** — cutoff thay đổi → effect ngay.
7. **API contract** — REST endpoints từng cái một bằng `curl` + browser DevTools.
8. **Security** — privilege escalation, IDOR, XSS, CSRF.
9. **Visual / a11y / i18n** — responsive, contrast, ARIA.
10. **Edge cases** — weekend, holiday, after-cutoff, múi giờ, ký tự đặc biệt.
11. **Bug write-up** — ghi vào `15-bug-report-template.md`.
12. **Final report** — `reports/baocom-qa-report.md`.

### 5.2 Ghi nhận mỗi phát hiện
Mỗi bug ghi vào file riêng `evidence/BUG-NNN-<slug>.md` với:
- URL + steps repro
- Expected vs Actual
- Screenshot path
- Console errors (nếu có)
- Severity + Category (xem `15-bug-report-template.md`)

## 6. Tiêu chí dừng (stop criteria)

- Mỗi checklist đạt ≥ 80% case pass (NF + AF + EF).
- Không còn bug Critical / High chưa có owner.
- Evidence folder có screenshot cho mỗi bug ≥ Medium.
- Báo cáo `reports/baocom-qa-report.md` đã viết xong.

## 7. Rủi ro & giả định

- **Timezone**: bug liên quan tới cutoff phụ thuộc vào giờ hệ thống; nếu agent chạy lúc 22h-23h VN có thể tự trigger lock — chú ý.
- **Seed data**: DB có thể đã thay đổi sau khi seed; chạy lại `prisma/seed-test-data.ts` trước khi bắt đầu.
- **Concurrent**: dev server không có race condition test thực sự; chỉ quan sát UI.