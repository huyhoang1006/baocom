# 02 — Sitemap & Navigation Matrix

## 1. Page tree

```
/                                   → redirect → /login (nếu chưa login) hoặc /dashboard|/admin/dashboard
├── /login                          (public)
├── /403                            (public, error page)
│
├── /dashboard                      (employee)
├── /book                           (employee)
├── /my-history                     (employee)
│
└── /admin                          (admin only — middleware gate)
    ├── /admin/dashboard
    ├── /admin/menu
    ├── /employees
    │   ├── /admin/employees                (list)
    │   └── /admin/employees/[id]           (detail)
    │       └── /admin/employees/[id]/registrations
    ├── /admin/departments
    ├── /admin/holidays
    ├── /admin/reports
    └── /admin/settings
```

> ⚠ Có một route lệch khỏi convention: `/employees` ở root trong khi các route admin khác dùng `/admin/*`. Khi verify, cần kiểm tra middleware có bắt được `/employees` không — xem `04-auth-flows.md`.

## 2. API routes

```
POST   /api/auth/login                  (public)
POST   /api/auth/logout                 (any auth)
GET    /api/auth/me                     (any auth)

GET    /api/users                       (admin)
GET    /api/users/[id]                  (admin)
POST   /api/users                       (admin)
PATCH  /api/users/[id]                  (admin)
DELETE /api/users/[id]                  (admin)

GET    /api/departments                 (admin)
POST   /api/departments                 (admin)
PATCH  /api/departments/[id]            (admin)
DELETE /api/departments/[id]            (admin)

GET    /api/meals                       (admin)
POST   /api/meals                       (admin)
GET    /api/meals/[id]                  (admin)
PATCH  /api/meals/[id]                  (admin)
POST   /api/meals/find-or-create        (admin)
DELETE /api/meals/[id]                  (admin)

GET    /api/daily-menus                 (any auth)
POST   /api/daily-menus                 (admin)
GET    /api/daily-menus/[date]          (any auth)
PATCH  /api/daily-menus/[date]          (admin)
POST   /api/daily-menus/batch           (admin)
DELETE /api/daily-menus/[date]/meals/[mealId] (admin)

GET    /api/registrations               (any auth — chỉ của mình; admin all)
POST   /api/registrations               (any auth)
PATCH  /api/registrations/[id]          (admin only — override)
DELETE /api/registrations/[id]          (admin only)

GET    /api/holidays                    (any auth)
POST   /api/holidays                    (admin)
PATCH  /api/holidays/[id]               (admin)
DELETE /api/holidays/[id]               (admin)

GET    /api/settings/cutoff             (any auth)
POST   /api/settings/cutoff             (admin)

GET    /api/admin/stats                 (admin)
GET    /api/admin/stats/date/[date]     (admin)
GET    /api/admin/reports               (admin)
GET    /api/admin/reports/export        (admin) → CSV
GET    /api/admin/reports/export-xlsx   (admin) → XLSX
GET    /api/admin/employees/[id]/registrations (admin)

POST   /api/zalo/*                      (ngoài phạm vi QA này)
```

> Một số API có thể đặt auth ở middleware cấp controller (`withAuth` / `withAdmin` trong `src/lib/authMiddleware.ts`). Khi kiểm tra, verify bằng cả trình duyệt (cookie) lẫn `curl` (không cookie) — xem `11-api-contract.md`.

## 3. Navigation matrix (UI elements → destinations)

| Sidebar/Link | Xuất hiện ở | Click → | Sẵn cho role |
|--------------|-------------|---------|--------------|
| "Đăng nhập" submit | `/login` | role-based redirect | any |
| "Đăng xuất" | `/admin/*`, `/dashboard`, `/book`, `/my-history` | `/login` (clear cookie) | any auth |
| Sidebar Dashboard | admin sidebar | `/admin/dashboard` | admin |
| Sidebar Thực đơn | admin sidebar | `/admin/menu` | admin |
| Sidebar Ngày lễ | admin sidebar | `/admin/holidays` | admin |
| Sidebar Nhân sự | admin sidebar | `/admin/employees` | admin |
| Sidebar Phòng ban | admin sidebar | `/admin/departments` | admin |
| Sidebar Báo cáo | admin sidebar | `/admin/reports` | admin |
| Sidebar Cài đặt | admin sidebar | `/admin/settings` | admin |
| Sidebar Dashboard (emp) | employee sidebar | `/dashboard` | employee |
| Sidebar Báo cơm | employee sidebar | `/book` | employee |
| Sidebar Lịch sử | employee sidebar | `/my-history` | employee |
| Avatar / user menu | mọi trang auth | dropdown → profile/logout | any auth |

## 4. Verified locators (từ E2E_TEST_SPEC.md)

Tham khảo locators đã được verify để dùng lại:
```
Tên đăng nhập      → getByRole('textbox', { name: 'Tên đăng nhập' })
Mật khẩu           → getByRole('textbox', { name: 'Mật khẩu' })
Đăng nhập          → getByRole('button', { name: 'Đăng nhập' })
Quên mật khẩu?     → getByRole('link', { name: 'Quên mật khẩu?' })
Hôm nay            → getByRole('button', { name: /Hôm nay/i })
Tuần trước/Tuần này/Tuần sau → getByRole('button', { name: /(← )?Tuần (trước|này|sau)/i })
Có ăn / Không ăn   → getByRole('button', { name: /(Có ăn|Không ăn)/i })
Lưu thay đổi       → getByRole('button', { name: /Lưu thay đổi/i })
Thêm nhân viên     → getByRole('button', { name: /Thêm nhân viên/i })
Thêm ngày lễ       → getByRole('button', { name: /Thêm ngày lễ/i })
Ngày / Tuần / Tháng → getByRole('button', { name: /(Ngày|Tuần|Tháng)/i })
Xem trước          → getByRole('button', { name: /Xem trước/i })
Xuất Excel / Xuất CSV → getByRole('button', { name: /Xuất (Excel|CSV)/i })
```

## 5. Browser console — items phải check mỗi trang

- Lỗi React hydration mismatch (font, locale).
- 4xx/5xx trong network panel — lưu lại.
- Cảnh báo deprecated API.
- Missing keys / unhandled promise.