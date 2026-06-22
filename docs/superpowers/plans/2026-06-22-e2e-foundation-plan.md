# E2E Testing Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up template + execution playbook + evidence infrastructure để 46-scenario E2E test plan (Sub-A/B/C) có thể execute qua Chrome DevTools MCP.

**Architecture:** 3 markdown artifacts (`_template.md`, `e2e-execution.md`, `evidence/run-log.md`) + 1 smoke scenario verify template hoạt động + deprecation note trên Sub-A cũ. Sub-A/B/C execution plans sẽ follow-up trong sessions riêng.

**Tech Stack:** Markdown, Bash (mkdir/file ops), Chrome DevTools MCP (referenced in playbook only).

**Pre-req:**
- Đã đọc `docs/superpowers/specs/2026-06-22-e2e-master-design.md` (master spec, đã commit `db3c3a4`).
- Working directory: `C:/Users/ADMIN/Downloads/temp_v9/baocom`
- Bash shell (Windows Git Bash hoặc WSL).

---

## File Structure

```
docs/qa/
├── scenarios/                              ← MỚI
│   ├── _template.md                        ← Task 1: scenario template chuẩn
│   └── sub-a-booking.md                    ← Task 4: skeleton Sub-A (1 smoke scenario)
├── e2e-execution.md                        ← Task 2: Chrome DevTools MCP playbook
└── evidence/
    └── run-log.md                          ← Task 3: append-only log skeleton

docs/superpowers/specs/
└── 2026-06-22-e2e-core-booking-design.md   ← Task 5: add deprecation banner
```

**Dependencies between tasks:**
- Task 1 (template) blocks Task 4 (smoke scenario) — scenario phải follow template mới viết được
- Task 2 (playbook) độc lập với Task 1, nhưng playbook reference template (`_template.md`)
- Task 3 (run-log) độc lập
- Task 4 (smoke) cần Task 1 xong
- Task 5 (deprecate) độc lập, làm cuối cùng

**Suggested execution order:** Task 1 → Task 2 → Task 3 → Task 4 → Task 5

---

## Task 1: Tạo `docs/qa/scenarios/_template.md`

**Files:**
- Create: `docs/qa/scenarios/_template.md`

- [ ] **Step 1: Tạo folder `scenarios/`**

Run:
```bash
mkdir -p docs/qa/scenarios
```

Expected: folder tồn tại, không có lỗi.

- [ ] **Step 2: Viết file `_template.md`**

Tạo file `docs/qa/scenarios/_template.md` với nội dung:

```markdown
# Scenario Template — baocom E2E

> Template chuẩn cho mọi scenario trong Sub-A/B/C. Claude đọc file này để biết format, rồi đọc các pack file (`sub-a-booking.md`, `sub-b-admin.md`, `sub-c-reports-settings.md`) để execute.

## Quy tắc chung

- **ID format**: `S-{PACK}-{NNN}` — PACK ∈ {A, B, C}; NNN zero-padded 3 chữ số; bắt đầu từ 001.
- **NNN đánh liên tực trong pack**, không reset giữa NF/AF/EF.
- **Type field**: NF (Normal Flow) | AF (Alternative Flow) | EF (Exception Flow).
- **Action trong Steps**: phải là Chrome DevTools MCP tool name (`navigate_page`, `take_snapshot`, `fill_form`, `click`, `press_key`, `wait_for`, v.v.) — KHÔNG dùng CSS selector.
- **Element/URL trong Steps**: dùng semantic description (vd: "nút Đăng nhập"), uid sẽ lấy runtime qua `take_snapshot()`.

## Scenario block schema

Mỗi scenario là block Markdown theo format dưới. Copy block này cho mỗi scenario mới:

```markdown
### S-{PACK}-{NNN} — {Tiêu đề ngắn, dưới 80 ký tự}

**Type:** NF | AF | EF
**Screen:** {URL path}
**Priority:** P0 | P1 | P2 | P3
**Effort:** S (<5 min) | M (5-15 min) | L (>15 min)
**Pre-req:** {account role, data state, hoặc "none"}

**Setup:** (chỉ khi cần)
\`\`\`bash
# ví dụ: set cutoff, seed data
\`\`\`

**Steps:**
| # | Action | Element/URL | Expected |
|---|--------|-------------|----------|
| 1 | navigate_page | url=/login | Page loads, form visible |
| 2 | take_snapshot | (none) | uid cho input username lấy được |
| 3 | fill_form | uid=<from snapshot> value=emp01 | Field populated |
| ... | | | |

**Verify:**
- [ ] URL matches: \`{pattern}\`
- [ ] DOM contains: \`{text/aria}\`
- [ ] Network: \`{request/response}\`
- [ ] Console: no errors

**Evidence on fail:**
- Screenshot → \`evidence/S-{ID}.fail.png\`
- Console log → \`evidence/S-{ID}.console.txt\`
- Network → \`evidence/S-{ID}.network.json\`
- Bug ticket → \`evidence/BUG-E2E-NEW-{NNN}-{slug}.md\`

**Notes:** {business rule liên quan, references Sub-A cũ, v.v.}
```

## Escape hatch

Scenario đặc thù (race condition, animation timing) có thể:
- Thêm field \`**Race-condition notes:**\` dưới \`Notes\`
- Step verify dùng \`wait_for\` với timeout ngắn (100–500ms)
- Nếu không verify được tự động → ghi \`**Manual required:**\` + mô tả bước manual
```

- [ ] **Step 3: Verify file có đủ các field bắt buộc**

Run:
```bash
grep -E "^(### S-|\\*\\*Type:\\*\\*|\\*\\*Steps:\\*\\*|\\*\\*Verify:\\*\\*|\\*\\*Evidence on fail:\\*\\*)" docs/qa/scenarios/_template.md | head -10
```

Expected: thấy các dòng match cho `### S-`, `**Type:**`, `**Steps:**`, `**Verify:**`, `**Evidence on fail:**`.

- [ ] **Step 4: Commit**

```bash
git add docs/qa/scenarios/_template.md
git commit -m "docs(qa): add scenario template for E2E pack files"
```

---

## Task 2: Tạo `docs/qa/e2e-execution.md` (Chrome DevTools MCP Playbook)

**Files:**
- Create: `docs/qa/e2e-execution.md`

- [ ] **Step 1: Viết file playbook**

Tạo file `docs/qa/e2e-execution.md` với nội dung:

```markdown
# E2E Execution Playbook — baocom

> Hướng dẫn vận hành Chrome DevTools MCP để execute các scenario pack. Đọc file này trước khi chạy bất kỳ pack nào.

## 1. Environment setup

### 1.1 Prerequisites
- Node.js 18+ và npm
- App đang chạy ở `http://127.0.0.1:3000` (dev mode)
- SQLite DB đã seed với accounts từ `docs/qa/03-test-data.md`
- Chrome browser với Chrome DevTools MCP đã enable

### 1.2 Khởi động app
\`\`\`bash
# Terminal 1: start dev server
npm run dev

# Terminal 2: verify app ready
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/login
# Expected: 200
\`\`\`

### 1.3 Reset DB giữa các phase (nếu cần)
\`\`\`bash
node scripts/qa-db.mjs reset
node scripts/qa-db.mjs seed
\`\`\`

## 2. Test accounts

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| Employee | emp01 | test123 | Account chính cho Sub-A |
| Employee | emp02 | test123 | Test concurrent booking |
| Admin | admin01 | admin123 | Account chính cho Sub-B/C |
| Admin (no perm) | admin02 | admin123 | Test permission boundary |

> Seed chi tiết xem `docs/qa/03-test-data.md`.

## 3. Chrome DevTools MCP commands cheatsheet

| Task | Tool call | Lưu ý |
|------|-----------|-------|
| Mở trang | \`mcp__chrome-devtools__navigate_page(type="url", url="...")\` | URL đầy đủ với protocol |
| Lấy uid element | \`mcp__chrome-devtools__take_snapshot()\` | BẮT BUỘC trước mỗi fill/click |
| Fill nhiều field | \`mcp__chrome-devtools__fill_form(elements=[...])\` | Ưu tiên hơn fill riêng lẻ |
| Click 1 element | \`mcp__chrome-devtools__click(uid="...")\` | uid từ snapshot |
| Submit form / Enter | \`mcp__chrome-devtools__press_key(key="Enter")\` | |
| Đợi text xuất hiện | \`mcp__chrome-devtools__wait_for(text=["..."])\` | Default timeout 5s |
| Verify API call | \`mcp__chrome-devtools__list_network_requests()\` | Filter theo URL pattern |
| Check console errors | \`mcp__chrome-devtools__list_console_messages(types=["error"])\` | |
| Screenshot khi fail | \`mcp__chrome-devtools__take_screenshot(filePath="evidence/...")\` | |

## 4. 4-Channel Verify Protocol

Mọi scenario PASS khi và chỉ khi **đồng thời** thỏa 4 kênh:

1. **URL**: \`location.pathname\` match pattern trong Verify block
2. **DOM/a11y**: \`take_snapshot()\` text/aria chứa expected
3. **Network**: response 2xx cho API expected (xem \`docs/qa/11-api-contract.md\`)
4. **Console**: \`list_console_messages(types=["error"])\` rỗng

## 5. Phase order

| Phase | Pack | Pre-req | Lệnh gợi ý |
|-------|------|---------|-------------|
| 1. Auth bootstrap | Sub-A (S-A-001 → 005) | none | Chạy S-A-001 → 005 |
| 2. Employee flow | Sub-A (S-A-006 → 020) | Phase 1 | Chạy S-A-006 → 020 |
| 3. Admin management | Sub-B | Phase 1 | Đổi sang admin account, chạy Sub-B |
| 4. Reports + Settings | Sub-C | Phase 1, 3 | Cần data từ Sub-B |

## 6. Run-log format

Xem `docs/qa/evidence/run-log.md`. Mỗi scenario 1 dòng:
\`\`\`
[2026-06-22 14:32:01] S-A-006 PASS (3.2s)
[2026-06-22 14:32:18] S-A-007 FAIL (timeout 5s) → BUG-E2E-NEW-005
\`\`\`

## 7. Stop rules

- Cùng 1 scenario fail 3 lần liên tiếp → STOP, ghi \`evidence/STUCK-{ID}.md\`
- 1 phase < 50% pass → STOP toàn phase, báo user trước khi tiếp

## 8. Resume

Scenario đã PASS trong lần chạy trước được SKIP khi chạy lại (dựa trên run-log). Flag \`--rerun-all\` để force chạy lại tất cả.
```

- [ ] **Step 2: Verify có đủ 8 sections**

Run:
```bash
grep -E "^## [0-9]" docs/qa/e2e-execution.md
```

Expected output:
```
## 1. Environment setup
## 2. Test accounts
## 3. Chrome DevTools MCP commands cheatsheet
## 4. 4-Channel Verify Protocol
## 5. Phase order
## 6. Run-log format
## 7. Stop rules
## 8. Resume
```

- [ ] **Step 3: Commit**

```bash
git add docs/qa/e2e-execution.md
git commit -m "docs(qa): add Chrome DevTools MCP execution playbook"
```

---

## Task 3: Tạo `docs/qa/evidence/run-log.md` skeleton

**Files:**
- Create: `docs/qa/evidence/run-log.md`

- [ ] **Step 1: Viết file run-log.md**

Tạo file `docs/qa/evidence/run-log.md` với nội dung:

```markdown
# E2E Run Log

> Append-only log. Mỗi scenario pass/fail ghi 1 dòng theo format bên dưới.
> File này dùng để resume giữa các lần chạy — scenario đã PASS được SKIP.

## Format

\`\`\`
[ISO-8601 timestamp] {SCENARIO-ID} {STATUS} {duration/timeout} → {bug-id or empty}
\`\`\`

- **Timestamp**: ISO-8601 UTC, ví dụ `2026-06-22T14:32:01Z`
- **STATUS**: PASS | FAIL | SKIP
- **duration**: seconds với 1 decimal (vd: `3.2s`); hoặc `timeout 5s` cho FAIL do timeout
- **bug-id**: chỉ có khi FAIL, ví dụ `BUG-E2E-NEW-005`

## Examples

\`\`\`
[2026-06-22T14:32:01Z] S-A-001 PASS (2.8s)
[2026-06-22T14:32:18Z] S-A-002 FAIL (timeout 5s) → BUG-E2E-NEW-001
[2026-06-22T14:32:35Z] S-A-003 SKIP (pre-req fail từ S-A-002)
\`\`\`

## Phase markers

Thêm dòng marker giữa các phase:
\`\`\`
=== PHASE 1: AUTH BOOTSTRAP ===
[2026-06-22T14:30:00Z] S-A-001 PASS (2.8s)
...
=== PHASE 1 SUMMARY ===
PASS: 4 / FAIL: 0 / SKIP: 0
=== END PHASE 1 ===

=== PHASE 2: EMPLOYEE FLOW ===
...
\`\`\`
```

- [ ] **Step 2: Verify file format**

Run:
```bash
head -20 docs/qa/evidence/run-log.md
```

Expected: thấy header "E2E Run Log", "Format" section, "Examples" section.

- [ ] **Step 3: Commit**

```bash
git add docs/qa/evidence/run-log.md
git commit -m "docs(qa): add run-log skeleton for E2E execution"
```

---

## Task 4: Smoke scenario đầu tiên — refactor S-A-001 (Login employee)

**Files:**
- Create: `docs/qa/scenarios/sub-a-booking.md`

Mục đích: verify template vừa tạo (Task 1) hoạt động bằng cách viết 1 scenario thực tế theo đúng schema.

- [ ] **Step 1: Đọc lại `_template.md` và Sub-A cũ để extract context**

Run:
```bash
grep -A 20 "AUTH-01" docs/superpowers/specs/2026-06-22-e2e-core-booking-design.md | head -30
```

Expected: thấy scenario AUTH-01 (login employee) với steps + expected.

- [ ] **Step 2: Viết file `sub-a-booking.md` với 1 scenario smoke (S-A-001)**

Tạo file `docs/qa/scenarios/sub-a-booking.md` với nội dung:

```markdown
# Sub-A Scenario Pack — Employee & Auth

> Pack 1 / 3 trong master E2E plan. Cover: `/login`, `/403`, `/dashboard`, `/book`, `/my-history`.
> Scope: 18 scenarios (NF 8 + AF 6 + EF 4) — đang trong quá trình refactor từ spec cũ.
> File này là SKELETON — chỉ có S-A-001 smoke. Các scenario khác sẽ được thêm trong Sub-A execution plan.

---

### S-A-001 — Login employee thành công

**Type:** NF
**Screen:** /login
**Priority:** P0
**Effort:** S
**Pre-req:** none

**Setup:**
```bash
# Đảm bảo app đang chạy và DB đã seed
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/login
# Expected: 200
```

**Steps:**
| # | Action | Element/URL | Expected |
|---|--------|-------------|----------|
| 1 | navigate_page | url=http://127.0.0.1:3000/login | Page loads, form login hiển thị |
| 2 | take_snapshot | (none) | uid cho input username/password/button lấy được |
| 3 | fill_form | uid=<username input> value=emp01 | Username field populated |
| 4 | fill | uid=<password input> value=test123 | Password field populated |
| 5 | click | uid=<button "Đăng nhập"> | Form submit |
| 6 | wait_for | text=["Đặt cơm"] | Dashboard heading xuất hiện |

**Verify:**
- [ ] URL matches: `/dashboard`
- [ ] DOM contains: heading "Đặt cơm" hoặc tên employee
- [ ] Network: `POST /api/auth/login` returns 200
- [ ] Console: no errors

**Evidence on fail:**
- Screenshot → `evidence/S-A-001.fail.png`
- Console log → `evidence/S-A-001.console.txt`
- Network → `evidence/S-A-001.network.json`
- Bug ticket → `evidence/BUG-E2E-NEW-001-login-fail.md`

**Notes:** Refactor từ AUTH-01 trong `docs/superpowers/specs/2026-06-22-e2e-core-booking-design.md` (spec Sub-A cũ). Scenario này là smoke test — nếu pass, template hoạt động đúng và các scenario khác có thể viết theo cùng pattern.

---

## Follow-up — Sub-A execution plan sẽ thêm các scenario:

- S-A-002 (login admin)
- S-A-003 (sai password → lỗi tiếng Việt có dấu)
- S-A-004 (backend down)
- S-A-005 (logout)
- S-A-006 → S-A-013 (BOOK-* — booking flows)
- S-A-014 → S-A-018 (HIST-* — my-history)
- S-A-019, S-A-020 (PERM-* — permission boundaries)
```

- [ ] **Step 3: Verify scenario block có đủ field**

Run:
```bash
grep -E "^(### S-A-001|\\*\\*Type:\\*\\* NF|\\*\\*Priority:\\*\\* P0|\\*\\*Pre-req:\\*\\*|\\*\\*Steps:\\*\\*|\\*\\*Verify:\\*\\*|\\*\\*Evidence on fail:\\*\\*)" docs/qa/scenarios/sub-a-booking.md
```

Expected: thấy đủ 7 dòng match cho ID, Type, Priority, Pre-req, Steps, Verify, Evidence on fail.

- [ ] **Step 4: Commit**

```bash
git add docs/qa/scenarios/sub-a-booking.md
git commit -m "docs(qa): add Sub-A smoke scenario S-A-001 to verify template"
```

---

## Task 5: Deprecate Sub-A spec cũ

**Files:**
- Modify: `docs/superpowers/specs/2026-06-22-e2e-core-booking-design.md:1-15`

- [ ] **Step 1: Đọc 15 dòng đầu của Sub-A cũ**

Run:
```bash
head -15 docs/superpowers/specs/2026-06-22-e2e-core-booking-design.md
```

Expected: thấy title "E2E Core Booking Journey — Chrome DevTools MCP" và phần "Sub-project A" banner.

- [ ] **Step 2: Thêm deprecation banner ngay sau title (line 1)**

Edit `docs/superpowers/specs/2026-06-22-e2e-core-booking-design.md`. Thay dòng:

```
# E2E Core Booking Journey — Chrome DevTools MCP
```

bằng:

```
# E2E Core Booking Journey — Chrome DevTools MCP

> **⚠️ DEPRECATED 2026-06-22**: File này đã được supersede bởi **master design spec** tại `docs/superpowers/specs/2026-06-22-e2e-master-design.md` (commit `db3c3a4`). Nội dung Sub-A sẽ được refactor về template mới tại `docs/qa/scenarios/sub-a-booking.md` trong execution plan tương ứng. Giữ file này để tham chiếu lịch sử.
```

- [ ] **Step 3: Verify banner xuất hiện**

Run:
```bash
head -5 docs/superpowers/specs/2026-06-22-e2e-core-booking-design.md
```

Expected: dòng 2 chứa "DEPRECATED 2026-06-22" và reference đến master spec.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-06-22-e2e-core-booking-design.md
git commit -m "docs(qa): deprecate Sub-A spec in favor of master design"
```

---

## Done criteria

- [ ] Task 1: `docs/qa/scenarios/_template.md` có đủ 5 fields bắt buộc (Type, Steps, Verify, Evidence on fail, Notes)
- [ ] Task 2: `docs/qa/e2e-execution.md` có đủ 8 sections (Environment, Accounts, MCP cheatsheet, 4-Channel Verify, Phase order, Run-log, Stop rules, Resume)
- [ ] Task 3: `docs/qa/evidence/run-log.md` có header + format + examples
- [ ] Task 4: `docs/qa/scenarios/sub-a-booking.md` có S-A-001 smoke scenario với đầy đủ fields
- [ ] Task 5: Sub-A spec cũ có deprecation banner trỏ về master spec

## Follow-up plans

Sau khi Foundation xong, các execution plan sau sẽ follow-up:
- **Sub-A execution plan**: refactor 17 scenarios còn lại của Sub-A theo template
- **Sub-B plan**: viết 17 scenarios admin management mới
- **Sub-C plan**: viết 11 scenarios reports + settings mới