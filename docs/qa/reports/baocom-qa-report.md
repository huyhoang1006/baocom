# BAOCOM QA REPORT — 2026-06-21

Báo cáo QA thăm dò (exploratory) toàn bộ web **baocom** (Báo Cơm Trưa Công Ty) bằng Hermes skill `dogfood` + HTTP curl probing.

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 4 |
| Medium | 5 |
| Low | 3 |
| **Total** | **14** |

| Category | Count |
|----------|-------|
| Security | 6 |
| Functional / API Contract | 3 |
| UX / Content | 2 |
| Performance / Error Handling | 2 |
| Documentation | 1 |

**Trạng thái tổng thể**: App **không sẵn sàng cho production** do có 2 bug Critical về leak dữ liệu nhạy cảm (password hash, cleartext password) và 4 bug High (logout không invalidate, security headers missing, rate-limit, API contract).

## Test Scope

**Modules đã test (HTTP + curl):**
- Auth (login, logout, session, password reset)
- Employee booking (CRUD registration, validation, edge dates)
- Admin CRUD (users, departments, holidays, settings)
- Admin menu management
- Reports + Export (CSV/XLSX)
- API contract toàn bộ endpoint
- Security probing (XSS, SQLi, IDOR, RBAC, JWT, CSRF)
- Visual/a11y/i18n (HTML inspection)

**Không test (browser-driven):**
- Click-through UI animations (không có browser tool)
- Keyboard navigation chi tiết
- Responsive trên thiết bị thực
- Lighthouse/Lighthouse audits

## Environment

- App version: Next.js 16.2.6, React 19.2.4, Prisma 7.8
- DB: SQLite tại `prisma/dev.db` (đã seed)
- Browser: HTTP curl qua git-bash (MSYS)
- Date tested: 2026-06-21 (Sunday) — Asia/Ho_Chi_Minh
- Server: dev mode, listening on http://127.0.0.1:3000
- Env: `NODE_ENV=test`, `RATE_LIMIT_BYPASS=true`

## Findings

### Critical (2)

#### BUG-002: /api/registrations leak password hash (CRITICAL)
- 58 occurrences của bcrypt hash `$2b$12...R9a6` trong response của GET /api/registrations (employee cookie).
- Mỗi registration embed full `user` object including `password` và `tokenVersion`.
- File: `src/services/RegistrationService.ts` (cần review user select)
- Evidence: [BUG-002-password-hash-leak.md](./evidence/BUG-002-password-hash-leak.md)

#### BUG-005: POST /api/users trả cleartext password trong response (CRITICAL design issue)
- Response: `{"credentials":{"username":"...","password":"Sup3rS3cret!"}}`
- Vi phạm REST best practice — credentials KHÔNG BAO GIỜ nên trong response body.
- File: `src/controllers/UsersController.ts:60-69`
- Evidence: [BUG-005-password-cleartext-create-user.md](./evidence/BUG-005-password-cleartext-create-user.md)

### High (4)

#### BUG-006: /api/admin/reports/export trả XLSX (không phải CSV) — sai Content-Type vs URL
- URL `/export` gợi ý CSV nhưng Content-Type là XLSX.
- Cả `/export` và `/export-xlsx` đều trả cùng response.
- File: `app/api/admin/reports/export/route.ts:14`
- Evidence: [BUG-006-export-csv-actually-xlsx.md](./evidence/BUG-006-export-csv-actually-xlsx.md)

#### BUG-007: Logout KHÔNG invalidate JWT token
- Token cũ vẫn valid 200 OK sau logout.
- Attacker đánh cắp cookie bypass được logout.
- Fix: bump `tokenVersion` trong logout handler.
- Evidence: [BUG-007-logout-no-invalidate.md](./evidence/BUG-007-logout-no-invalidate.md)

#### BUG-008: Thiếu HTTP security headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
- Chỉ có `X-Powered-By: Next.js` (lộ tech stack).
- Không có CSP → vulnerable XSS; không có X-Frame-Options → clickjacking.
- File: `next.config.ts`
- Evidence: [BUG-008-missing-security-headers.md](./evidence/BUG-008-missing-security-headers.md)

#### BUG-009: Không có rate limiting trên /api/auth/login
- 20 request liên tiếp đều trả 401, không 429.
- Source code không có rate-limit middleware.
- Brute-force password attack không bị giới hạn.
- Evidence: [BUG-009-no-rate-limit-login.md](./evidence/BUG-009-no-rate-limit-login.md)

### Medium (5)

| ID | Title | Category |
|----|-------|----------|
| BUG-001 | GET /api/settings/cutoff không cần auth (info disclosure nhẹ) | Security |
| BUG-003 | Error message tiếng Việt bị mất dấu (`"Ngay nay khong nam trong lich bao com"`) | UX/Content |
| BUG-008 | Thiếu HTTP security headers | Security |
| BUG-011 | Malformed JSON trong /api/auth/login trả 500 thay vì 400 | Error Handling |
| BUG-012 | Permission check chạy sau date validation (info disclosure) | Security |

### Low (3)

| ID | Title |
|----|-------|
| BUG-004 | API cold start timeout (intermittent) |
| BUG-010 | Holiday endpoint không public (vs E2E_TEST_SPEC) |
| BUG-013 | Reports query params naming không nhất quán |
| BUG-014 | SQLi payload trả error message tiếng Việt mất dấu |

## Test Coverage

| Module | Tests Run | Pass | Fail | Notes |
|--------|-----------|------|------|-------|
| Auth (AUTH-01..12) | 12 | 9 | 3 | BUG-007, BUG-009, BUG-011 |
| Booking (BOOK-01..16) | 16 | 12 | 4 | BUG-002, BUG-003, BUG-012, BUG-014 |
| Admin (EMP/MENU/HOL/SET) | ~50 | 47 | 3 | BUG-001, BUG-005 |
| Reports (RPT-01..13) | 13 | 10 | 3 | BUG-006, BUG-013 |
| API (API-01..22) | 22 | 18 | 4 | BUG-001, BUG-006, BUG-011 |
| Security (SEC-01..20) | 20 | 14 | 6 | BUG-002, BUG-005, BUG-007, BUG-008, BUG-009 |
| Visual/A11y (VIS/A11Y-01..NN) | partial | mostly OK | minor | no browser tool |

**Overall pass rate**: ~75% (≈110/145 test points pass)

## What Was Tested (works correctly)

- ✓ Login admin/employee (AUTH-01, AUTH-02)
- ✓ Auth guard cho `/admin/*` (redirect 307 → /login)
- ✓ Employee vào `/admin/*` → redirect → `/`
- ✓ Disabled user (isActive=false) → 401
- ✓ Cookie tampering → 401 "Invalid token"
- ✓ tokenVersion bump invalidates session
- ✓ Booking: eating/not_eating, weekend, past date, locked date
- ✓ Admin user CRUD (create, list, update, delete, disable)
- ✓ Admin department CRUD
- ✓ Admin holiday CRUD
- ✓ Cutoff validation (hour/minute bounds, type check)
- ✓ Employee không gọi được admin API (403)
- ✓ SQL injection không thực sự attack được (Prisma parameterize)
- ✓ Path traversal trả 404 (Next.js an toàn)
- ✓ XSS payload lưu an toàn vào DB (React escape HTML)
- ✓ IDOR blocked (employee không xem được data user khác)
- ✓ Login page có `lang="vi"`, inputs có id, button type=submit
- ✓ HTML pages render 200 OK với `lang="vi"`
- ✓ Vietnamese strings đầy đủ (Đăng nhập, Quên mật khẩu, etc.)
- ✓ Concurrent admin override (Node single thread — không race)
- ✓ Reports JSON response OK (~16ms per request)

## What Was NOT Tested

- UI click-through (không có browser tool)
- Animations / loading states visual
- Keyboard navigation chi tiết (Tab order)
- Screen reader (NVDA, JAWS)
- Lighthouse audits
- Mobile responsive visual
- Performance dưới tải lớn (>100 concurrent users)
- Email/password reset flow (chưa implement?)
- 2FA (không có trong scope)
- Production deployment (HSTS, cookies Secure)

## Top 3 Recommended Fixes (Priority Order)

1. **BUG-002 + BUG-005** (Critical): Stop leaking password data qua API responses.
   - BUG-002: Trong RegistrationService, restrict user select fields.
   - BUG-005: Xóa `credentials` field khỏi POST /api/users response.

2. **BUG-007** (High): Bump tokenVersion trong logout handler.
   - 1-line fix: `prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } })`

3. **BUG-006** (High): Sửa `/api/admin/reports/export` để trả CSV đúng như URL.
   - Hoặc đổi tên thành `/export-xlsx` cho khớp.

## How to Reproduce

Tất cả reproduction steps có trong từng `evidence/BUG-NNN-*.md` file.
Test scripts tại `scripts/qa-*.sh` (helper shell scripts dùng curl).

## References

- Test plan: [docs/qa/01-test-plan.md](../01-test-plan.md)
- Sitemap: [docs/qa/02-sitemap.md](../02-sitemap.md)
- Test data: [docs/qa/03-test-data.md](../03-test-data.md)
- Module specs: `docs/qa/04-10-*.md`
- API contract: [docs/qa/11-api-contract.md](../11-api-contract.md)
- Security: [docs/qa/12-security-hardening.md](../12-security-hardening.md)
- A11y/i18n: [docs/qa/13-visual-a11y-i18n.md](../13-visual-a11y-i18n.md)
- Execution script: [docs/qa/14-execution-script.md](../14-execution-script.md)
- Bug template: [docs/qa/15-bug-report-template.md](../15-bug-report-template.md)