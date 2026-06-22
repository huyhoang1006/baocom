# E2E Master Plan — baocom (Chrome DevTools MCP)

> **Master design** cho chuỗi E2E testing toàn diện hệ thống baocom (Báo Cơm Trưa Công Ty).
> Supersedes: `2026-06-22-e2e-core-booking-design.md` (Sub-project A cũ — sẽ được refactor về cùng template).
> Follow-up: Sub-project B (admin management), Sub-project C (reports & settings).

**Ngày tạo:** 2026-06-22
**Phạm vi:** Toàn bộ 13 màn hình từ `docs/qa/02-sitemap.md` (5 employee + 5 admin + 3 cross-cutting)
**Tool executor:** Claude + Chrome DevTools MCP
**Output:** 3 scenario pack files + 1 execution playbook + 1 master report

---

## 1. Goals & Non-Goals

### Goals
- Phủ 3 luồng (Normal / Alternative / Exception) cho 13 màn hình, ước lượng ~46–50 scenarios.
- Mỗi scenario theo 1 template chuẩn (`docs/qa/scenarios/_template.md`) — Claude đọc và execute qua Chrome DevTools MCP không cần suy diễn.
- Có thể resume giữa các lần chạy (skip scenario đã PASS).
- Evidence tự động capture khi FAIL (4 file: screenshot, console, network, bug ticket).
- Pass rate ≥ 80% mỗi phase (giữ tiêu chí từ `docs/qa/01-test-plan.md` §6).

### Non-Goals
- Không xây automation CI/CD (Claude là executor tương tác).
- Không test performance / load.
- Không test mobile native (chỉ responsive visual).
- Không viết unit/integration test (layer khác đã cover).
- Không chạy parallel đa-agent trong giai đoạn này (sẽ xem xét sau execution plan đầu tiên).

---

## 2. Architecture

### 2.1 Cấu trúc file mới

```
docs/qa/
├── (giữ nguyên: 00-README → 15-bug-report-template, checklists/, evidence/, flow-diagrams/)
├── scenarios/                          ← MỚI: execution artifacts
│   ├── _template.md                    ← Scenario template chuẩn (xem §3)
│   ├── sub-a-booking.md                ← Pack 1: Auth + /book + /my-history + 403 (refactor từ spec cũ)
│   ├── sub-b-admin.md                  ← Pack 2: /admin/* management screens
│   └── sub-c-reports-settings.md       ← Pack 3: /admin/reports + /admin/settings
├── e2e-execution.md                    ← MỚI: Chrome DevTools MCP playbook (auth, accounts, env setup)
├── e2e-master-report.md                ← MỚI: Sau khi chạy xong (output, không phải design)
├── reports/
│   └── e2e-master-report.md            ← Final report sau toàn bộ 4 phases
└── evidence/
    ├── run-log.md                      ← MỚI: append-only log, mỗi scenario 1 dòng
    ├── phase-{N}-summary.md            ← MỚI: summary sau mỗi phase
    ├── S-{ID}.fail.png                 ← Screenshot khi fail
    ├── S-{ID}.console.txt              ← Console messages khi fail
    ├── S-{ID}.network.json             ← Network HAR-like khi fail
    └── BUG-E2E-NEW-{NNN}-{slug}.md     ← Bug ticket (theo 15-bug-report-template.md)
```

### 2.2 Phân chia 13 màn hình → 3 pack

| Pack | Screens | Critical? | Phụ thuộc pack khác |
|------|---------|-----------|---------------------|
| **Sub-A** | `/login`, `/403`, `/dashboard`, `/book`, `/my-history` | 5/5 critical | none |
| **Sub-B** | `/admin/dashboard`, `/admin/menu`, `/admin/employees` (list+detail), `/admin/departments`, `/admin/holidays` | 2/5 critical | cần admin account |
| **Sub-C** | `/admin/reports`, `/admin/settings`, route lệch `/employees` | 2/3 critical | cần data từ Sub-B |

> Route lệch `/employees` (root, không phải `/admin/employees`) được cover trong Sub-C vì là edge case của permission/auth, không phải admin CRUD chính.

### 2.3 Vị trí design vs execution artifact

| Loại | Vị trí | Lý do |
|------|--------|-------|
| Design spec (brainstorm output) | `docs/superpowers/specs/` | Theo skill protocol |
| Scenario pack (executable) | `docs/qa/scenarios/` | Claude đọc trực tiếp để chạy |
| Execution playbook | `docs/qa/` | Reference chung cho mọi pack |
| Evidence | `docs/qa/evidence/` | Đã có sẵn từ QA đợt trước |

---

## 3. Scenario Template

File: `docs/qa/scenarios/_template.md`. Mỗi scenario là 1 block Markdown theo schema:

```markdown
### S-{PACK}-{NNN} — {Tiêu đề ngắn, dưới 80 ký tự}

**Type:** NF | AF | EF
**Screen:** {URL path}
**Priority:** P0 | P1 | P2 | P3
**Effort:** S (<5 min) | M (5-15 min) | L (>15 min)
**Pre-req:** {account role, data state, hoặc "none"}

**Setup:** (chỉ khi cần)
```bash
# ví dụ: set cutoff, seed data
```

**Steps:**
| # | Action | Element/URL | Expected |
|---|--------|-------------|----------|
| 1 | navigate_page | url=/login | Page loads, form visible |
| 2 | take_snapshot | (none) | uid cho input username lấy được |
| 3 | fill_form | uid=<from snapshot> value=emp01 | Field populated |
| ... | | | |

**Verify:**
- [ ] URL matches: `{pattern}`
- [ ] DOM contains: `{text/aria}`
- [ ] Network: `{request/response}`
- [ ] Console: no errors

**Evidence on fail:**
- Screenshot → `evidence/S-{ID}.fail.png`
- Console log → `evidence/S-{ID}.console.txt`
- Network → `evidence/S-{ID}.network.json`
- Bug ticket → `evidence/BUG-E2E-NEW-{NNN}-{slug}.md`

**Notes:** {business rule liên quan, references Sub-A cũ, v.v.}
```

### 3.1 Quy tắc đặt ID

- Format: `S-{PACK}-{NNN}` — PACK ∈ {A, B, C}, NNN zero-padded 3 chữ số, bắt đầu từ 001
- NNN đánh liên tục trong pack, không reset giữa NF/AF/EF
- Type ghi trong field, không ghi trong ID

### 3.2 Mapping Sub-A cũ → ID mới (refactor preview)

| ID cũ | ID mới | Type | Title |
|-------|--------|------|-------|
| AUTH-01 | S-A-001 | NF | Login employee thành công |
| AUTH-02 | S-A-002 | NF | Login admin thành công |
| AUTH-03 | S-A-003 | AF | Sai password → lỗi tiếng Việt có dấu |
| AUTH-04 | S-A-004 | EF | Submit khi backend down |
| AUTH-05 | S-A-005 | NF | Logout xóa cookie + invalidate JWT |
| BOOK-01 | S-A-006 | NF | Đăng ký "Có ăn" cho ngày mai |
| BOOK-02 | S-A-007 | NF | Đăng ký "Không ăn" cho ngày mai |
| BOOK-03 | S-A-008 | AF | Rapid click 2 nút cùng lúc |
| BOOK-04 | S-A-009 | EF | Đăng ký cho ngày hôm nay (quá khứ) |
| BOOK-05 | S-A-010 | AF | Đăng ký cho T7/CN (weekend) |
| BOOK-06 | S-A-011 | AF | Sau cutoff: button disabled |
| BOOK-07 | S-A-012 | EF | Ngày lễ: không thể đăng ký |
| BOOK-08 | S-A-013 | AF | Đăng ký ngoài cửa sổ 4 tuần |
| BOOK-09 | S-A-014 | NF | Xem lịch sử |
| BOOK-10 | S-A-015 | NF | Dashboard hiển thị thông tin tóm tắt |
| HIST-01 | S-A-016 | NF | /my-history với data |
| HIST-02 | S-A-017 | NF | /my-history empty state |
| HIST-03 | S-A-018 | AF | /my-history filter theo tháng |
| PERM-01 | S-A-019 | NF | Employee truy cập /admin/dashboard → 403 |
| PERM-02 | S-A-020 | EF | Direct URL admin khi chưa login |

(Chi tiết step-by-step sẽ được viết trong execution plan, không thuộc scope design này.)

### 3.3 Escape hatch cho scenario đặc thù

Một số scenario không fit template (race condition, animation timing) — được phép:
- Thêm field `**Race-condition notes:**` dưới `Notes`
- Step "verify" có thể dùng `wait_for` với timeout ngắn (100–500ms) để giả lập race
- Nếu không verify được tự động → ghi `**Manual required:**` + mô tả bước manual

---

## 4. Data Flow (Chrome DevTools MCP Execution)

### 4.1 Flow tổng quan cho 1 scenario

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SETUP                                                     │
│    - Reset DB state (nếu cần)                                │
│    - Login account phù hợp (set cookie)                      │
│    - Apply data fixture                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. EXECUTE STEPS (Chrome DevTools MCP, tuần tự)              │
│    navigate_page → take_snapshot → fill_form/click/press_key │
│    → wait_for (async) → take_snapshot (re-verify uid)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. VERIFY (4 kênh assertion song song)                       │
│    URL pattern | DOM/a11y | Network | Console                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
                ┌──────┴──────┐
                │ All pass?   │
                └──────┬──────┘
                  Yes  │  No
                       │  └──→ 4. CAPTURE EVIDENCE (xem §5)
                       ▼
              Ghi 1 dòng vào run-log.md → tiếp scenario sau
```

### 4.2 Chrome DevTools MCP tools sẽ dùng

| Tool | Vai trò | Lưu ý |
|------|---------|-------|
| `navigate_page(url=...)` | Bước navigate | Không dùng selector — chỉ URL |
| `take_snapshot()` | Lấy uid element từ a11y tree | **Bắt buộc** trước mỗi fill/click |
| `fill_form([{uid, value}, ...])` | Fill nhiều field 1 lần | Ưu tiên hơn `fill` riêng lẻ |
| `click(uid=...)` | Click element | uid từ snapshot gần nhất |
| `press_key(key=...)` | Submit form, navigation | Thay cho phím Enter |
| `wait_for(text=[...])` | Đợi text xuất hiện | Mặc định timeout 5s |
| `list_network_requests()` | Verify API call | Filter theo URL pattern |
| `list_console_messages(types=["error"])` | Bắt React/hydration error | Mặc định check level=error |
| `take_screenshot()` | Visual evidence | Chỉ dùng khi fail |

### 4.3 Tại sao `take_snapshot()` thay vì CSS selector

Chrome DevTools MCP không nhận CSS selector trực tiếp — phải lấy `uid` từ accessibility tree. Đây là **hard constraint** của tool → scenario template **phải ghi action theo element ngữ nghĩa** (vd: "click nút 'Đăng nhập'"), không ghi CSS class/id.

### 4.4 Phase order (chạy tuần tự)

| Phase | Pack | Pre-req | Note |
|-------|------|---------|------|
| 1. Auth bootstrap | Sub-A (S-A-001 đến 005) | none | Verify login mechanic + tạo session cho cả employee + admin |
| 2. Employee flow | Sub-A (S-A-006 đến 020) | Phase 1 | Dùng employee session |
| 3. Admin management | Sub-B | Phase 1 | Dùng admin session |
| 4. Reports + Settings | Sub-C | Phase 1, 3 | Cần data từ admin Sub-B |

**Giữa các phase: chạy tuần tự** để evidence/debug rõ ràng. Parallel sẽ xem xét sau khi 1 phase đầu chạy ổn.

---

## 5. Error Handling & Evidence

### 5.1 Fail triggers

Một scenario FAIL khi bất kỳ điều nào xảy ra:
1. **Verify mismatch:**
   - URL không match pattern expected
   - DOM/a11y thiếu text/aria expected
   - Network response ≠ 2xx (khi API expected 200)
   - Console có message level `error`
2. **Step timeout:** `wait_for` quá timeout (mặc định 5s)
3. **Pre-req thiếu:** account bị khóa / DB rỗng / cookie hết hạn

### 5.2 Evidence capture tự động (4 file khi FAIL)

```
evidence/
├── S-{ID}.fail.png           ← take_screenshot tại thời điểm fail
├── S-{ID}.console.txt        ← list_console_messages output
├── S-{ID}.network.json       ← list_network_requests (HAR-like)
└── BUG-E2E-NEW-{NNN}-{slug}.md  ← Bug ticket (xem §5.3)
```

Filename slug: kebab-case từ tiêu đề ngắn, tối đa 40 ký tự.

### 5.3 Bug ticket tự sinh (theo `15-bug-report-template.md`)

```markdown
## BUG-E2E-NEW-{NNN} — {Tiêu đề ngắn}

- **Scenario:** S-{PACK}-{NNN}
- **Screen:** {URL path}
- **Type:** NF | AF | EF
- **Severity:** Critical | High | Medium | Low
- **Expected:** {từ scenario Verify block}
- **Actual:** {từ evidence}
- **Steps to reproduce:** {từ scenario Steps block}
- **Evidence:**
  - Screenshot: `evidence/S-{ID}.fail.png`
  - Console: `evidence/S-{ID}.console.txt`
  - Network: `evidence/S-{ID}.network.json`
- **Root cause hypothesis:** {Claude phân tích từ evidence}
```

### 5.4 Pass criteria

- Pass rate ≥ 80% mỗi phase (theo `docs/qa/01-test-plan.md` §6)
- Không còn bug Critical/High chưa có owner
- Mỗi bug ≥ Medium có evidence folder đầy đủ 4 file

### 5.5 Stop rule

- Cùng 1 scenario fail 3 lần liên tiếp → **STOP**, ghi `evidence/STUCK-{ID}.md`, chuyển manual investigation
- 1 phase < 50% pass → **STOP toàn phase**, báo cáo user trước khi tiếp

### 5.6 Logging format (`run-log.md`)

```
[2026-06-22 14:32:01] S-A-006 PASS (3.2s)
[2026-06-22 14:32:18] S-A-007 FAIL (timeout 5s) → BUG-E2E-NEW-005
[2026-06-22 14:32:35] S-A-008 SKIP (pre-req fail từ S-A-007)
```

Format: `[ISO timestamp] {SCENARIO-ID} {STATUS} {duration/timeout} → {bug-id or empty}`

Resume rule: scenario đã PASS trong lần chạy trước được SKIP khi chạy lại (tránh tốn thời gian, trừ khi user yêu cầu `--rerun-all`).

---

## 6. Testing (Meta-test Plan Quality)

### 6.1 Coverage check

- Mỗi màn hình trong sitemap **phải có ≥ 1 NF scenario**
- 5 màn hình "critical path" **phải có đủ NF + AF + EF**:
  - `/login` (entry point)
  - `/book` (core business)
  - `/my-history` (employee verify)
  - `/admin/menu` (admin core)
  - `/admin/reports` (admin output)
- 8 màn hình còn lại: NF + 1 AF (edge case quan trọng) + 1 EF (auth/permission)

### 6.2 Ước lượng số scenario mỗi pack

| Pack | Screens | NF | AF | EF | Tổng |
|------|---------|----|----|----|------|
| Sub-A | 5 (critical) | 8 | 6 | 4 | **18** |
| Sub-B | 5 (2 critical + 3 standard) | 7 | 6 | 4 | **17** |
| Sub-C | 3 (2 critical + 1 standard) | 3 | 4 | 4 | **11** |
| **Tổng** | **13 màn hình** | **18** | **16** | **12** | **46** |

### 6.3 Scenario self-review (5 tiêu chí mỗi scenario)

1. **Specific** — element/URL là concrete (vd: `url=/book`, không phải "trang booking")
2. **Observable** — expected là thứ verify được qua 4 kênh (URL/DOM/Network/Console)
3. **Independent** — chạy được sau pre-req, không lệ thuộc scenario khác (trừ khi đã ghi rõ)
4. **Reversible** — setup có rollback (vd: set cutoff về giá trị cũ)
5. **Has assertion** — mỗi step có Expected; Verify block có ≥ 2 bullet

### 6.4 Rehearsal

Trước khi full run:
- Chạy 3 scenario NF đầu tiên (1 mỗi pack) để verify template + Chrome DevTools MCP hoạt động
- Nếu rehearsal PASS → full run
- Nếu rehearsal FAIL → sửa template TRƯỚC khi chạy tiếp

### 6.5 Reporting cadence

- Sau mỗi phase: ghi `evidence/phase-{N}-summary.md` (pass/fail count + bug list)
- Sau toàn bộ 4 phases: ghi `reports/e2e-master-report.md` (executive summary + recommendations)

---

## 7. Scenario Inventory (Outline)

> Outline này để review scope. Chi tiết step-by-step sẽ viết trong execution plan.

### Sub-A — Employee & Auth (5 màn hình, 18-20 scenarios)

| Màn hình | NF | AF | EF | Note |
|----------|----|----|----|------|
| `/login` | 2 | 1 | 1 | Employee + Admin login, sai password, backend down |
| `/logout` | 1 | 0 | 0 | Cookie clear + JWT invalidation |
| `/403` | 0 | 0 | 1 | Hiển thị đúng khi employee vào admin route |
| `/dashboard` | 1 | 0 | 0 | Summary card hiển thị đúng |
| `/book` | 2 | 4 | 1 | Có ăn / Không ăn; rapid click; weekend; sau cutoff; ngoài cửa sổ 4 tuần; ngày lễ |
| `/my-history` | 1 | 1 | 0 | Xem + filter tháng; empty state |
| Cross-cutting (employee vào admin route) | 1 | 0 | 1 | 403 page render đúng |

### Sub-B — Admin Management (5 màn hình, 17-18 scenarios)

| Màn hình | NF | AF | EF | Note |
|----------|----|----|----|------|
| `/admin/dashboard` | 1 | 0 | 0 | Stats card + link nav |
| `/admin/menu` | 2 | 2 | 1 | CRUD daily menu; batch update; ngày lễ conflict; weekend; empty state |
| `/admin/employees` (list) | 1 | 1 | 1 | List + search; pagination; delete có ràng buộc |
| `/admin/employees/[id]` (detail) | 1 | 1 | 0 | View + edit; change dept; IDOR attempt |
| `/admin/departments` | 1 | 1 | 1 | CRUD; rename conflict; delete có nhân viên |
| `/admin/holidays` | 1 | 1 | 1 | CRUD; trùng ngày; ngày trong quá khứ |

### Sub-C — Reports & Settings (3 màn hình, 11-12 scenarios)

| Màn hình | NF | AF | EF | Note |
|----------|----|----|----|------|
| `/admin/reports` | 2 | 2 | 2 | Render table + filter; CSV export; XLSX export; date range empty; permission denied |
| `/admin/settings` | 1 | 1 | 1 | Cutoff thay đổi → effect; validation; conflict |
| `/employees` (root, route lệch) | 0 | 1 | 1 | Redirect đúng cho cả 2 role; middleware gate |

**Tổng cuối cùng:** ước lượng ~46-50 scenarios (16 NF + 18 AF + 12 EF).

---

## 8. Out of Scope

- Performance / load testing
- Mobile native app
- Backend logic không qua UI (Prisma trực tiếp, scripts seed)
- CI/CD pipeline
- Parallel multi-agent execution (sẽ xem xét sau execution plan đầu tiên)

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Sub-A refactor mất nhiều effort, trễ các pack khác | Refactor song song với viết Sub-B; Sub-A là blocker nhỏ nhất (đã có spec cũ) |
| Chrome DevTools MCP update API → tool call sai | Pin version + rehearsal 3 scenario trước mỗi phase |
| Data state pollution giữa scenarios | Setup block có rollback rõ ràng; run-log.md cho phép skip PASS |
| Database state lệch sau khi fix bug | `scripts/qa-db.mjs` reset giữa các phase |

---

## 10. References

- `docs/qa/00-README.md` — QA overview, nguyên tắc 3 flow
- `docs/qa/01-test-plan.md` — Test plan + phases + stop criteria
- `docs/qa/02-sitemap.md` — Page tree + API routes
- `docs/qa/03-test-data.md` — Accounts seed
- `docs/qa/04-auth-flows.md` — Auth flow diagrams
- `docs/qa/05-employee-booking.md` — Sub-A spec hiện tại (sẽ refactor)
- `docs/qa/15-bug-report-template.md` — Bug ticket template
- `docs/qa/evidence/BUG-E2E-NEW-001..004.md` — Bug đã phát hiện đợt trước
- `scripts/qa-check.sh`, `qa-check2.sh`, `qa-sidebar-check.sh` — Smoke scripts hiện có
- `docs/superpowers/specs/2026-06-22-e2e-core-booking-design.md` — DEPRECATED, sẽ refactor về `docs/qa/scenarios/sub-a-booking.md`