# BAOCOM — Flow Diagrams Index

Bộ diagram ASCII mô tả tất cả luồng nghiệp vụ của hệ thống, theo 3 dòng flow (Normal / Alternative / Exception).

## Files

| File | Nội dung | Số diagram |
|------|----------|-------------|
| [01-overview.md](01-overview.md) | Use case + UI flow tổng quan | 3 |
| [02-auth-flows.md](02-auth-flows.md) | Login + Auth boundary | 6 |
| [03-booking-flows.md](03-booking-flows.md) | Employee booking + date validation | 8 |
| [04-admin-flows.md](04-admin-flows.md) | Menu, Reports, Logout | 5 |
| [05-crud-flows.md](05-crud-flows.md) | Employees, Departments, Holidays, Override, Settings, Cutoff effect | 8 |
| [06-security-and-journey.md](06-security-and-journey.md) | Security attacks + End-to-end journey | 5 |

**Tổng: 35 diagrams.**

## Diagram types sử dụng

1. **Use Case Diagram** — actors + use cases
2. **UI Flow Diagram** — page navigation
3. **Sequence Diagram** — time-ordered interactions
4. **Stage Diagram** — workflow stages
5. **Data Flow Diagram** — data movement
6. **State Machine** — decision trees
7. **Workflow Diagram** — branching with conditions
8. **Attack Scenario Diagram** — security threats
9. **End-to-End Journey** — user lifecycle

## Coverage

### Normal Flows (NF) documented
- ✅ Login (admin, employee)
- ✅ View Dashboard
- ✅ View Book page
- ✅ View My History
- ✅ Admin Dashboard / Menu / Employees / Departments / Holidays / Reports / Settings
- ✅ Create/Update/Delete operations cho tất cả entities
- ✅ Logout
- ✅ Export reports (CSV, XLSX)
- ✅ Admin override locked registration
- ✅ Cutoff config update

### Alternative Flows (AF) documented
- ✅ Click "Quên mật khẩu?"
- ✅ Change booking (eating ↔ not_eating)
- ✅ Same week navigation
- ✅ Thêm món mới (find-or-create)
- ✅ Filter reports theo department
- ✅ Update employee role
- ✅ Disable employee (soft delete)
- ✅ Soft disable holiday
- ✅ Add meal to existing day
- ✅ Admin bypass date validation
- ✅ Export with different param aliases

### Exception Flows (EF) documented
- ✅ Wrong password → 401
- ✅ Empty body → 400
- ✅ Malformed JSON → 400
- ✅ SQL injection attempt → 400 (clear validation error)
- ✅ Account disabled → 401
- ✅ Rate limit exceeded → 429
- ✅ Cookie tampered → 401
- ✅ Token expired (tokenVersion) → 401
- ✅ Date in past → 400 (DATE_NOT_FUTURE)
- ✅ Date weekend → 400 (WEEKEND)
- ✅ Date out of 4-week window → 400 (OUTSIDE_CURRENT_WEEK)
- ✅ Date after cutoff → 400 (DATE_LOCKED)
- ✅ Invalid date format → 400
- ✅ Unauthorized admin access → 403 redirect
- ✅ Duplicate username → 409
- ✅ Duplicate department name → 409
- ✅ Duplicate holiday date → 409
- ✅ Weak password → 400
- ✅ XSS in name (escaped by React, no execution)
- ✅ Delete department with employees → 400
- ✅ Invalid cutoff values → 400
- ✅ Missing query params → 400
- ✅ /403 route doesn't exist (404)

## Xem diagram theo role

### Cho Developer mới
1. Bắt đầu với [01-overview.md](01-overview.md) — hiểu tổng quan actors + use cases
2. Đọc [02-auth-flows.md](02-auth-flows.md) — hiểu authentication flow
3. Đọc [03-booking-flows.md](03-booking-flows.md) — core feature

### Cho QA / Tester
1. [01-overview.md](01-overview.md) — UI flow toàn cảnh
2. [03-booking-flows.md](03-booking-flows.md) — date validation edge cases
3. [04-admin-flows.md](04-admin-flows.md) — admin reports + logout
4. [05-crud-flows.md](05-crud-flows.md) — CRUD error cases

### Cho Security Reviewer
1. [02-auth-flows.md](02-auth-flows.md) — auth + middleware
2. [04-admin-flows.md](04-admin-flows.md) — logout invalidation
3. [06-security-and-journey.md](06-security-and-journey.md) — attack scenarios
