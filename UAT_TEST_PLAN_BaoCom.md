# UAT Test Plan - BaoCom Lunch Registration System
**Document ID:** BAOCOM-UAT-2026-001
**Version:** 2.0
**Date:** 2026-05-14
**Author:** AI Test Engineer
**Standard:** IEEE 829-2008 (UAT Profile)

---

## 1. Introduction

### 1.1 Purpose
This UAT Test Plan defines acceptance testing for the BaoCom system from the **end-user perspective**. Testing focuses on user workflows, business requirements, and functional suitability - NOT internal implementation details.

### 1.2 Scope of Testing
- **In Scope:** User-facing functionality, user workflows, business rules, UI/UX behavior
- **Out of Scope:** API testing, database validation, security penetration, code-level verification

### 1.3 Testing Approach
```
┌─────────────────────────────────────────────────────────────┐
│                  BLACKBOX TESTING MODEL                     │
├─────────────────────────────────────────────────────────────┤
│  INPUT ──► [ SYSTEM UNDER TEST ] ──► OUTPUT               │
│            (No knowledge of internal structure)            │
├─────────────────────────────────────────────────────────────┤
│  Testers interact ONLY through:                            │
│  • User Interface (Web Browser)                           │
│  • User-input actions (click, type, submit)                │
│  • Expected vs Actual behavior                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 System Under Test Overview

| Component | Description |
|-----------|-------------|
| **Application** | Next.js web application |
| **URLs** | Login, Employee Dashboard, Admin Dashboard |
| **Users** | Admin, Employee |
| **Core Functions** | Login, Register Lunch, View Menu, Generate Report |

---

## 2. User Profiles & Personas

### 2.1 Employee User
```
┌─────────────────────────────────────────────────────────────┐
│ PERSONA: Nguyễn Văn A - Nhân viên                          │
├─────────────────────────────────────────────────────────────┤
│ Username: nguyenvana                                       │
│ Password: employee123                                       │
│ Role: Employee                                             │
│                                                             │
│ DAILY WORKFLOW:                                            │
│ 1. Login vào hệ thống                                     │
│ 2. Xem menu trưa tuần này                                  │
│ 3. Đăng ký / hủy đăng ký ăn trưa các ngày trong tuần     │
│ 4. Xem lịch sử đăng ký                                    │
│ 5. Logout                                                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Admin User
```
┌─────────────────────────────────────────────────────────────┐
│ PERSONA: Admin - Quản trị viên                             │
├─────────────────────────────────────────────────────────────┤
│ Username: admin                                            │
│ Password: admin123                                          │
│ Role: Admin                                                │
│                                                             │
│ DAILY WORKFLOW:                                            │
│ 1. Login vào hệ thống                                      │
│ 2. Xem thống kê đăng ký (tổng NV, đang ăn, không ăn)     │
│ 3. Quản lý nhân sự (xem, thêm, sửa, xóa)                 │
│ 4. Xuất báo cáo đăng ký                                   │
│ 5. Logout                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. User Stories

### 3.1 Employee User Stories

| Story ID | As A... | I Want To... | So That... | Priority |
|----------|---------|--------------|------------|----------|
| US-E-01 | Employee | Login with username/password | I can access the system securely | P0 |
| US-E-02 | Employee | See this week's lunch menu | I know what's for lunch | P0 |
| US-E-03 | Employee | Register for lunch (eating) | The kitchen knows I'm eating | P0 |
| US-E-04 | Employee | Cancel lunch registration | I can opt-out if not eating | P1 |
| US-E-05 | Employee | View my registration history | I can track my attendance | P2 |
| US-E-06 | Employee | Logout | I can secure my session | P1 |

### 3.2 Admin User Stories

| Story ID | As A... | I Want To... | So That... | Priority |
|----------|---------|--------------|------------|----------|
| US-A-01 | Admin | Login with username/password | I can access admin features | P0 |
| US-A-02 | Admin | View daily registration stats | I know how many people are eating | P0 |
| US-A-03 | Admin | View all employees | I can manage the employee list | P1 |
| US-A-04 | Admin | Add new employee | New staff can use the system | P1 |
| US-A-05 | Admin | Edit employee information | Employee data stays current | P2 |
| US-A-06 | Admin | Deactivate employee | Former staff can't access system | P2 |
| US-A-07 | Admin | Generate registration report | I can report to kitchen | P1 |
| US-A-08 | Admin | Export report to Excel | I can share report externally | P2 |
| US-A-09 | Admin | Logout | I can secure my session | P1 |

---

## 4. Functional Requirements

### 4.1 Authentication Requirements

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-AUTH-01 | System authenticates users | Valid credentials → dashboard; Invalid → error message |
| FR-AUTH-02 | Session persists | Closing browser and reopening → still logged in (if cookie valid) |
| FR-AUTH-03 | Session expires | After 7 days → user must login again |
| FR-AUTH-04 | Logout terminates session | Click logout → redirected to login page |

### 4.2 Employee Requirements

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-EMP-01 | View 8-day booking grid | Book page shows today + 7 days |
| FR-EMP-02 | Today badge visible | First day card shows "Hôm nay" badge |
| FR-EMP-03 | Toggle eating status | Click card → status cycles (none → eating → not eating) |
| FR-EMP-04 | Past days disabled | Cannot click on past dates |
| FR-EMP-05 | View weekly menu | Dashboard shows Mon-Fri menu with dishes |
| FR-EMP-06 | View registration history | My History shows calendar with status dots |

### 4.3 Admin Requirements

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-ADMIN-01 | View stats dashboard | Shows total employees, eating count, not eating count, registration rate |
| FR-ADMIN-02 | List employees | Shows all active employees with name, username, status |
| FR-ADMIN-03 | Add employee | Form accepts name → generates username → creates employee |
| FR-ADMIN-04 | Edit employee | Can update name, role (employee/admin) |
| FR-ADMIN-05 | Deactivate employee | Sets employee status to inactive |
| FR-ADMIN-06 | Generate report | Select date range → shows preview table |
| FR-ADMIN-07 | Export Excel | Click export → downloads .xlsx file |

---

## 5. UAT Test Cases (Blackbox)

### 5.1 Authentication Test Cases

#### UAT-LOGIN-001: Employee Login Success
```
Test Case ID: UAT-LOGIN-001
User Story: US-E-01
Module: Login
Priority: P0 - Critical

Objective: Verify employee can login with valid credentials

Pre-conditions:
- User has valid employee account (nguyenvana / employee123)
- Browser is at login page

Test Steps:
 1. Navigate to /login
 2. Enter "nguyenvana" in username field
 3. Enter "employee123" in password field
 4. Click "Đăng nhập" button
 5. Observe URL and page content

Expected Results:
 - URL changes to /dashboard (not /admin/dashboard)
 - Page shows employee-specific content (weekly menu)
 - No error messages displayed

Pass Criteria: Login succeeds, redirected to employee dashboard
```

#### UAT-LOGIN-002: Admin Login Success
```
Test Case ID: UAT-LOGIN-002
User Story: US-A-01
Module: Login
Priority: P0 - Critical

Objective: Verify admin can login with valid credentials

Pre-conditions:
- User has valid admin account (admin / admin123)
- Browser is at login page

Test Steps:
 1. Navigate to /login
 2. Enter "admin" in username field
 3. Enter "admin123" in password field
 4. Click "Đăng nhập" button
 5. Observe URL and page content

Expected Results:
 - URL changes to /admin/dashboard
 - Page shows admin-specific content (statistics)
 - No error messages displayed

Pass Criteria: Login succeeds, redirected to admin dashboard
```

#### UAT-LOGIN-003: Invalid Credentials Show Error
```
Test Case ID: UAT-LOGIN-003
User Story: US-E-01
Module: Login
Priority: P1 - High

Objective: Verify error message when entering wrong password

Pre-conditions:
- User has valid account
- Browser is at login page

Test Steps:
 1. Navigate to /login
 2. Enter valid username
 3. Enter "wrongpassword" in password field
 4. Click "Đăng nhập" button
 5. Observe error message

Expected Results:
 - User stays on /login page
 - Error message displayed: "Sai tên đăng nhập hoặc mật khẩu"
 - Username field is cleared
 - Password field is cleared

Pass Criteria: Error message shown, user can retry login
```

#### UAT-LOGIN-004: Empty Fields Show Validation Error
```
Test Case ID: UAT-LOGIN-004
User Story: US-E-01
Module: Login
Priority: P2 - Medium

Objective: Verify validation when leaving fields empty

Pre-conditions:
- Browser is at login page

Test Steps:
 1. Navigate to /login
 2. Leave both fields empty
 3. Click "Đăng nhập" button
 4. Observe behavior

Expected Results:
 - Button is disabled OR
 - Error message shown for empty fields
 - No navigation occurs

Pass Criteria: Form validation prevents empty submission
```

#### UAT-LOGIN-005: Logout Clears Session
```
Test Case ID: UAT-LOGIN-005
User Story: US-E-06, US-A-09
Module: Login
Priority: P1 - High

Objective: Verify logout clears session and redirects to login

Pre-conditions:
- User is logged in

Test Steps:
 1. Login as any user
 2. Click logout button/menu
 3. Observe redirect
 4. Try to navigate directly to dashboard
 5. Observe if access is denied

Expected Results:
 - Redirected to /login page
 - Menu shows "Đăng nhập" option
 - Direct URL access to /dashboard or /admin/dashboard redirects to login

Pass Criteria: Session is terminated, cannot access protected pages
```

---

### 5.2 Employee Booking Test Cases

#### UAT-BOOK-001: View 8-Day Booking Grid
```
Test Case ID: UAT-BOOK-001
User Story: US-E-02
Module: Employee Booking
Priority: P0 - Critical

Objective: Verify booking page displays 8 days starting from today

Pre-conditions:
- User is logged in as employee

Test Steps:
 1. Login as employee (nguyenvana)
 2. Navigate to /book
 3. Count number of day cards displayed
 4. Verify first card shows "Hôm nay" badge
 5. Check dates are sequential (today, tomorrow, ...)

Expected Results:
 - Exactly 8 day cards displayed
 - First card shows "Hôm nay" badge
 - Dates are: today + next 7 days
 - Each card shows: day name (T2-T7, CN), date number

Pass Criteria: 8 sequential days displayed starting from today
```

#### UAT-BOOK-002: Register for Lunch (Eating)
```
Test Case ID: UAT-BOOK-002
User Story: US-E-03
Module: Employee Booking
Priority: P0 - Critical

Objective: Verify employee can register for eating on a day

Pre-conditions:
- User is logged in as employee
- No existing registration for target date

Test Steps:
 1. Login as employee (nguyenvana)
 2. Navigate to /book
 3. Find a future day card (not today)
 4. Click on the card
 5. Observe status change
 6. Wait for success notification
 7. Refresh page
 8. Verify status persisted

Expected Results:
 - Status changes from "Chưa chọn" to "Ăn"
 - Success toast notification appears
 - After refresh, status remains "Ăn"
 - Green color indicator shown

Pass Criteria: Registration saved, status displays "Ăn"
```

#### UAT-BOOK-003: Cancel Lunch Registration
```
Test Case ID: UAT-BOOK-003
User Story: US-E-04
Module: Employee Booking
Priority: P1 - High

Objective: Verify employee can cancel eating registration

Pre-conditions:
- User is logged in as employee
- Has existing "Ăn" registration for a future date

Test Steps:
 1. Login as employee
 2. Navigate to /book
 3. Click on a day with "Ăn" status
 4. Observe status change
 5. Verify notification

Expected Results:
 - Status changes from "Ăn" to "Không ăn"
 - OR cycles through to "Chưa chọn"
 - Success notification appears
 - After refresh, status persists

Pass Criteria: Registration updated or cancelled
```

#### UAT-BOOK-004: Cannot Register for Past Dates
```
Test Case ID: UAT-BOOK-004
User Story: US-E-04
Module: Employee Booking
Priority: P1 - High

Objective: Verify past dates are not clickable

Pre-conditions:
- User is logged in as employee

Test Steps:
 1. Login as employee
 2. Navigate to /book
 3. Look for any past dates (if 8-day range includes past)
 4. Attempt to click on past date if visible

Expected Results:
 - Past dates appear grayed out / disabled
 - Clicking has no effect
 - No status change occurs

Pass Criteria: Past dates are not interactive
```

#### UAT-BOOK-005: Status Toggle Cycle
```
Test Case ID: UAT-BOOK-005
User Story: US-E-03, US-E-04
Module: Employee Booking
Priority: P1 - High

Objective: Verify clicking cycles through statuses correctly

Pre-conditions:
- User is logged in as employee

Test Steps:
 1. Login as employee
 2. Navigate to /book
 3. Find a day with "Chưa chọn" status
 4. Click once → note new status
 5. Click again → note new status
 6. Click again → note new status

Expected Results:
 - Cycle: Chưa chọn → Ăn → Không ăn → Ăn
 - Each click changes status
 - Notification confirms each change

Pass Criteria: Status cycles through all 3 states
```

---

### 5.3 Employee Dashboard Test Cases

#### UAT-DASH-001: View Weekly Menu
```
Test Case ID: UAT-DASH-001
User Story: US-E-02
Module: Employee Dashboard
Priority: P0 - Critical

Objective: Verify employee can see weekly lunch menu

Pre-conditions:
- User is logged in as employee

Test Steps:
 1. Login as employee
 2. Observe automatic redirect or navigate to /dashboard
 3. Count day tabs (T2, T3, T4, T5, T6)
 4. Click on each day tab
 5. Observe menu items displayed

Expected Results:
 - Day tabs visible for Mon-Fri
 - Each day shows: main dish, vegetable dishes, dessert
 - Menu items have names displayed

Pass Criteria: Weekly menu visible with all dish types
```

#### UAT-DASH-002: View My Registration Status on Dashboard
```
Test Case ID: UAT-DASH-002
User Story: US-E-02
Module: Employee Dashboard
Priority: P1 - High

Objective: Verify employee sees their eating/not-eating status

Pre-conditions:
- User is logged in as employee
- Has registrations for some days

Test Steps:
 1. Login as employee
 2. Navigate to /dashboard
 3. Look for status indicator on each day

Expected Results:
 - Each day shows eating status (Ăn/Không ăn/Chưa đăng ký)
 - Status matches registrations made in /book

Pass Criteria: Status displayed and matches actual registrations
```

---

### 5.4 Admin Dashboard Test Cases

#### UAT-ADM-001: View Registration Statistics
```
Test Case ID: UAT-ADM-001
User Story: US-A-02
Module: Admin Dashboard
Priority: P0 - Critical

Objective: Verify admin sees correct daily statistics

Pre-conditions:
- User is logged in as admin

Test Steps:
 1. Login as admin (admin/admin123)
 2. Observe dashboard stats cards
 3. Note values displayed

Expected Results:
 - Stats card shows:
   - Tổng nhân viên: <number>
   - Đang ăn hôm nay: <number>
   - Không ăn: <number>
   - Tỷ lệ đăng ký: <percentage>%
 - Numbers are realistic (between 0 and total employees)

Pass Criteria: Stats displayed with reasonable values
```

#### UAT-ADM-002: Access Quick Actions
```
Test Case ID: UAT-ADM-002
User Story: US-A-07
Module: Admin Dashboard
Priority: P1 - High

Objective: Verify quick action buttons work

Pre-conditions:
- User is logged in as admin

Test Steps:
 1. Login as admin
 2. Scroll to "Thao tác nhanh" section
 3. Click "Xuất báo cáo" button
 4. Observe navigation

Expected Results:
 - Button is visible with text "Xuất báo cáo"
 - Click navigates to /admin/reports page

Pass Criteria: Button navigates to reports page
```

#### UAT-ADM-003: Access Employee Management
```
Test Case ID: UAT-ADM-003
User Story: US-A-03
Module: Admin Dashboard
Priority: P1 - High

Objective: Verify employee management quick action works

Pre-conditions:
- User is logged in as admin

Test Steps:
 1. Login as admin
 2. Click "Quản lý nhân sự" button
 3. Observe navigation

Expected Results:
 - Button visible with text "Quản lý nhân sự"
 - Click navigates to /admin/employees

Pass Criteria: Button navigates to employees page
```

---

### 5.5 Employee Management Test Cases

#### UAT-EMP-001: View Employee List
```
Test Case ID: UAT-EMP-001
User Story: US-A-03
Module: Employee Management
Priority: P1 - High

Objective: Verify admin can view list of all employees

Pre-conditions:
- User is logged in as admin

Test Steps:
 1. Login as admin
 2. Navigate to /admin/employees
 3. Observe employee list

Expected Results:
 - Table/list shows columns: Name, Username, Status
 - Admin user is listed
 - Seed employees are listed (nguyenvana, tranthib, etc.)
 - Status shows "Đang hoạt động" for active users

Pass Criteria: Employee list displayed with correct data
```

#### UAT-EMP-002: Add New Employee
```
Test Case ID: UAT-EMP-002
User Story: US-A-04
Module: Employee Management
Priority: P1 - High

Objective: Verify admin can add new employee

Pre-conditions:
- User is logged in as admin
- New employee name not already in system

Test Steps:
 1. Login as admin
 2. Navigate to /admin/employees
 3. Click "Thêm nhân viên" or similar add button
 4. Fill form:
    - Full Name: "Test Employee"
    - (other fields as available)
 5. Submit form
 6. Observe new employee in list

Expected Results:
 - Modal/form opens
 - Form accepts input
 - After submit, new employee appears in list
 - Success message shown

Pass Criteria: New employee created and visible in list
```

#### UAT-EMP-003: Search Employees
```
Test Case ID: UAT-EMP-003
User Story: US-A-03
Module: Employee Management
Priority: P2 - Medium

Objective: Verify admin can search for employees

Pre-conditions:
- User is logged in as admin
- Multiple employees exist

Test Steps:
 1. Login as admin
 2. Navigate to /admin/employees
 3. Find search box
 4. Type partial name (e.g., "nguyen")
 5. Observe filtered results

Expected Results:
 - List filters to show only matching employees
 - Typing in search box updates results in real-time

Pass Criteria: Search filters employee list
```

#### UAT-EMP-004: Edit Employee
```
Test Case ID: UAT-EMP-004
User Story: US-A-05
Module: Employee Management
Priority: P2 - Medium

Objective: Verify admin can edit employee information

Pre-conditions:
- User is logged in as admin
- Employee exists to edit

Test Steps:
 1. Login as admin
 2. Navigate to /admin/employees
 3. Find employee (not admin)
 4. Click edit button/icon
 5. Modify name
 6. Save changes
 7. Verify change persisted

Expected Results:
 - Edit form/modal opens
 - Changes save successfully
 - Updated name shown in list

Pass Criteria: Employee information updated
```

#### UAT-EMP-005: Deactivate Employee
```
Test Case ID: UAT-EMP-005
User Story: US-A-06
Module: Employee Management
Priority: P2 - Medium

Objective: Verify admin can deactivate employee

Pre-conditions:
- User is logged in as admin
- Active employee exists (not admin)

Test Steps:
 1. Login as admin
 2. Navigate to /admin/employees
 3. Find active employee
 4. Click delete/deactivate button
 5. Confirm action
 6. Observe status change

Expected Results:
 - Confirmation dialog appears
 - After confirm, employee status changes
 - Employee shows as "Không hoạt động" or removed from active list

Pass Criteria: Employee deactivated successfully
```

---

### 5.6 Report Generation Test Cases

#### UAT-RPT-001: Generate Daily Report
```
Test Case ID: UAT-RPT-001
User Story: US-A-07
Module: Reports
Priority: P1 - High

Objective: Verify admin can generate report for specific date

Pre-conditions:
- User is logged in as admin

Test Steps:
 1. Login as admin
 2. Navigate to /admin/reports
 3. Select report type: "Ngày" or specific date
 4. Choose a date with existing registrations
 5. Click "Xem trước" (Preview)
 6. Observe table

Expected Results:
 - Preview table shows:
   - STT (序号)
   - Name (Tên)
   - Phone (Số điện thoại)
   - Date (Ngày)
 - Table has data rows
 - "Tổng cộng" (Total) shown

Pass Criteria: Report preview displays correctly
```

#### UAT-RPT-002: Export Report to Excel
```
Test Case ID: UAT-RPT-002
User Story: US-A-08
Module: Reports
Priority: P2 - Medium

Objective: Verify admin can export report as Excel file

Pre-conditions:
- User is logged in as admin
- Report preview is displayed

Test Steps:
 1. Login as admin
 2. Navigate to /admin/reports
 3. Generate a report preview
 4. Click "Tải Excel" or export button
 5. Observe downloaded file

Expected Results:
 - File downloads
 - File is .xlsx format
 - File contains report data

Pass Criteria: Excel file downloaded with correct data
```

---

## 6. Test Environment Setup

### 6.1 Test Accounts

| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| admin | admin123 | Admin | Test admin features |
| nguyenvana | employee123 | Employee | Test employee features |
| tranthib | employee123 | Employee | Test multi-user scenarios |

### 6.2 Test URLs

| URL | Purpose |
|-----|---------|
| http://localhost:3000/login | Login page |
| http://localhost:3000/dashboard | Employee dashboard |
| http://localhost:3000/book | Booking page |
| http://localhost:3000/my-history | Registration history |
| http://localhost:3000/admin/dashboard | Admin dashboard |
| http://localhost:3000/admin/employees | Employee management |
| http://localhost:3000/admin/reports | Report generation |

### 6.3 Test Data Prerequisites
- Database seeded with admin + 5 employees
- 20 meals created (mains, vegetables, desserts)
- Weekly menu generated for current week
- Some registrations exist for testing

---

## 7. Test Execution Checklist

### 7.1 Pre-Test Checklist
- [ ] Test environment is accessible
- [ ] Test accounts are active
- [ ] Database is seeded
- [ ] Browser is cleared of cookies
- [ ] UAT tester is trained on user stories

### 7.2 Test Execution Log Template

```
Test Case ID: ___________
Date: ___________
Tester: ___________
Pre-conditions Met: [ ] Yes [ ] No
Test Steps Executed: [ ] All [ ] Partial
Expected Result Matched: [ ] Yes [ ] No
Actual Result: ________________
Defect ID (if any): ___________
Pass/Fail: ___________
Notes: ________________
```

### 7.3 Post-Test Checklist
- [ ] All test cases executed
- [ ] All failures documented
- [ ] Screenshots captured for failures
- [ ] Test summary report generated

---

## 8. Defect Reporting

### 8.1 Defect Template
```
Defect ID: [AUTO-GENERATED]
Date Found: ___________
Test Case ID: ___________
Severity: [P0-Critical / P1-High / P2-Medium / P3-Low]
Description: ___________
Steps to Reproduce: ___________
Expected Behavior: ___________
Actual Behavior: ___________
Screenshots: [ATTACHED]
```

### 8.2 Severity Definitions

| Severity | Definition | Example |
|----------|------------|---------|
| P0 - Critical | System unusable, blocks all users | Login broken |
| P1 - High | Major feature broken | Cannot register for lunch |
| P2 - Medium | Feature partially works | Report missing one column |
| P3 - Low | Cosmetic issue | Wrong text color |

---

## 9. Acceptance Criteria Summary

### 9.1 Authentication
- [ ] Employee can login with valid credentials
- [ ] Admin can login with valid credentials
- [ ] Invalid credentials show error message
- [ ] Empty fields are validated
- [ ] Logout terminates session

### 9.2 Employee Features
- [ ] 8-day booking grid displays correctly
- [ ] Today badge visible on first card
- [ ] Can register for lunch (eating)
- [ ] Can cancel registration
- [ ] Past dates are disabled
- [ ] Status cycles correctly
- [ ] Weekly menu displays

### 9.3 Admin Features
- [ ] Dashboard shows statistics
- [ ] Quick actions navigate correctly
- [ ] Employee list displays
- [ ] Can add new employee
- [ ] Can search employees
- [ ] Can edit employee
- [ ] Can deactivate employee
- [ ] Can generate report
- [ ] Can export to Excel

---

## 10. Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| UAT Lead | | | |
| Business Owner | | | |
| Project Manager | | | |
| System Owner | | | |

---

**Document End - UAT Test Plan v2.0**
**Focus: Blackbox User Acceptance Testing**