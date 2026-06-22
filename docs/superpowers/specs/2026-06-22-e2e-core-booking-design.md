# E2E Core Booking Journey — Chrome DevTools MCP

> **Sub-project A** trong chuỗi 3 plan E2E testing cho hệ thống baocom.
> Bối cảnh: dựng bộ E2E test chạy được qua Chrome DevTools MCP để verify các luồng Normal/Alternative/Exception của core booking flow.

**Ngày tạo:** 2026-06-22
**Phạm vi (in-scope):** Login, Book page (`/book`), My History (`/my-history`), 403 page, Logout
**Ngoài phạm vi (out-of-scope):** Admin management screens (Sub-project B), Admin reports & settings (Sub-project C)

---

## 1. Goals & Non-Goals

### Goals
- Document 20 kịch bản test (Normal/Alternative/Exception) cho core booking journey.
- Mỗi kịch bản là 1 markdown file có cấu trúc chuẩn mà Claude có thể đọc và execute qua Chrome DevTools MCP.
- Tái sử dụng được helpers (login, set status, navigate week, cleanup) giữa các kịch bản.
- Cleanup hoàn toàn sau khi chạy xong (test isolation).
- Có report file ghi lại kết quả PASS/FAIL/SKIP cho mỗi kịch bản.

### Non-Goals
- Không xây automation CI/CD (Claude là executor tương tác).
- Không test các màn hình admin (sẽ làm trong Sub-project B và C).
- Không viết unit test hay integration test (đã có test layer khác).
- Không test performance/load.
- Không tự động chạy toàn bộ 20 kịch bản trong 1 lệnh (Claude chạy tuần tự có review giữa chừng).

---

## 2. Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code Session                        │
│                                                              │
│  ┌──────────────────┐     ┌──────────────────────────────┐  │
│  │  Scenario File   │────▶│   Claude (Executor)          │  │
│  │  (Markdown)      │     │   - Đọc scenario             │  │
│  │                  │     │   - Gọi MCP tools            │  │
│  │  * Pre-condition │     │   - Verify assertions        │  │
│  │  * Steps         │     │   - Ghi report               │  │
│  │  * Expected      │     └──────────┬───────────────────┘  │
│  │  * Cleanup       │                │                       │
│  └──────────────────┘                ▼                       │
│                              ┌──────────────────┐            │
│                              │ Chrome DevTools  │            │
│                              │      MCP         │            │
│                              └────────┬─────────┘            │
│                                       ▼                      │
│                              ┌──────────────────┐            │
│                              │  Browser thật    │            │
│                              │  localhost:3000  │            │
│                              └──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**Luồng execute:** Claude đọc scenario markdown → gọi MCP tools theo thứ tự → verify bằng `evaluate_script` hoặc visual snapshot → ghi kết quả vào report → cleanup data nếu có.

---

## 3. File Structure

```
tests/e2e/
├── README.md                          # Hướng dẫn tổng (cách chạy, prerequisites)
├── helpers/
│   ├── 00-pre-flight.md              # Checklist trước khi chạy (server, admin, employee)
│   ├── auth-login-employee.md         # Helper: login employee (steps chuẩn)
│   ├── auth-login-admin.md           # Helper: login admin
│   ├── auth-logout.md                # Helper: logout + clear cookies
│   ├── booking-open-page.md          # Helper: navigate tới /book
│   ├── booking-set-status.md         # Helper: click "Có ăn" hoặc "Không ăn" cho 1 ngày
│   ├── booking-navigate-week.md      # Helper: click "Tuần trước" hoặc "Tuần sau"
│   ├── data-create-employee.md       # Helper: admin tạo employee test qua API
│   └── data-cleanup-employee.md      # Helper: xóa registrations + employee
├── scenarios/
│   ├── auth/
│   │   ├── 01-login-normal.md             [NORMAL]
│   │   ├── 02-login-invalid-password.md   [EXCEPTION]
│   │   ├── 03-login-empty-fields.md       [EXCEPTION]
│   │   ├── 04-login-nonexistent.md        [EXCEPTION]
│   │   └── 05-logout.md                   [NORMAL]
│   ├── book/
│   │   ├── 06-load-week-current.md        [NORMAL]
│   │   ├── 07-set-eat-normal.md           [NORMAL]
│   │   ├── 08-set-not-eat-normal.md       [NORMAL]
│   │   ├── 09-change-eat-to-not-eat.md    [ALTERNATIVE]
│   │   ├── 10-change-not-eat-to-eat.md    [ALTERNATIVE]
│   │   ├── 11-multi-week-registrations.md [ALTERNATIVE]
│   │   ├── 12-set-not-eat-all-week.md     [ALTERNATIVE]
│   │   ├── 13-locked-day-button-disabled.md [EXCEPTION]
│   │   ├── 14-session-timeout-mid-action.md [EXCEPTION]
│   │   └── 15-api-error-shows-notification.md [EXCEPTION]
│   ├── history/
│   │   ├── 16-view-history-normal.md      [NORMAL]
│   │   ├── 17-history-empty-state.md      [ALTERNATIVE]
│   │   └── 18-history-filter-by-week.md   [ALTERNATIVE]
│   └── access-control/
│       ├── 19-employee-access-admin-page.md [EXCEPTION]
│       └── 20-employee-access-admin-api.md  [EXCEPTION]
└── reports/
    └── YYYY-MM-DD-HHMMSS.md           # Report file (1 per run)
```

**Tổng cộng (initial setup):** 1 README + 8 helpers + 20 scenarios = 29 files. Report files được tạo theo mỗi session chạy (`reports/YYYY-MM-DD-HHMMSS.md`).

---

## 4. Scenario Format (chuẩn cho mọi file)

Mỗi scenario file có cấu trúc:

```markdown
# Scenario N: [Tên ngắn gọn]
**Type:** Normal | Alternative | Exception
**Screen(s):** /login, /book, /my-history, etc.

## Pre-condition
- App đang chạy ở http://localhost:3000
- Test employee đã được tạo (xem helpers/data-create-employee.md)
- DB có daily menus cho tuần hiện tại + 4 tuần tới

## Steps (Claude thực thi qua Chrome DevTools MCP)

1. `mcp__chrome-devtools__navigate_page({ url: "..." })`
2. `mcp__chrome-devtools__take_snapshot()` → kiểm tra text xuất hiện
3. `mcp__chrome-devtools__fill_form({ elements: [...] })`
4. `mcp__chrome-devtools__click({ uid: "..." })`
5. `mcp__chrome-devtools__wait_for({ text: ["..."] })`

## Expected Results
- URL: /book
- HTTP status: 200
- DOM có element: [data-testid="book-day-YYYY-MM-DD"]
- Cookie: token=<jwt>
- Notification xuất hiện với text "Đã đăng ký ăn"

## Assertions (verify bằng evaluate_script)
```js
() => ({
  url: window.location.pathname === "/book",
  dayCount: document.querySelectorAll('[data-testid^="book-day-"]').length === 5,
  hasToken: document.cookie.includes("token="),
  notificationText: document.querySelector('[role="alert"]')?.textContent || null
})
```

## Cleanup
- DELETE registrations của test employee trong tuần test
- Logout để xóa session
```

---

## 5. Scenario Breakdown (20 kịch bản)

| # | Tên | Type | Screen | Status code mong đợi |
|---|-----|------|--------|----------------------|
| 1 | Login với credentials hợp lệ | Normal | /login → /book | 200 + 302 |
| 2 | Login sai password | Exception | /login | 401 + error UI |
| 3 | Login với username/password rỗng | Exception | /login | 400 / client validation |
| 4 | Login với user không tồn tại | Exception | /login | 401 + error UI |
| 5 | Logout thành công | Normal | /book → /login | 200 + cookie cleared |
| 6 | Load /book tuần hiện tại (5 ngày) | Normal | /book | 200 |
| 7 | Click "Có ăn" cho 1 ngày unlocked | Normal | /book | 200 + success notification |
| 8 | Click "Không ăn" cho 1 ngày unlocked | Normal | /book | 200 + success notification |
| 9 | Đổi eating → not-eating | Alternative | /book | 200 + notification "Đã đăng ký không ăn" |
| 10 | Đổi not-eating → eating | Alternative | /book | 200 + notification "Đã đăng ký ăn" |
| 11 | Đăng ký ở tuần 0 + tuần 2 | Alternative | /book | 200 + 2 lần success |
| 12 | Set "Không ăn" cho cả 5 ngày trong tuần | Alternative | /book | 200 + 5 lần success |
| 13 | Click button ngày locked → button disabled | Exception | /book | button có `disabled` attr |
| 14 | Session timeout giữa action (qua xóa cookie + thao tác) | Exception | /book | redirect /login |
| 15 | API trả 500 → error notification | Exception | /book | notification "Cập nhật thất bại" |
| 16 | Xem /my-history thấy đăng ký vừa tạo | Normal | /my-history | 200 + có row |
| 17 | /my-history empty state (employee mới) | Alternative | /my-history | 200 + empty UI |
| 18 | Filter /my-history theo tuần | Alternative | /my-history | 200 + filter hoạt động |
| 19 | Employee vào /admin/dashboard → 403 page | Exception | /admin/* | 403 page rendered |
| 20 | Employee gọi API admin → 403 response | Exception | API | 401/403 status |

**Phân bổ:** Normal=8 (40%), Alternative=7 (35%), Exception=5 (25%) — cân bằng đủ 3 loại flow.

---

## 6. Execution Loop (cách Claude chạy)

Mỗi lần user yêu cầu "Run scenario N":

```
1. Claude đọc file scenarios/<path>/N-*.md
2. Claude đọc helpers/00-pre-flight.md và verify:
   - curl localhost:3000 → 200 (server alive)
   - Admin login OK
   - Test employee exists (hoặc tạo mới qua helper)
3. Claude execute Steps theo thứ tự trong file
4. Claude chạy Assertions (evaluate_script)
5. Nếu có FAIL → take_screenshot để có visual proof
6. Claude ghi 1 dòng vào reports/YYYY-MM-DD-HHMMSS.md:
   | N | Scenario name | Type | ✅ PASS | Notes |
7. Nếu scenario có data → chạy Cleanup
8. Báo cáo user kết quả, hỏi có muốn chạy scenario tiếp không
```

**Run all 20:** User nói "Run all scenarios" → Claude chạy tuần tự 1→20, có report tổng cuối cùng.

---

## 7. Test Data & Cleanup Strategy

### Test Users

| Role | Username pattern | Mật khẩu | Tạo khi nào | Cleanup |
|------|------------------|----------|-------------|---------|
| Admin | `admin` (seed sẵn) | (lấy từ env hoặc hỏi user) | Có sẵn | Không xóa |
| Employee test | `e2e_emp_<YYYYMMDD-HHMMSS>` | `Test123!` | Đầu session, trước khi chạy scenario đầu tiên cần employee | Sau khi chạy hết scenarios cần employee |

### Isolation
- Mỗi session chạy tạo 1 employee duy nhất → không conflict giữa các sessions.
- Mỗi scenario dùng cùng 1 employee nhưng cleanup registrations sau khi xong.
- Với scenario 17 (empty state), dùng employee mới tạo chưa có registration.

### Cleanup commands (qua cURL + Bash, không qua Chrome MCP)

```bash
# Lấy danh sách registrations của test employee
REGISTRATIONS=$(curl -s -H "Cookie: token=$EMP_TOKEN" \
  http://localhost:3000/api/registrations | jq '.[] | select(.employeeId == '$EMP_ID') | .id')

# Xóa từng registration
for REG_ID in $REGISTRATIONS; do
  curl -X DELETE -H "Cookie: token=$EMP_TOKEN" \
    http://localhost:3000/api/registrations/$REG_ID
done

# Xóa employee test (cần admin auth)
curl -X DELETE -H "Cookie: token=$ADMIN_TOKEN" \
  http://localhost:3000/api/users/$EMP_ID

# Clear cookies trong browser
mcp__chrome-devtools__evaluate_script({ function: "() => { document.cookie.split(';').forEach(c => { document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/'); }); }" })
```

### Pre-flight check (chạy trước mỗi scenario)
- [ ] App đang chạy: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/me` → 401 (expected)
- [ ] Admin login OK: `curl -H "Content-Type: application/json" -d '{"username":"admin","password":"...","deviceId":"e2e-test"}' http://localhost:3000/api/auth/login` → 200 + token
- [ ] Test employee exists: kiểm tra file `/tmp/e2e-emp.id` tồn tại

---

## 8. Reporting

### File format
Mỗi session chạy tạo 1 file `tests/e2e/reports/YYYY-MM-DD-HHMMSS.md`.

### Template

```markdown
# E2E Test Run — 2026-06-22 14:30

**Sub-project:** Core booking journey
**Total scenarios:** 20
**Duration:** 45 min

## Summary
- ✅ PASS: 18
- ❌ FAIL: 2
- ⚠ SKIP: 0
- Pass rate: 90%

## Results

| # | Scenario | Type | Result | Duration | Notes |
|---|----------|------|--------|----------|-------|
| 1 | Login normal | Normal | ✅ PASS | 8s | |
| 2 | Login invalid password | Exception | ✅ PASS | 6s | |
| 3 | Login empty fields | Exception | ✅ PASS | 5s | |
| 4 | Login nonexistent | Exception | ✅ PASS | 7s | |
| 5 | Logout | Normal | ✅ PASS | 4s | |
| 6 | Load week current | Normal | ✅ PASS | 3s | |
| 7 | Set eat normal | Normal | ❌ FAIL | 12s | Notification không hiển thị |
| 8 | Set not eat normal | Normal | ✅ PASS | 5s | |
| 9-12 | ... | Alternative | ✅ PASS | ... | |
| 13 | Locked day | Exception | ✅ PASS | 4s | |
| 14 | Session timeout | Exception | ✅ PASS | 8s | Xóa cookie token qua evaluate_script rồi click |
| 15-20 | ... | ... | ... | ... | |

## Failures detail

### Scenario 7: Set eat normal
- **Expected:** Notification "Đã đăng ký ăn" xuất hiện trong 3s
- **Actual:** Không có notification nào xuất hiện
- **Screenshot:** reports/screenshots/2026-06-22-1430-scenario-07.png
- **Console logs:** (no errors)
- **Network:** POST /api/registrations → 200 (success)
- **Hypothesis:** Có thể state hook không update sau khi API success

## Cleanup status
- [x] Test employee `e2e_emp_20260622-143000` đã xóa
- [x] 0 registrations còn lại trong DB cho test employee
- [x] Browser cookies cleared
```

### Screenshots
Khi có FAIL → `mcp__chrome-devtools__take_screenshot({ filePath: "tests/e2e/reports/screenshots/YYYY-MM-DD-HHMMSS-scenario-NN.png" })`.

---

## 9. Helper Specifications

### helpers/00-pre-flight.md

```markdown
# Pre-flight checklist

## Server check
- [ ] App đang chạy ở localhost:3000
- [ ] Không có console errors khi load /login

## Admin check
- [ ] Admin user `admin` tồn tại
- [ ] Admin có thể login qua API

## Test data check
- [ ] Test employee `e2e_emp_<timestamp>` đã được tạo
- [ ] Token employee đã được lưu vào /tmp/e2e-emp.tok
- [ ] Token admin đã được lưu vào /tmp/e2e-admin.tok

## Browser check (Chrome DevTools MCP)
- [ ] Đã navigate tới http://localhost:3000/login
- [ ] Page render thành công (không trắng)
```

### helpers/auth-login-employee.md

```markdown
# Helper: Login Employee

## Input
- username (string)
- password (string)

## Steps
1. `navigate_page({ url: "http://localhost:3000/login" })`
2. `take_snapshot()` → tìm uid của `input[name="username"]`, `input[name="password"]`, `button[type="submit"]`
3. `fill_form({ elements: [{ uid: <username uid>, value: <username> }, { uid: <password uid>, value: <password> }] })`
4. `click({ uid: <submit uid> })`
5. `wait_for({ text: ["Báo Cơm", "Đăng nhập"] })`

## Returns
- Success: URL === "/book"
- Failure: URL === "/login" + có error message

## Tokens saved to
- /tmp/e2e-emp.tok (extract từ cookie qua evaluate_script)
```

### helpers/booking-set-status.md

```markdown
# Helper: Set status cho 1 ngày

## Input
- dateKey (string, format: YYYY-MM-DD)
- status ("eating" | "not-eating")

## Steps
1. `take_snapshot()` → tìm uid của element `[data-testid="book-day-${dateKey}"]`
2. Trong scope đó, tìm button theo text:
   - status === "eating" → button text "Có ăn"
   - status === "not-eating" → button text "Không ăn"
3. `click({ uid: <button uid> })`
4. `wait_for({ text: ["Đã đăng ký ăn", "Đã đăng ký không ăn", "Cập nhật thất bại"] })`

## Returns
- Success: notification xuất hiện với text tương ứng
- Failure: error notification hoặc button disabled
```

(Các helpers khác cùng pattern, document đầy đủ trong implementation plan.)

---

## 10. Success Criteria

Plan này thành công khi:

- [ ] Có đủ 20 file scenarios với format chuẩn.
- [ ] Có đủ 8 helpers (pre-flight, login, logout, navigate, set-status, navigate-week, create-data, cleanup-data).
- [ ] README hướng dẫn cách chạy rõ ràng.
- [ ] Có thể chạy được ít nhất 5 scenarios đầu tiên end-to-end (login + book cơm) thành công.
- [ ] Report file ghi đúng kết quả PASS/FAIL.
- [ ] Cleanup chạy đúng, không có data test còn lại trong DB sau khi xong.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| App server crash giữa chừng | Pre-flight check + retry logic trong helper |
| Test data conflict với data thật | Mỗi session tạo employee unique với timestamp |
| Test chạy quá lâu | Scenario có timeout 5 phút, fail nếu quá |
| Chrome DevTools MCP không available | Plan có fallback: dùng curl API tests (đã có sẵn trong scripts/qa-*) |
| Date-dependent tests (cutoff) flaky | Scenario 13 chỉ test ngày locked (không cần mock thời gian) |
| Notification timeout ngắn (3s) | Helper wait_for dùng polling, không phải sleep cố định |
| Session timeout khó reproduce | Scenario 14 xóa cookie token qua evaluate_script trước khi click → mô phỏng session hết hạn |

---

## 12. Open Questions (Resolved)

- ~~Luồng chính cần test?~~ → Core booking journey (Sub-project A)
- ~~Execution model?~~ → Interactive (Claude drives via Chrome DevTools MCP)
- ~~Test users?~~ → Admin có sẵn + Employee tạo mới mỗi session
- ~~DB isolation?~~ → Tạo + cleanup riêng
- ~~Cutoff time?~~ → Test cả locked và unlocked days
- ~~Scope scenarios?~~ → Full core booking ~20 scenarios
- ~~Approach tổ chức files?~~ → Markdown scenario scripts (Approach 1)