# QA Documentation — baocom (Báo Cơm)

Bộ tài liệu kiểm thử toàn diện cho hệ thống **Báo Cơm Trưa Công Ty** (Next.js 16 + Prisma + SQLite).

Mục tiêu: cung cấp một **playbook đầy đủ** để chạy QA thăm dò (exploratory) bằng skill `dogfood` của Hermes — sử dụng browser toolset để duyệt qua **mọi ngóc ngách** của ứng dụng: normal flow, alternative flow, exception flow, edge case.

## Cấu trúc thư mục

```
docs/qa/
├── 00-README.md                  ← file này
├── 01-test-plan.md               ← chiến lược tổng, phạm vi, môi trường
├── 02-sitemap.md                 ← sơ đồ trang + navigation matrix
├── 03-test-data.md               ← seed accounts, fixtures, edge dates
├── 04-auth-flows.md              ← login / logout / session / guard
├── 05-employee-booking.md        ← book / cancel / lock / cutoff
├── 06-admin-menu.md              ← quản lý thực đơn tuần
├── 07-admin-employees.md         ← quản lý nhân viên + phòng ban
├── 08-admin-holidays.md          ← ngày lễ / ngày nghỉ
├── 09-admin-reports.md           ← báo cáo + export
├── 10-admin-settings.md          ← cấu hình cutoff
├── 11-api-contract.md            ← kiểm tra REST endpoints
├── 12-security-hardening.md      ← auth boundary, RBAC, XSS, CSRF
├── 13-visual-a11y-i18n.md        ← accessibility + responsive + i18n
├── 14-execution-script.md        ← kịch bản chạy từng phase bằng dogfood
├── 15-bug-report-template.md     ← template ghi nhận bug
├── checklists/                   ← checklist ngắn gọn cho từng role
├── evidence/                     ← screenshot + log (do agent tạo khi chạy)
└── reports/                      ← báo cáo tổng hợp (do agent tạo khi chạy)
```

## Cách sử dụng với skill `dogfood`

1. Đảm bảo app đang chạy: `npm run dev` (mặc định `http://127.0.0.1:3000`)
2. Đảm bảo DB đã seed: `npx prisma db push && npm run seed` (xem `03-test-data.md`)
3. Trong Hermes, gọi skill `dogfood` với goal kiểu:
   > "Hãy chạy QA toàn bộ web baocom theo docs/qa/. Bắt đầu với 14-execution-script.md."
4. Agent sẽ duyệt từng file checklist, dùng browser tool, ghi nhận bug vào `15-bug-report-template.md`, lưu ảnh vào `evidence/`, cuối cùng sinh báo cáo tổng vào `reports/`.

## Nguyên tắc

- **Mọi test case đều có 3 dòng flow**: Normal → Alternative → Exception.
- **Mỗi bước đều kèm URL + element + assertion**, không viết chung chung.
- **Bug phải có evidence**: URL + steps + expected/actual + ảnh MEDIA: + console log nếu có.
- **Không bỏ qua edge case**: ngày lễ, weekend, sau cutoff, sai múi giờ, ký tự đặc biệt, concurrent edit.

## Liên kết tham chiếu nội bộ

- BUSINESS_RULES.md — đặc tả nghiệp vụ (login, registration, override, cutoff).
- E2E_TEST_SPEC.md — bộ test case Playwright có sẵn (tham khảo locators đã verify).
- DESIGN.md — design tokens & UI conventions.
- prisma/schema.prisma — data model (ground truth cho validation).
- src/lib/registrationWindow.ts — logic cutoff / week window (xem để biết giới hạn).