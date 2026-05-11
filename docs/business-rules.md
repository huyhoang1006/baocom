# Business Rules Document
# Hệ thống Báo Cơm (BaoCom)

```
Document Type:    Business Rules Specification
Project:          BaoCom - Hệ thống đăng ký suất ăn
Version:          1.0
Date:             2026-05-10
Status:           Approved
Classification:   Internal Use
Author:          Development Team
```

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Scope](#2-scope)
3. [Definitions and Acronyms](#3-definitions-and-acronyms)
4. [Business Rules](#4-business-rules)
   - 4.1 [User Management Rules](#41-user-management-rules)
   - 4.2 [Registration Rules](#42-registration-rules)
   - 4.3 [Deadline Rules](#43-deadline-rules)
   - 4.4 [Admin Rules](#44-admin-rules)
   - 4.5 [Reporting Rules](#45-reporting-rules)
5. [Business Constraints](#5-business-constraints)
6. [Business Logic Flow](#6-business-logic-flow)
7. [Rule Dependencies](#7-rule-dependencies)
8. [Validation Requirements](#8-validation-requirements)
9. [Exception Handling](#9-exception-handling)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the business rules for the **BaoCom Meal Registration System**. Business rules define the policies, constraints, and logic that govern the behavior of the system.

### 1.2 Scope

This document applies to:
- All users of the BaoCom system
- All business processes related to meal registration
- All data entities managed by the system

### 1.3 Document Conventions

| Symbol | Meaning |
|--------|---------|
| MUST | Mandatory requirement |
| SHALL | Requirement that must be fulfilled |
| MAY | Optional capability |
| SHOULD | Recommended but not mandatory |

---

## 2. Scope

### 2.1 In Scope

```
┌─────────────────────────────────────────────────────────────┐
│                       IN SCOPE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  USER MANAGEMENT                                            │
│  ├── Account creation (Admin)                              │
│  ├── Account modification (Admin)                          │
│  ├── Account deletion (Admin)                              │
│  └── Login authentication                                  │
│                                                             │
│  MEAL REGISTRATION                                         │
│  ├── Default registration (CÓ ĂN)                         │
│  ├── Opt-out registration (KHÔNG ĂN)                      │
│  ├── Bulk cancellation (Admin)                             │
│  └── Registration history viewing                          │
│                                                             │
│  REPORTING                                                  │
│  ├── Daily report generation                               │
│  ├── Weekly/Monthly report generation                     │
│  └── Excel export functionality                             │
│                                                             │
│  DEADLINE MANAGEMENT                                        │
│  ├── Midnight cutoff enforcement                           │
│  └── Future date registration only                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Out of Scope

```
┌─────────────────────────────────────────────────────────────┐
│                      OUT OF SCOPE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  • Meal ordering for external vendors                      │
│  • Payment processing                                      │
│  • Food quality feedback/ratings                           │
│  • Inventory management                                    │
│  • Real-time notification to employees (Push)              │
│  • Menu management (fixed menu)                           │
│  • Attendance check-in at lunch                           │
│  • Multiple meal types (breakfast, dinner)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Definitions and Acronyms

### 3.1 Terms

| Term | Definition |
|------|------------|
| **Báo Cơm** | Action of registering for a meal (lunch) |
| **Cắt Cơm** | Action of canceling meal registration |
| **Ngày làm việc** | Monday to Friday (excluding holidays) |
| **Deadline** | Time when daily registration is locked (00:00) |
| **Suất ăn** | One meal portion |

### 3.2 Acronyms

| Acronym | Full Form |
|---------|-----------|
| NV | Nhân viên (Employee) |
| Admin | Administrator |
| SĐT | Số điện thoại (Phone number) |
| CĐ | Có ăn (Will eat) |
| KA | Không ăn (Will not eat) |

### 3.3 Data Entities

| Entity | Description |
|--------|-------------|
| `User` | System user (Admin or Employee) |
| `Registration` | Meal registration record for a specific date |
| `Employee` | Staff member eligible for meal registration |
| `Department` | Organizational unit (optional) |

---

## 4. Business Rules

### 4.1 User Management Rules

#### BR-001: Account Creation

```
RULE ID:         BR-001
TITLE:          Account Creation
CATEGORY:       User Management
PRIORITY:       High

STATEMENT:
  When a new employee is hired, Admin MUST create an account 
  following the username convention.

REQUIREMENTS:
  ├── R001.1: Username MUST be generated using formula:
  │           <last_name_no_diacritic><initial_first_name><initial_middle_name(s)>
  │           Example: "Phạm Xuân Hùng" → "hungpx"
  │           Example: "Trần Thị Lan Anh" → "lanhtt"
  ├── R001.2: Username MUST be unique across the system
  ├── R001.3: Password MUST be randomly generated, minimum 8 characters
  ├── R001.4: Password MUST contain uppercase, lowercase, and numbers
  ├── R001.5: Password SHOULD be sent to employee via secure channel
  └── R001.6: Employee MUST be informed to change password on first login

EXAMPLES:
  ├── "Nguyễn Văn Minh" → "minhnv"
  ├── "Lê Hoàng Nam" → "namlh"
  ├── "Đặng Thị Mai Linh" → "linhdtm"
  └── "Võ Đình Tuấn" → "tuannvd"

ENFORCEMENT:
  ├── System: Validate uniqueness before saving
  └── Admin: Manual verification of username format
```

#### BR-002: Account Types

```
RULE ID:         BR-002
TITLE:          Account Type Definition
CATEGORY:       User Management
PRIORITY:       High

STATEMENT:
  System MUST support two account types with distinct permissions.

REQUIREMENTS:
  ├── R002.1: Admin account:
  │   ├── Has access to /admin/* routes
  │   ├── CANNOT access /book of other users
  │   └── Uses separate login credentials
  ├── R002.2: Employee account:
  │   ├── Has access to /book, /my-history
  │   ├── CAN view own registration history only
  │   └── CANNOT access admin features
  └── R002.3: Authentication uses same login page but different redirects

PERMISSIONS MATRIX:
  ┌─────────────────────┬──────────┬────────────┐
  │ Feature             │ Employee │ Admin     │
  ├─────────────────────┼──────────┼────────────┤
  │ Login               │ ✅       │ ✅         │
  │ View own history    │ ✅       │ ✅         │
  │ Register meals      │ ✅       │ ✅         │
  │ View dashboard     │ ❌       │ ✅         │
  │ Manage employees    │ ❌       │ ✅         │
  │ Bulk cancel meals   │ ❌       │ ✅         │
  │ Export reports      │ ❌       │ ✅         │
  └─────────────────────┴──────────┴────────────┘
```

#### BR-003: Account Modification

```
RULE ID:         BR-003
TITLE:          Account Modification
CATEGORY:       User Management
PRIORITY:       Medium

STATEMENT:
  Admin MAY modify employee account details within specified constraints.

REQUIREMENTS:
  ├── R003.1: Admin CAN modify:
  │   ├── Phone number
  │   ├── Department (if applicable)
  │   └── Account status (active/inactive)
  ├── R003.2: Admin CANNOT modify:
  │   ├── Username (after creation)
  │   └── Password (only reset, not view)
  ├── R003.3: Username CAN be changed only in exceptional cases
  └── R003.4: Account status "inactive" preserves historical data

EXCEPTION:
  └── Username change requires approval from system owner
```

---

### 4.2 Registration Rules

#### BR-010: Default Registration

```
RULE ID:         BR-010
TITLE:          Default Meal Registration
CATEGORY:       Registration
PRIORITY:       Critical

STATEMENT:
  ALL employees SHALL be automatically registered for meals 
  on all future working days unless they opt-out.

RATIONALE:
  Simplifies registration process for majority of employees 
  who eat lunch daily.

REQUIREMENTS:
  ├── R010.1: New employee account automatically has CÓ ĂN status
  ├── R010.2: Default registration applies to all future dates
  ├── R010.3: Employee who opts-out (ticks KHÔNG ĂN) only affects 
  │           those specific dates
  └── R010.4: Opt-out does NOT change default status for future dates

EXAMPLE:
  Employee registers on Monday for week:
  ├── T3 (16/10): CÓ ĂN (default, not ticked)
  ├── T4 (17/10): CÓ ĂN (default, not ticked)
  ├── T5 (18/10): KHÔNG ĂN (ticked by employee)
  ├── T6 (19/10): CÓ ĂN (default, not ticked)
  └── T7 (20/10): CÓ ĂN (default, not ticked)

RESULT:
  └── 4 CÓ ĂN, 1 KHÔNG ĂN
```

#### BR-011: Opt-Out Registration

```
RULE ID:         BR-011
TITLE:          Opt-Out Registration
CATEGORY:       Registration
PRIORITY:       Critical

STATEMENT:
  Employee MAY opt-out of meal registration for specific dates 
  by explicitly selecting "KHÔNG ĂN" option.

REQUIREMENTS:
  ├── R011.1: Employee MAY tick "Không ăn" for any future date
  ├── R011.2: Ticking "Không ăn" removes CÓ ĂN status for that date
  ├── R011.3: Employee MAY un-tick to revert to default CÓ ĂN
  ├── R011.4: Opt-out does NOT require reason or approval
  └── R011.5: Opt-out is immediate and persistent until changed

UI BEHAVIOR:
  ├── Default state: Unchecked (CÓ ĂN)
  ├── Checked state: KHÔNG ĂN
  └── Visual indicator: Green checkmark for CÓ ĂN, Red X for KHÔNG ĂN
```

#### BR-012: Self-Registration Scope

```
RULE ID:         BR-012
TITLE:          Self-Registration Only
CATEGORY:       Registration
PRIORITY:       High

STATEMENT:
  Employee MAY only modify their own meal registrations. 
  CANNOT modify registrations for other employees.

REQUIREMENTS:
  ├── R012.1: Employee sees only their own registration data
  ├── R012.2: Employee CANNOT see other employees' registration status
  ├── R012.3: Employee CANNOT modify other employees' registrations
  └── R012.4: Only Admin CAN modify registrations for multiple employees

EXCEPTION:
  └── Admin CAN modify any employee's registration via bulk cancellation
```

---

### 4.3 Deadline Rules

#### BR-020: Daily Deadline

```
RULE ID:         BR-020
TITLE:          Midnight Registration Deadline
CATEGORY:       Deadline
PRIORITY:       Critical

STATEMENT:
  Meal registration for the next day MUST be finalized at 00:00 
  (midnight). After deadline, registrations are locked.

REQUIREMENTS:
  ├── R020.1: System SHALL lock registration at 00:00 daily
  ├── R020.2: Registration locked for CURRENT day (not future days)
  ├── R020.3: After deadline, registration for next day cannot be modified
  ├── R020.4: Future dates (day after tomorrow and beyond) remain editable
  └── R020.5: Deadline applies to both CÓ ĂN and KHÔNG ĂN selections

EXAMPLE:
  Deadline: Monday 00:00 (Tuesday 00:00)
  │
  ├── Before deadline (Monday 23:59):
  │   └── CAN modify registration for Tuesday
  │
  └── After deadline (Tuesday 00:01):
      └── CANNOT modify registration for Tuesday
      └── CAN modify registration for Wednesday+
```

#### BR-021: Registration Window

```
RULE ID:         BR-021
TITLE:          Future Date Registration Window
CATEGORY:       Deadline
PRIORITY:       High

STATEMENT:
  Employee MAY only register for TODAY (before deadline) and 
  FUTURE dates. CANNOT register for past dates.

REQUIREMENTS:
  ├── R021.1: TODAY registration:
  │   ├── Available until deadline (00:00)
  │   └── Locked after deadline
  ├── R021.2: TOMORROW registration:
  │   ├── Available until previous day's deadline
  │   └── Locked after previous day's deadline
  ├── R021.3: FUTURE dates (day after tomorrow+):
  │   └── Always available until respective deadline
  └── R021.4: PAST dates:
      └── NOT editable (read-only for history)

CALENDAR RESTRICTION:
  ┌─────────────────────────────────────────────────────────────┐
  │  | Past  | Today | Tomorrow | D+2  | D+3  | ...          │
  │  |       |       |          |      |      |               │
  │  | ❌    | ✅*   | ✅       | ✅   | ✅   |               │
  │  | Locked| Avail*| Avail    | Avail| Avail|               │
  │                                                             │
  │  * Before deadline: available / After deadline: locked    │
  └─────────────────────────────────────────────────────────────┘
```

---

### 4.4 Admin Rules

#### BR-030: Bulk Cancellation

```
RULE ID:         BR-030
TITLE:          Bulk Meal Cancellation
CATEGORY:       Admin
PRIORITY:       High

STATEMENT:
  Admin MAY cancel meal registrations for one or more employees 
  for a specified date range.

REQUIREMENTS:
  ├── R030.1: Admin CAN select multiple employees for bulk cancellation
  ├── R030.2: Admin CAN select date range:
  │   ├── Specific start and end dates
  │   ├── Current week
  │   └── Current month
  ├── R030.3: Bulk cancellation sets status to KHÔNG ĂN
  ├── R030.4: Bulk cancellation CAN override employee's opt-out
  │   └── Example: Employee ticked CÓ ĂN, Admin changes to KHÔNG ĂN
  ├── R030.5: Bulk cancellation REQUIRES reason/justification
  └── R030.6: Bulk cancellation REQUIRES confirmation before execution

REASON OPTIONS:
  ├── Đi công trường (On-site project)
  ├── Nghỉ phép (Leave)
  ├── Công tác (Business trip)
  ├── Thai sản/Nghỉ thai (Maternity/Paternity)
  ├── Họp/Tập huấn (Meeting/Training)
  └── Khác (Other) - requires additional note

EXAMPLE USE CASE:
  Employee "Phạm Xuân Hùng" assigned to on-site project for 2 weeks:
  ├── Admin selects "hungpx" from employee list
  ├── Admin selects date range: Oct 15 - Oct 25
  ├── Admin selects reason: "Đi công trường"
  ├── Admin adds note: "Dự án ABC"
  └── System sets KHÔNG ĂN for all selected dates
```

#### BR-031: Employee Management

```
RULE ID:         BR-031
TITLE:          Employee Management
CATEGORY:       Admin
PRIORITY:       High

STATEMENT:
  Admin HAS full CRUD access to employee accounts within the system.

REQUIREMENTS:
  ├── R031.1: Admin CAN create new employee accounts
  ├── R031.2: Admin CAN update employee information:
  │   ├── Phone number
  │   ├── Department
  │   └── Status (active/inactive)
  ├── R031.3: Admin CANNOT change username after creation
  ├── R031.4: Admin CAN deactivate (not delete) employee accounts
  ├── R031.5: Deactivated account:
  │   ├── Cannot login
  │   ├── Preserves historical registration data
  │   └── CAN be reactivated
  └── R031.6: Admin CAN import employees via Excel file

IMPORT REQUIREMENTS:
  ├── File format: .xlsx
  ├── Required columns: Họ tên, Username (auto-generated if missing)
  ├── Optional columns: SĐT, Email, Phòng ban
  └── System generates username if not provided
```

#### BR-032: Dashboard Access

```
RULE ID:         BR-032
TITLE:          Admin Dashboard Access
CATEGORY:       Admin
PRIORITY:       High

STATEMENT:
  Admin HAS exclusive access to real-time meal registration dashboard.

REQUIREMENTS:
  ├── R032.1: Dashboard displays CURRENT DAY registrations only
  ├── R032.2: Dashboard shows:
  │   ├── Total registered count
  │   ├── CÓ ĂN count
  │   ├── KHÔNG ĂN count
  │   └── CHƯA ĐĂNG KÝ count (if any)
  ├── R032.3: Dashboard shows detailed list:
  │   ├── Employee name
  │   ├── Phone number
  │   └── Registration status
  ├── R032.4: Dashboard supports filtering:
  │   ├── By status (CÓ ĂN / KHÔNG ĂN / Tất cả)
  │   └── By employee name (search)
  └── R032.5: Dashboard refreshes automatically every 5 minutes
```

---

### 4.5 Reporting Rules

#### BR-040: Report Generation

```
RULE ID:         BR-040
TITLE:          Excel Report Generation
CATEGORY:       Reporting
PRIORITY:       Medium

STATEMENT:
  Admin MAY generate Excel reports with employee meal registrations 
  for specified time periods.

REQUIREMENTS:
  ├── R040.1: Report time period options:
  │   ├── Single day
  │   ├── Week (Monday to Sunday)
  │   └── Month (1st to last day)
  ├── R040.2: Report MUST include:
  │   ├── Employee name (Họ và tên)
  │   ├── Phone number (SĐT)
  │   └── Registration date (Ngày)
  ├── R040.3: Report format: .xlsx (Excel)
  ├── R040.4: Report file name format: "BAOCOM_Report_YYYYMMDD.xlsx"
  ├── R040.5: Report is generated on-demand (not scheduled)
  └── R040.6: Report reflects data at time of generation

REPORT PREVIEW:
  Before download, Admin sees preview with:
  ├── Total count of meals
  ├── Date range
  └── Sample rows (first 10)
```

#### BR-041: Report Data Scope

```
RULE ID:         BR-041
TITLE:          Report Data Scope
CATEGORY:       Reporting
PRIORITY:       Medium

STATEMENT:
  Reports include ONLY employees with CÓ ĂN status for selected period.

REQUIREMENTS:
  ├── R041.1: Report includes employees where status = CÓ ĂN
  ├── R041.2: Report excludes employees with status = KHÔNG ĂN
  ├── R041.3: Report excludes deactivated accounts
  └── R041.4: Each registration row = 1 meal (1 employee × 1 day)

EXAMPLE:
  If Phạm Xuân Hùng has CÓ ĂN on 3 days in a week:
  ├── Report shows 3 rows for "Phạm Xuân Hùng"
  └── Each row has different date
```

---

## 5. Business Constraints

### 5.1 Data Constraints

| Constraint ID | Description | Type |
|---------------|-------------|------|
| DC-001 | Username must be unique | UNIQUE |
| DC-002 | Username must be 3-20 characters | LENGTH |
| DC-003 | Password minimum 8 characters | LENGTH |
| DC-004 | Phone number format: 10-11 digits | FORMAT |
| DC-005 | Registration date must be current or future | DATE |
| DC-006 | Bulk cancellation requires at least 1 employee | MIN |
| DC-007 | Bulk cancellation requires valid date range | DATE |

### 5.2 Business Hours

| Item | Value |
|------|-------|
| **Registration Window** | Daily 00:00 - 23:59 (for next day and beyond) |
| **Deadline** | 00:00 (midnight) |
| **Working Days** | Monday - Friday (excluding holidays) |
| **System Availability** | 24/7 (read-only past dates) |

### 5.3 Capacity Limits

| Item | Limit |
|------|-------|
| Maximum employees per account | 1 |
| Maximum concurrent users | No limit |
| Maximum registrations per employee per day | 1 |
| Report export timeout | 30 seconds |

---

## 6. Business Logic Flow

### 6.1 Daily Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY REGISTRATION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  T-1 DAY (Previous Day)                                         │
│  ───────────────────────────                                     │
│                                                                 │
│  23:59                                                          │
│    │                                                            │
│    │  Employee A accesses /book                                 │
│    │  Sees calendar with T-day (today) marked                  │
│    │  Sees T+1, T+2, T+3... available for modification         │
│    │                                                            │
│    ▼                                                            │
│  00:00 ────────────────────────────────────── DEADLINE        │
│    │                                                            │
│    │  System LOCKS registration for T-day                       │
│    │  System FINALIZES T-day count for kitchen                  │
│    │                                                            │
│    ▼                                                            │
│  00:01 onwards                                                  │
│    │                                                            │
│    │  Employee A CANNOT modify T-day registration              │
│    │  Employee A CAN still modify T+1, T+2...                   │
│    │  Admin sees FINAL count for T-day in dashboard             │
│    │                                                            │
│    ▼                                                            │
│  T DAY (Today)                                                  │
│  ──────────                                                     │
│                                                                 │
│  12:00 (Lunch time)                                            │
│    │                                                            │
│    │  Kitchen prepares exact number of meals                   │
│    │  Based on final count from deadline                        │
│    │                                                            │
│    ▼                                                            │
│  Continue to next day cycle...                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Admin Bulk Cancellation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BULK CANCELLATION FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  START: Admin navigates to /admin/employees                    │
│    │                                                            │
│    ▼                                                            │
│  ┌─────────────────────────────────────────┐                   │
│  │ STEP 1: Select Employees                │                   │
│  ├─────────────────────────────────────────┤                   │
│  │                                         │                   │
│  │  □ Nguyễn Văn A                        │                   │
│  │  ■ Trần Thị B   ← Selected             │                   │
│  │  □ Lê Văn C                            │                   │
│  │  ■ Phạm Xuân Hùng ← Selected           │                   │
│  │                                         │                   │
│  │  Selected: 2 employees                  │                   │
│  └────────────────────┬──────────────────┘                   │
│                       │                                        │
│                       ▼                                        │
│  ┌─────────────────────────────────────────┐                   │
│  │ STEP 2: Select Date Range               │                   │
│  ├─────────────────────────────────────────┤                   │
│  │                                         │                   │
│  │  ○ Custom: [15/10] → [21/10]            │                   │
│  │  ○ This week (15/10 - 21/10)            │                   │
│  │  ○ This month (15/10 - 31/10)           │                   │
│  │                                         │                   │
│  │  Dates selected: 15, 16, 17, 18, 19, 20, 21 │               │
│  └────────────────────┬──────────────────┘                   │
│                       │                                        │
│                       ▼                                        │
│  ┌─────────────────────────────────────────┐                   │
│  │ STEP 3: Enter Reason                    │                   │
│  ├─────────────────────────────────────────┤                   │
│  │                                         │                   │
│  │  Reason: [Đi công trường ▼]            │                   │
│  │  Note:   [Dự án ABC, quận 9]           │                   │
│  │                                         │                   │
│  └────────────────────┬──────────────────┘                   │
│                       │                                        │
│                       ▼                                        │
│  ┌─────────────────────────────────────────┐                   │
│  │ STEP 4: Confirm                         │                   │
│  ├─────────────────────────────────────────┤                   │
│  │                                         │                   │
│  │  ⚠️ Confirmation Required              │                   │
│  │                                         │                   │
│  │  You are about to cancel 14 meal        │                   │
│  │  registrations (2 employees × 7 days) │                   │
│  │                                         │                   │
│  │  Reason: Đi công trường                │                   │
│  │                                         │                   │
│  │  [Cancel] [Confirm]                    │                   │
│  └────────────────────┬──────────────────┘                   │
│                       │                                        │
│                       ▼                                        │
│  ┌─────────────────────────────────────────┐                   │
│  │ STEP 5: Execute & Confirm               │                   │
│  ├─────────────────────────────────────────┤                   │
│  │                                         │                   │
│  │  ✅ Success!                            │                   │
│  │                                         │                   │
│  │  14 registrations have been cancelled  │                   │
│  │                                         │                   │
│  │  • Trần Thị B: 7 days                  │                   │
│  │  • Phạm Xuân Hùng: 7 days              │                   │
│  │                                         │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Rule Dependencies

### 7.1 Dependency Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    RULE DEPENDENCY MAP                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   BR-002 (Account Types)                                       │
│        │                                                        │
│        ├───→ BR-001 (Account Creation)                        │
│        │        │                                               │
│        │        └───→ Username format follows BR-002           │
│        │                                                        │
│        └───→ BR-012 (Self-Registration Scope)                  │
│                 │                                               │
│                 └───→ Employee can only modify own data        │
│                                                                 │
│   BR-020 (Deadline) ────────→ BR-021 (Registration Window)    │
│        │                           │                            │
│        │                           └───→ Cannot register for    │
│        │                               past dates              │
│        │                                                       │
│        └───→ BR-010 (Default Registration)                   │
│                 │                                               │
│                 └───→ Deadline locks default CÓ ĂN            │
│                                                                 │
│   BR-031 (Employee Management)                                  │
│        │                                                        │
│        └───→ BR-030 (Bulk Cancellation)                        │
│                 │                                               │
│                 └───→ Can only cancel registered employees     │
│                                                                 │
│   BR-040 (Report Generation)                                    │
│        │                                                        │
│        └───→ BR-041 (Report Data Scope)                        │
│                 │                                               │
│                 └───→ Only CÓ ĂN status included              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Rule Priority Matrix

| Priority | Rules | Description |
|----------|-------|-------------|
| **Critical** | BR-010, BR-011, BR-020, BR-021 | Core registration logic |
| **High** | BR-001, BR-002, BR-012, BR-030, BR-031, BR-032 | User management |
| **Medium** | BR-003, BR-040, BR-041 | Admin features |

---

## 8. Validation Requirements

### 8.1 Input Validation Rules

| Field | Validation | Error Message |
|-------|------------|---------------|
| Username | Required, 3-20 chars, alphanumeric | "Username phải từ 3-20 ký tự" |
| Username | Unique in system | "Username đã tồn tại" |
| Password | Required, min 8 chars | "Mật khẩu phải có ít nhất 8 ký tự" |
| Password | Must include upper, lower, number | "Mật khẩu phải chứa chữ hoa, chữ thường và số" |
| Phone | Optional, 10-11 digits | "Số điện thoại không hợp lệ" |
| Date Range | Start ≤ End | "Ngày bắt đầu phải trước ngày kết thúc" |
| Employee Selection | At least 1 selected | "Vui lòng chọn ít nhất 1 nhân viên" |
| Reason | Required for bulk cancellation | "Vui lòng chọn lý do hủy cơm" |

### 8.2 Business Rule Validation Matrix

| Action | Pre-validation | Post-validation |
|--------|---------------|-----------------|
| Create Account | Check username uniqueness | Log creation event |
| Login | Validate credentials | Generate session token |
| Register Meal | Check date is not past | Update registration count |
| Bulk Cancel | Verify employee selection | Verify count matches |
| Generate Report | Verify date range | Verify row count |

---

## 9. Exception Handling

### 9.1 Exception Scenarios

| Exception ID | Scenario | Handling |
|--------------|----------|----------|
| EX-001 | Duplicate username | Auto-suggest alternative with suffix |
| EX-002 | Bulk cancel exceeds future dates | Show warning, allow partial |
| EX-003 | Admin tries to access employee route | Redirect with 403 error |
| EX-004 | Employee tries to access admin route | Redirect with 403 error |
| EX-005 | Report generation timeout | Show retry option with message |
| EX-006 | Deadline race condition | Use server timestamp, not client |

### 9.2 Error Messages

| Error Code | Vietnamese Message | English Message |
|------------|-------------------|-----------------|
| AUTH001 | Tên đăng nhập hoặc mật khẩu không đúng | Invalid username or password |
| AUTH002 | Tài khoản đã bị khóa | Account is locked |
| AUTH003 | Phiên đăng nhập hết hạn | Session expired |
| REG001 | Không thể đăng ký cho ngày trong quá khứ | Cannot register for past dates |
| REG002 | Đã quá thời hạn đăng ký cho ngày mai | Deadline passed for next day |
| ADMIN001 | Bạn không có quyền truy cập trang này | Access denied |
| ADMIN002 | Không thể hủy đăng ký cho ngày trong quá khứ | Cannot cancel past registrations |
| RPT001 | Báo cáo không có dữ liệu | No data for selected period |
| RPT002 | Thời gian tạo báo cáo quá lâu | Report generation timeout |

---

## Document Control

### Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-10 | Development Team | Initial release |

### Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Author | Development Team | 2026-05-10 | |
| Reviewer | | | |
| Approver | | | |

### References

- Functional Specification: `docs/features.md`
- Technical Specification: `docs/technical-spec.md`
- User Accounts Guide: `docs/user-accounts.md`
- Route Specification: `docs/routes.md`

---

*End of Business Rules Document*