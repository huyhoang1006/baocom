# Playwright E2E Test Specification - Admin Management Flows

**Project:** BaoCom Meal Registration System
**Test Suite:** Admin Management Module
**Last Updated:** 2026-05-13
**Test Framework:** Playwright

---

## 1. Test Architecture

### 1.1 Page Objects Pattern

```
tests/e2e/
├── page-objects/
│   ├── AdminDashboard.page.ts
│   ├── AdminEmployees.page.ts
│   ├── AdminReports.page.ts
│   └── common/
│       ├── Header.component.ts
│       ├── Modal.component.ts
│       ├── Notification.component.ts
│       └── Table.component.ts
├── fixtures/
│   └── admin-users.fixture.ts
├── helpers/
│   └── auth.helper.ts
└── specs/
    ├── admin-dashboard.spec.ts
    ├── admin-employees.spec.ts
    ├── admin-reports.spec.ts
    └── admin-permissions.spec.ts
```

### 1.2 Test Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 1,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  headless: true,
  viewport: { width: 1280, height: 720 },
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  storageState: '.auth/admin.json',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
})
```

---

## 2. Test Data Fixtures

### 2.1 Admin User Accounts

| Username | Password | Role | Expected Access |
|----------|----------|------|-----------------|
| admin001 | Admin@123 | admin | Full admin access |
| employee001 | Emp@123 | employee | No admin access |
| manager001 | Mgr@123 | manager | No admin access |

### 2.2 Test Employees

```typescript
const testEmployees = [
  { name: 'Nguyen Van A', department: 'Kỹ thuật', phone: '0912345678', email: 'nva@company.com' },
  { name: 'Tran Thi B', department: 'Kinh doanh', phone: '0912345679', email: 'ttb@company.com' },
  { name: 'Le Van C', department: 'Nhân sự', phone: '0912345680', email: 'lvc@company.com' },
]
```

---

## 3. Test Cases

### 3.1 Admin Dashboard Tests

#### TC-DASH-001: Dashboard Stats Display
**Priority:** P0
**Estimated Time:** 15s

**Description:** Admin dashboard displays today's registration statistics correctly

**Steps:**
1. Navigate to `/admin/dashboard`
2. Authenticate as admin user
3. Wait for stats to load (loading spinner disappears)

**Selectors:**
- `header:has-text("Dashboard")`
- `.bg-primary:has-text("Admin")`
- `.grid.grid-cols-2 > div` (stats cards)
- `text=Tổng nhân viên`
- `text=Đang ăn hôm nay`
- `text=Không ăn`
- `text=Tỷ lệ đăng ký`

**Assertions:**
- Page title "Dashboard" with Admin badge visible
- Four stat cards displayed with labels: Tổng nhân viên, Đang ăn hôm nay, Không ăn, Tỷ lệ đăng ký
- Stats values are non-negative numbers or percentage string
- Loading skeleton disappears within 5s
- Quick action buttons visible: "Xuất báo cáo", "Quản lý nhân sự"

---

#### TC-DASH-002: Dashboard Stats Loading States
**Priority:** P1
**Estimated Time:** 10s

**Description:** Dashboard shows proper loading and error states

**Steps:**
1. Navigate to `/admin/dashboard`
2. Observe initial loading state
3. Wait for content to load

**Selectors:**
- `div.animate-pulse` (loading skeleton)
- `.bg-error-bg` (error banner)
- `button:has-text("Thử lại")`

**Assertions:**
- Loading skeleton displays 4 placeholder cards during fetch
- After success, actual stat values replace skeletons
- On error, red error banner appears with "Thử lại" button

---

#### TC-DASH-003: Dashboard Quick Actions Navigation
**Priority:** P1
**Estimated Time:** 8s

**Description:** Quick action buttons navigate to correct pages

**Steps:**
1. Navigate to `/admin/dashboard`
2. Click "Xuất báo cáo" button
3. Verify navigation to reports page
4. Navigate back to dashboard
5. Click "Quản lý nhân sự" button
6. Verify navigation to employees page

**Selectors:**
- `a:has-text("Xuất báo cáo")`
- `a:has-text("Quản lý nhân sự")`

**Assertions:**
- Clicking "Xuất báo cáo" navigates to `/admin/reports`
- Clicking "Quản lý nhân sự" navigates to `/admin/employees`

---

### 3.2 Admin Employees Tests

#### TC-EMP-001: Employee List Display
**Priority:** P0
**Estimated Time:** 20s

**Description:** Employees page displays all employees with search functionality

**Steps:**
1. Navigate to `/admin/employees`
2. Authenticate as admin
3. Wait for employee list to load

**Selectors:**
- `h1:has-text("Nhân Sự")`
- `input[placeholder="Tìm kiếm..."]`
- `button:has-text("Thêm nhân viên")`
- `button:has-text("Import")`
- `.rounded-\[18px\].p-4` (employee cards)

**Assertions:**
- Page header "Nhân Sự" visible
- Search input visible
- "Thêm nhân viên" and "Import" buttons visible
- Employee cards display with avatar, name, username, status badge
- Active employees show "Đang hoạt động" badge (green)
- Inactive employees show "Đã khóa" badge (red) with reduced opacity

---

#### TC-EMP-002: Search Employees
**Priority:** P1
**Estimated Time:** 15s

**Description:** Search filters employee list by name or username

**Steps:**
1. Navigate to `/admin/employees`
2. Wait for employees to load
3. Enter search query in search input
4. Observe filtered results

**Selectors:**
- `input[placeholder="Tìm kiếm..."]`
- `.text-\[17px\].font-semibold` (employee names)
- `.font-mono` (usernames)

**Assertions:**
- Typing in search input filters list in real-time
- Results match search query in name OR username
- Empty state message "Không tìm thấy nhân viên" shows when no matches
- Clearing search restores full list

---

#### TC-EMP-003: Add New Employee
**Priority:** P0
**Estimated Time:** 30s

**Description:** Admin can add a new employee via modal form

**Steps:**
1. Navigate to `/admin/employees`
2. Click "Thêm nhân viên" button
3. Fill in form: name, phone, email (optional), department (optional)
4. Submit form
5. Verify success notification

**Selectors:**
- `button:has-text("Thêm nhân viên")`
- `h2:has-text("Thêm nhân viên")` (modal)
- `input[placeholder="Nhập họ và tên"]`
- `input[placeholder="0912 345 678"]`
- `input[placeholder="email@company.com"]`
- `select` (department dropdown)
- `button:has-text("Thêm mới")`
- `.fixed:has(.animate-scale-in)` (modal backdrop)
- `.fixed.top-6` (notification toast)

**Form Data:**
```typescript
{
  name: 'Test Employee New',
  phone: '0987654321',
  email: 'testnew@company.com',
  department: 'Kỹ thuật'
}
```

**Assertions:**
- Modal opens with title "Thêm nhân viên"
- Form validation: name is required (minimum 2 characters)
- On success: modal closes, new employee appears in list
- Success notification appears: "Đã thêm nhân viên mới"
- Notification auto-dismisses after 3 seconds
- New employee shows in list with auto-generated username

---

#### TC-EMP-004: Edit Employee
**Priority:** P0
**Estimated Time:** 30s

**Description:** Admin can edit existing employee details

**Steps:**
1. Navigate to `/admin/employees`
2. Click edit button (pencil icon) on an employee card
3. Modify employee name or other fields
4. Save changes
5. Verify success notification

**Selectors:**
- `.material-symbols-outlined:has-text("edit")` (edit buttons)
- `h2:has-text("Chỉnh sửa nhân viên")` (modal title)
- `input[placeholder="Nhập họ và tên"]` (pre-filled)
- `button:has-text("Lưu")`

**Assertions:**
- Edit modal opens with pre-filled form data
- Modal title shows "Chỉnh sửa nhân viên"
- Name field is pre-populated with current name
- Saving updates the employee card with new name
- Success notification: "Đã cập nhật thông tin nhân viên"
- Employee list reflects updated data

---

#### TC-EMP-005: Delete (Deactivate) Employee
**Priority:** P0
**Estimated Time:** 25s

**Description:** Admin can deactivate an employee account

**Steps:**
1. Navigate to `/admin/employees`
2. Click delete button (trash icon) on an employee
3. Confirm deletion in modal dialog
4. Verify status change and notification

**Selectors:**
- `.material-symbols-outlined:has-text("delete")` (delete buttons)
- `h2:has-text("Khóa tài khoản nhân viên này?")` (confirmation modal)
- `.bg-error` (delete confirm button)
- `button:has-text("Xóa")`
- `.bg-error-bg.text-error` (error badge for inactive)

**Assertions:**
- Delete confirmation modal appears with employee name
- Warning text: "Khóa tài khoản [name]? Hành động này có thể hoàn tác."
- Confirming deactivates employee (status changes to "Đã khóa")
- Card shows reduced opacity (opacity-60)
- Badge changes to red error style: "Đã khóa"
- Success notification: "Đã khóa nhân viên \"[name]\""
- Cancel closes modal without changes

---

#### TC-EMP-006: Form Validation
**Priority:** P1
**Estimated Time:** 20s

**Description:** Add/Edit forms validate input correctly

**Steps:**
1. Navigate to `/admin/employees`
2. Open add employee modal
3. Attempt to submit with empty/invalid data

**Selectors:**
- `.border-error` (error styling on fields)
- `.text-xs.text-error` (error messages)

**Assertions:**
- Empty name field shows error: "Vui lòng nhập họ và tên"
- Name less than 2 chars shows error: "Họ và tên phải có ít nhất 2 ký tự"
- Invalid email format shows error: "Email không hợp lệ"
- Submit button is disabled when validation errors exist
- Error fields have red border styling

---

#### TC-EMP-007: Employee Modal Close Behavior
**Priority:** P2
**Estimated Time:** 10s

**Description:** Modal closes correctly via backdrop click, cancel button, or escape

**Steps:**
1. Open add employee modal
2. Click outside modal (backdrop)
3. Verify modal closes without saving

**Selectors:**
- `.absolute.inset-0.bg-black/40` (modal backdrop)

**Assertions:**
- Clicking backdrop closes modal
- Pressing Escape key closes modal
- Clicking Cancel button closes modal
- Form data is not persisted when modal closes

---

### 3.3 Admin Reports Tests

#### TC-REP-001: Report Type Selection
**Priority:** P0
**Estimated Time:** 10s

**Description:** User can select day, week, or month report type

**Steps:**
1. Navigate to `/admin/reports`
2. Observe report type selector pills

**Selectors:**
- `.flex.items-center.justify-center.gap-2` (type selector container)
- `button:has-text("Ngày")`
- `button:has-text("Tuần")`
- `button:has-text("Tháng")`
- `.bg-primary.text-on-primary` (active pill)

**Assertions:**
- Three report type pills visible: Ngày, Tuần, Tháng
- Active type has primary background color
- Inactive types have surface-container background
- Clicking a type switches active state and clears previous data

---

#### TC-REP-002: Day Report Generation
**Priority:** P0
**Estimated Time:** 25s

**Description:** Generate and preview day report

**Steps:**
1. Navigate to `/admin/reports`
2. Select "Ngày" report type
3. Pick a date from date picker
4. Click "Xem trước" button
5. Observe report preview

**Selectors:**
- `input[type="date"]`
- `button:has-text("Xem trước")`
- `button:has-text("Tải Excel")`
- `text=suất ăn` (count label)
- `table.w-full` (report table)
- `thead th` (table headers: STT, Họ tên, SĐT, Ngày)

**Assertions:**
- Date input appears with selected date
- "Xem trước" button triggers loading state (spinner)
- Report preview shows count: "[N] suất ăn"
- Table displays columns: STT, Họ tên, SĐT, Ngày
- Data rows show serial number, name, phone, formatted date
- Export button "Tải Excel" is visible and enabled

---

#### TC-REP-003: Week Report Generation
**Priority:** P1
**Estimated Time:** 25s

**Description:** Generate and preview week report

**Steps:**
1. Navigate to `/admin/reports`
2. Select "Tuần" report type
3. Choose a week from dropdown
4. Click "Xem trước"

**Selectors:**
- `select` (week dropdown)
- `button:has-text("Xem trước")`
- Option text format: "T2, DD/MM - CN, DD/MM"

**Assertions:**
- Week selector dropdown shows 4 week options (past 4 weeks)
- Each option displays date range (e.g., "T2, 05/05 - CN, 11/05")
- Selecting week triggers automatic preview load
- Report aggregates data for all days in selected week

---

#### TC-REP-004: Month Report Generation
**Priority:** P1
**Estimated Time:** 25s

**Description:** Generate and preview month report

**Steps:**
1. Navigate to `/admin/reports`
2. Select "Tháng" report type
3. Choose a month from dropdown
4. Click "Xem trước"

**Selectors:**
- `select` (month dropdown)
- Option text format: "Tháng M/YYYY"

**Assertions:**
- Month dropdown shows 6 month options (past 6 months)
- Each option displays "Tháng [M]/[YYYY]" format
- Selecting month triggers automatic preview
- Report aggregates data for all days in selected month

---

#### TC-REP-005: Report Export to Excel
**Priority:** P0
**Estimated Time:** 20s

**Description:** Export report data to Excel file

**Steps:**
1. Generate a report preview
2. Click "Tải Excel" button
3. Monitor for file download

**Selectors:**
- `button:has-text("Tải Excel")`

**Assertions:**
- Button click triggers file download
- Downloaded file follows naming pattern: `BAOCOM_Report_YYYYMMDD.xlsx`
- Excel file contains all preview data rows
- File opens correctly in Excel-compatible software

---

#### TC-REP-006: Report Pagination/Expand
**Priority:** P1
**Estimated Time:** 15s

**Description:** Preview shows limited rows with expand option

**Steps:**
1. Generate a report with more than 5 rows
2. Observe initial display
3. Click "Xem thêm" button

**Selectors:**
- `button:has-text("Xem thêm (+N bản ghi)")`
- `button:has-text("Thu gọn")`

**Assertions:**
- Initial preview shows first 5 rows only
- "Xem thêm (+N bản ghi)" button appears when > 5 rows
- Clicking expands to show all rows
- Button changes to "Thu gọn" after expansion
- Clicking "Thu gọn" collapses back to 5 rows

---

#### TC-REP-007: Empty Report State
**Priority:** P2
**Estimated Time:** 10s

**Description:** Handle case when no data for selected period

**Steps:**
1. Navigate to `/admin/reports`
2. Select a date range with no registrations
3. Click preview

**Selectors:**
- `.text-center.py-12` (empty state container)
- `.material-symbols-outlined:has-text("description")`
- `text=Chọn ngày/tuần/tháng và nhấn "Xem trước" để xem báo cáo`

**Assertions:**
- When no data: empty state displays with icon and message
- Export button is disabled when no data present
- Error message does NOT appear - it's a valid empty state

---

### 3.4 Permission & Access Control Tests

#### TC-PERM-001: Non-Admin Cannot Access Dashboard
**Priority:** P0
**Estimated Time:** 15s

**Description:** Employee role is redirected or denied access to admin dashboard

**Steps:**
1. Authenticate as employee user (non-admin)
2. Attempt to navigate to `/admin/dashboard`
3. Observe access denial behavior

**Selectors:**
- May redirect to `/` or `/login`
- May show 403 Forbidden page

**Assertions:**
- Non-admin user is denied access (403) or redirected
- Dashboard stats are NOT visible
- API request to `/api/admin/stats` returns 403

---

#### TC-PERM-002: Non-Admin Cannot Access Employees Page
**Priority:** P0
**Estimated Time:** 15s

**Description:** Employee role is denied access to employee management page

**Steps:**
1. Authenticate as employee
2. Navigate to `/admin/employees`

**Assertions:**
- Access denied (403) or redirect to login
- Employee list is NOT visible
- API request to `/api/users` returns 403

---

#### TC-PERM-003: Non-Admin Cannot Access Reports Page
**Priority:** P0
**Estimated Time:** 15s

**Description:** Employee role is denied access to reports page

**Steps:**
1. Authenticate as employee
2. Navigate to `/admin/reports`

**Assertions:**
- Access denied (403) or redirect
- Report generation UI is NOT visible
- API request to `/api/admin/reports` returns 403

---

#### TC-PERM-004: Admin API Endpoints Reject Non-Admin
**Priority:** P0
**Estimated Time:** 30s

**Description:** All admin API endpoints return 403 for non-admin roles

**Steps:**
1. Authenticate as employee (non-admin)
2. Make direct API calls to admin endpoints

**API Endpoints to Test:**
- `GET /api/admin/stats`
- `GET /api/admin/reports?startDate=X&endDate=Y`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

**Assertions:**
- All admin endpoints return 403 Forbidden
- Response body contains `{ error: "Forbidden" }` or similar
- No admin data is exposed in response

---

### 3.5 Bulk Operations Tests

#### TC-BULK-001: Bulk Employee Selection
**Priority:** P2
**Estimated Time:** 20s

**Description:** Future support for bulk employee operations

**Note:** Currently not implemented in UI, but test should validate UI doesn't break when many employees exist

**Steps:**
1. Navigate to `/admin/employees`
2. Observe performance with large employee list

**Selectors:**
- Employee card list container

**Assertions:**
- List renders without freezing when > 50 employees
- Virtual scrolling works correctly (if implemented)
- Search remains responsive with large datasets

---

### 3.6 Filtering, Sorting, Pagination Tests

#### TC-FILTER-001: Employee Search Filtering
**Priority:** P1
**Estimated Time:** 15s

**Description:** Search filters by name, username (not by phone since API doesn't store it)

**Steps:**
1. Navigate to `/admin/employees`
2. Search for partial name match
3. Search for username match

**Assertions:**
- Searching "Van" shows employees with "Van" in name
- Searching "@username" shows that specific employee
- Empty search shows all employees

---

## 4. Test Execution Matrix

| Test ID | Priority | Estimated Time | Dependencies |
|---------|----------|----------------|--------------|
| TC-DASH-001 | P0 | 15s | - |
| TC-DASH-002 | P1 | 10s | - |
| TC-DASH-003 | P1 | 8s | TC-DASH-001 |
| TC-EMP-001 | P0 | 20s | - |
| TC-EMP-002 | P1 | 15s | TC-EMP-001 |
| TC-EMP-003 | P0 | 30s | TC-EMP-001 |
| TC-EMP-004 | P0 | 30s | TC-EMP-001 |
| TC-EMP-005 | P0 | 25s | TC-EMP-001 |
| TC-EMP-006 | P1 | 20s | TC-EMP-003 |
| TC-EMP-007 | P2 | 10s | TC-EMP-003 |
| TC-REP-001 | P0 | 10s | - |
| TC-REP-002 | P0 | 25s | TC-REP-001 |
| TC-REP-003 | P1 | 25s | TC-REP-001 |
| TC-REP-004 | P1 | 25s | TC-REP-001 |
| TC-REP-005 | P0 | 20s | TC-REP-002 |
| TC-REP-006 | P1 | 15s | TC-REP-002 |
| TC-REP-007 | P2 | 10s | - |
| TC-PERM-001 | P0 | 15s | - |
| TC-PERM-002 | P0 | 15s | - |
| TC-PERM-003 | P0 | 15s | - |
| TC-PERM-004 | P0 | 30s | - |
| TC-BULK-001 | P2 | 20s | TC-EMP-001 |
| TC-FILTER-001 | P1 | 15s | TC-EMP-001 |

**Total Estimated Time:** ~5-6 minutes (sequential execution)

---

## 5. Test Environment Setup

### 5.1 Prerequisites
- Node.js 18+
- Playwright installed (`npx playwright install`)
- Test database seeded with known data
- Application running on localhost:3000

### 5.2 Environment Variables
```bash
BASE_URL=http://localhost:3000
TEST_ADMIN_USERNAME=admin001
TEST_ADMIN_PASSWORD=Admin@123
TEST_EMPLOYEE_USERNAME=employee001
TEST_EMPLOYEE_PASSWORD=Emp@123
```

### 5.3 Before/After Hooks
```typescript
// Global setup
test.beforeAll(async ({ browser }) => {
  // Create authenticated admin context
  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()
  await adminPage.goto('/login')
  await adminPage.fill('input[name="username"]', 'admin001')
  await adminPage.fill('input[name="password"]', 'Admin@123')
  await adminPage.click('button[type="submit"]')
  await adminContext.storageState({ path: '.auth/admin.json' })
  
  // Create authenticated employee context
  const empContext = await browser.newContext()
  // ... similar setup
})

// Test cleanup
test.afterEach(async ({ page }) => {
  // Clear any modals or notifications
})
```

---

## 6. Troubleshooting Guide

### Issue: Tests fail with "page.goto: net::ERR_CONNECTION_REFUSED"
**Solution:** Ensure dev server is running (`npm run dev`)

### Issue: Authentication fails
**Solution:** Check cookie settings; Playwright may need `storageState` to preserve session

### Issue: UI elements not found
**Solution:** Check for dynamic loading; use `waitForSelector` before assertions

### Issue: Modal backdrop click not working
**Solution:** Use `page.locator('.absolute.inset-0.bg-black\\/40').click({ force: true })`

---

## 7. Test Maintenance Notes

- Update selectors when component CSS classes change
- Add new test cases when admin features are extended
- Review and update priority mappings quarterly
- Keep test data fixtures synchronized with seed scripts