# Roadmap — Báo Cơm Trưa Công Ty v1

**Date:** 2026-05-16
**Mode:** mvp
**Granularity:** fine
**Coverage:** 38/38 v1 requirements mapped

## Phases

- [ ] **Phase 1: Business Date & Brownfield Correctness** - Normalize date semantics and fix known blocking report/menu contract bugs before changing workflows.
- [ ] **Phase 2: Access & Employee Lifecycle** - Ensure Admin/HR-created accounts and active/inactive employee rules work for v1 operations.
- [ ] **Phase 3: Default-Eat Employee Registration** - Deliver employee absence-first workflow with correct eligibility, status display, and edit locks.
- [ ] **Phase 4: Cutoff Policy & Admin Overrides** - Make cutoff configurable, enforce it server-side, and allow auditable Admin/HR corrections.
- [ ] **Phase 5: Weekly Menu Visibility & Reliability** - Make weekly menu management/viewing reliable across admin and employee flows.
- [ ] **Phase 6: Admin Daily Operations Dashboard** - Let Admin/HR answer daily ordering questions for today, next workday, and selected dates.
- [ ] **Phase 7: History, Reports & Server CSV** - Provide personal/admin history, date-range reports, and CSV exports consistent with previews.
- [ ] **Phase 8: v1 Hardening & Guardrails** - Add validation, automated coverage, and explicit v1 scope guardrails across touched paths.

## Phase Details

### Phase 1: Business Date & Brownfield Correctness
**Goal**: Users see reports, menus, history, and cutoff calculations tied to the same Vietnamese business date with known brownfield contract bugs removed.
**Mode:** mvp
**Depends on**: Nothing
**Requirements**: DATE-01, DATE-02, QUAL-01, QUAL-02
**Success Criteria** (what must be TRUE):
  1. User-facing menu, report, history, and cutoff dates resolve to the intended `Asia/Ho_Chi_Minh` business date.
  2. Admin report date filters return data for the requested inclusive date values instead of treating a date as a user id.
  3. Daily menu by-date API responses match the client type and do not require unsafe local casting to read returned data.
  4. Date keys displayed in UI do not shift because of UTC conversion when users view or edit business dates.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Access & Employee Lifecycle
**Goal**: Admin/HR and employee accounts support v1 access while active/inactive employee state controls future meal participation.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, USER-01, USER-02
**Success Criteria** (what must be TRUE):
  1. Admin/HR can log in with a pre-created account and reach admin functions.
  2. Employee can log in with an Admin/HR-created account and reach employee functions.
  3. Admin/HR can create, edit, and deactivate employees.
  4. Inactive employees cannot create new absence changes and are excluded from current/future meal counts.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Default-Eat Employee Registration
**Goal**: Active employees normally do nothing to get lunch and only act when reporting or cancelling an absence on eligible open days.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: DATE-03, DATE-04, REG-01, REG-02, REG-03, REG-04, REG-05
**Success Criteria** (what must be TRUE):
  1. Active employees are counted as eating by default on meal-eligible weekdays when no absence exists.
  2. Employee can report absence for an eligible open business date before cutoff.
  3. Employee can cancel a prior absence before cutoff and return to default eating status.
  4. Employee cannot change absence state for past days, weekends, holidays, or locked days, and sees the reason.
  5. Employee UI clearly shows `Mặc định có cơm`, `Đã báo nghỉ`, `Đã chốt`, and non-editable reasons for viewed dates.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Cutoff Policy & Admin Overrides
**Goal**: Company cutoff rules are visible, configurable, enforced by backend, and correctable by Admin/HR with override metadata.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: CUT-01, CUT-02, CUT-03, CUT-04, CUT-05
**Success Criteria** (what must be TRUE):
  1. Admin/HR can configure the global lunch absence cutoff time.
  2. Backend rejects employee absence report/cancel requests after cutoff, regardless of client behavior.
  3. Employee sees cutoff time and open/locked state for the date being viewed.
  4. Admin/HR can change an employee registration after cutoff when operational correction is needed.
  5. Each after-cutoff admin override records actor, timestamp, applied date, new status, and note.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Weekly Menu Visibility & Reliability
**Goal**: Admin/HR can manage weekly lunch menus and employees can view them by Vietnamese business week without false save success.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: MENU-01, MENU-02, MENU-03, MENU-04
**Success Criteria** (what must be TRUE):
  1. Admin/HR can manage lunch menu entries across a work week.
  2. Employee can view lunch menu for the current or selected work week.
  3. Menu dates align with `Asia/Ho_Chi_Minh` business dates.
  4. Weekly menu save reports a clear error when any day or meal fails to save and does not show false success.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Admin Daily Operations Dashboard
**Goal**: Admin/HR can quickly know how many portions to order and who is absent for selected operational dates.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04, OPS-05
**Success Criteria** (what must be TRUE):
  1. Admin/HR can select a date and see the number of lunch portions to order.
  2. Daily portion count equals active meal-eligible employees minus valid absence reports.
  3. Admin/HR can see which employees reported absence for the selected date.
  4. Admin/HR can see active employee count, absence count, eating count, holiday/weekend state, and cutoff state for the selected date.
  5. Admin/HR dashboard shows quick ordering views for today and the next workday.
**Plans**: TBD
**UI hint**: yes

### Phase 7: History, Reports & Server CSV
**Goal**: Employees and Admin/HR can review effective eating/absence history and export server-generated CSV matching on-screen reports.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: RPT-01, RPT-02, RPT-03, RPT-04, RPT-05, RPT-06, RPT-07
**Success Criteria** (what must be TRUE):
  1. Employee can view personal history with effective status per day: default eating, absent, holiday/weekend, or locked.
  2. Admin/HR can view eating/absence history for a selected employee.
  3. Admin/HR can filter reports by an inclusive date range and see effective status using the same logic as the daily dashboard.
  4. Admin/HR can export server-generated CSV for a day or date range with date/range, generated time, timezone, total portions, and absent employee list.
  5. CSV output matches the report preview for the same filters.
**Plans**: TBD
**UI hint**: yes

### Phase 8: v1 Hardening & Guardrails
**Goal**: Touched v1 paths are validated and covered by tests while excluded product directions remain out of v1.
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: QUAL-03, QUAL-04, QUAL-05
**Success Criteria** (what must be TRUE):
  1. Touched API/report/cutoff paths return clear validation errors for invalid query and body input.
  2. Automated tests cover date/default-eat/report/cutoff happy paths and key edge cases.
  3. Automated tests catch holiday/weekend exclusion and CSV/preview consistency regressions.
  4. v1 contains no kitchen role, payroll automation, native app, notifications, or meal choice feature.
**Plans**: TBD

## Requirement Coverage

| Requirement | Phase |
|-------------|-------|
| AUTH-01 | Phase 2 |
| AUTH-02 | Phase 2 |
| AUTH-03 | Phase 2 |
| USER-01 | Phase 2 |
| USER-02 | Phase 2 |
| DATE-01 | Phase 1 |
| DATE-02 | Phase 1 |
| DATE-03 | Phase 3 |
| DATE-04 | Phase 3 |
| REG-01 | Phase 3 |
| REG-02 | Phase 3 |
| REG-03 | Phase 3 |
| REG-04 | Phase 3 |
| REG-05 | Phase 3 |
| CUT-01 | Phase 4 |
| CUT-02 | Phase 4 |
| CUT-03 | Phase 4 |
| CUT-04 | Phase 4 |
| CUT-05 | Phase 4 |
| MENU-01 | Phase 5 |
| MENU-02 | Phase 5 |
| MENU-03 | Phase 5 |
| MENU-04 | Phase 5 |
| OPS-01 | Phase 6 |
| OPS-02 | Phase 6 |
| OPS-03 | Phase 6 |
| OPS-04 | Phase 6 |
| OPS-05 | Phase 6 |
| RPT-01 | Phase 7 |
| RPT-02 | Phase 7 |
| RPT-03 | Phase 7 |
| RPT-04 | Phase 7 |
| RPT-05 | Phase 7 |
| RPT-06 | Phase 7 |
| RPT-07 | Phase 7 |
| QUAL-01 | Phase 1 |
| QUAL-02 | Phase 1 |
| QUAL-03 | Phase 8 |
| QUAL-04 | Phase 8 |
| QUAL-05 | Phase 8 |

Mapped: 38/38 v1 requirements. No orphans. No duplicates.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Business Date & Brownfield Correctness | 0/0 | Not started | - |
| 2. Access & Employee Lifecycle | 0/0 | Not started | - |
| 3. Default-Eat Employee Registration | 0/0 | Not started | - |
| 4. Cutoff Policy & Admin Overrides | 0/0 | Not started | - |
| 5. Weekly Menu Visibility & Reliability | 0/0 | Not started | - |
| 6. Admin Daily Operations Dashboard | 0/0 | Not started | - |
| 7. History, Reports & Server CSV | 0/0 | Not started | - |
| 8. v1 Hardening & Guardrails | 0/0 | Not started | - |
