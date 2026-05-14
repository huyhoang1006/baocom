# UAT Test Cases: Registrations and Booking Flows

**Document Type:** Black Box Acceptance Test Specification
**Test Object:** Registration & Booking System (Baocom)
**Date:** 2026-05-14
**Coverage:** Create, View, Update, Delete operations; Date validation; Status transitions

---

## 1. System Overview

### 1.1 Registration Entity

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| userId | string (UUID) | Owner of registration |
| date | Date | Registration date |
| status | enum | `eating` or `not_eating` |
| note | string (nullable) | Optional user note |

### 1.2 Status Format Convention

| Layer | Format | Example |
|-------|--------|---------|
| API | snake_case | `eating`, `not_eating` |
| UI | kebab-case | `eating`, `not-eating` |

### 1.3 Business Rules

- **One registration per user per day** - enforced via upsert on `(userId, date)` unique constraint
- **Default behavior**: User will eat unless explicitly marked as "not eating"
- **Past date blocking**: Cannot register for dates before today on `/book` page
- **Authorization**: Non-admin users can only manage their own registrations

---

## 2. Test Data Requirements

### 2.1 Test Users

| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| admin | admin123 | admin | Full access testing, IDOR验证 |
| hungpx | (any) | employee | Regular user flow testing |

### 2.2 Date Ranges

| Range | Format | Usage |
|-------|--------|-------|
| Today | `YYYY-MM-DD` | Baseline for all date tests |
| Future (1-7 days) | `YYYY-MM-DD` | Booking flow tests |
| Past (1-7 days ago) | `YYYY-MM-DD` | Past date blocking tests |
| First of month | `YYYY-MM-01` | Edge case testing |
| End of month | `YYYY-MM-DD` | Last day of month tests |

### 2.3 Status Values

| API Value | UI Display | Description |
|-----------|------------|-------------|
| `eating` | "Ăn" (green) | User will eat |
| `not_eating` | "Không ăn" (red) | User will not eat |

---

## 3. API Test Cases

### 3.1 Create Registration

#### TC-API-001: Create registration for future date (eating)

**Priority:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** Required (any role)

**Request:**
```json
{
  "date": "2026-05-20",
  "status": "eating"
}
```

**Expected:**
- Status: 201 Created
- Response contains registration object with generated UUID
- Date matches requested date
- Status equals `eating`

---

#### TC-API-002: Create registration for future date (not_eating)

**Priority:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** Required (any role)

**Request:**
```json
{
  "date": "2026-05-21",
  "status": "not_eating"
}
```

**Expected:**
- Status: 201 Created
- Response contains registration with status `not_eating`

---

#### TC-API-003: Create registration - duplicate (upsert behavior)

**Priority:** P1
**Endpoint:** `POST /api/registrations`
**Auth:** Required

**Scenario:** Registration already exists for user + date

**Request:**
```json
{
  "date": "2026-05-20",
  "status": "not_eating"
}
```

**Expected:**
- Status: 200 OK (upsert - updates existing, does not error)
- Existing registration status updated to `not_eating`
- Registration ID unchanged (not new record created)

---

#### TC-API-004: Create registration - missing date

**Priority:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** Required

**Request:**
```json
{
  "status": "eating"
}
```

**Expected:**
- Status: 400 Bad Request
- Error: `"Missing date or status"`

---

#### TC-API-005: Create registration - missing status

**Priority:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** Required

**Request:**
```json
{
  "date": "2026-05-20"
}
```

**Expected:**
- Status: 400 Bad Request
- Error: `"Missing date or status"`

---

#### TC-API-006: Create registration - invalid status value

**Priority:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** Required

**Request:**
```json
{
  "date": "2026-05-20",
  "status": "maybe"
}
```

**Expected:**
- Status: 400 Bad Request
- Error: `"Invalid status"`

---

#### TC-API-007: Create registration - invalid date format

**Priority:** P1
**Endpoint:** `POST /api/registrations`
**Auth:** Required

**Request:**
```json
{
  "date": "05-20-2026",
  "status": "eating"
}
```

**Expected:**
- Behavior: System attempts parse; invalid format may cause 500 or create with wrong date
- Note: Document actual behavior and add to edge case list

---

#### TC-API-008: Create registration - unauthenticated

**Priority:** P0
**Endpoint:** `POST /api/registrations`
**Auth:** None

**Request:**
```json
{
  "date": "2026-05-20",
  "status": "eating"
}
```

**Expected:**
- Status: 401 Unauthorized

---

### 3.2 Get Registrations

#### TC-API-009: Get all registrations for current user

**Priority:** P0
**Endpoint:** `GET /api/registrations`
**Auth:** Required (employee)

**Request:** No parameters

**Expected:**
- Status: 200 OK
- Returns only the authenticated user's registrations
- Each registration includes: id, date, status, note, user (name, username)

---

#### TC-API-010: Get registrations with date range filter

**Priority:** P1
**Endpoint:** `GET /api/registrations?startDate=2026-05-01&endDate=2026-05-31`
**Auth:** Required

**Expected:**
- Status: 200 OK
- Returns registrations within inclusive date range
- Response: `{ registrations: [...] }`

---

#### TC-API-011: Get registrations - empty result (no registrations)

**Priority:** P2
**Endpoint:** `GET /api/registrations`
**Auth:** Required (new user with no history)

**Expected:**
- Status: 200 OK
- Response: `{ registrations: [] }`

---

#### TC-API-012: Get single registration by ID (admin only)

**Priority:** P0
**Endpoint:** `GET /api/registrations/[id]`
**Auth:** Admin role required

**Expected:**
- Status: 200 OK
- Returns registration object
- Admin can access any user's registration

---

#### TC-API-013: Get single registration by ID - non-admin forbidden

**Priority:** P0
**Endpoint:** `GET /api/registrations/[id]`
**Auth:** Employee role (not admin)

**Scenario:** Attempting to view another user's registration

**Expected:**
- Status: 403 Forbidden
- Error: `"Forbidden"`

---

#### TC-API-014: Get single registration - not found

**Priority:** P1
**Endpoint:** `GET /api/registrations/[non-existent-id]`
**Auth:** Admin

**Expected:**
- Status: 404 Not Found
- Error: `"Not found"`

---

### 3.3 Update Registration

#### TC-API-015: Update registration status (eating → not_eating)

**Priority:** P0
**Endpoint:** `PATCH /api/registrations/[id]`
**Auth:** Owner (or admin)

**Request:**
```json
{
  "status": "not_eating"
}
```

**Expected:**
- Status: 200 OK
- Registration status updated to `not_eating`

---

#### TC-API-016: Update registration status (not_eating → eating)

**Priority:** P0
**Endpoint:** `PATCH /api/registrations/[id]`
**Auth:** Owner

**Request:**
```json
{
  "status": "eating"
}
```

**Expected:**
- Status: 200 OK
- Registration status updated to `eating`

---

#### TC-API-017: Update registration note

**Priority:** P1
**Endpoint:** `PATCH /api/registrations/[id]`
**Auth:** Owner

**Request:**
```json
{
  "note": "Vắng mặt vì công tác"
}
```

**Expected:**
- Status: 200 OK
- Note field updated

---

#### TC-API-018: Update registration - combined status and note

**Priority:** P1
**Endpoint:** `PATCH /api/registrations/[id]`
**Auth:** Owner

**Request:**
```json
{
  "status": "not_eating",
  "note": "Đi công tác"
}
```

**Expected:**
- Status: 200 OK
- Both fields updated

---

#### TC-API-019: Update registration - invalid status

**Priority:** P0
**Endpoint:** `PATCH /api/registrations/[id]`
**Auth:** Owner

**Request:**
```json
{
  "status": "maybe"
}
```

**Expected:**
- Status: 400 Bad Request
- Registration unchanged

---

#### TC-API-020: Update registration - IDOR (other user's registration)

**Priority:** P0
**Endpoint:** `PATCH /api/registrations/[other-user-id]`
**Auth:** Employee (not owner)

**Expected:**
- Status: 403 Forbidden
- Error: `"Forbidden"`
- Registration unchanged

---

#### TC-API-021: Update registration - not found

**Priority:** P1
**Endpoint:** `PATCH /api/registrations/[non-existent-id]`
**Auth:** Any

**Expected:**
- Status: 404 Not Found
- Error: `"Not found"`

---

### 3.4 Delete Registration

#### TC-API-022: Delete registration (admin only)

**Priority:** P0
**Endpoint:** `DELETE /api/registrations/[id]`
**Auth:** Admin role required

**Expected:**
- Status: 200 OK
- Response: `{ success: true }`
- Registration removed from database

---

#### TC-API-023: Delete registration - non-admin forbidden

**Priority:** P0
**Endpoint:** `DELETE /api/registrations/[id]`
**Auth:** Employee role

**Expected:**
- Status: 403 Forbidden
- Error: `"Forbidden"`
- Registration NOT deleted

---

#### TC-API-024: Delete registration - not found

**Priority:** P1
**Endpoint:** `DELETE /api/registrations/[non-existent-id]`
**Auth:** Admin

**Expected:**
- Status: 404 Not Found
- Error: `"Not found"`

---

## 4. UI Test Cases: /book Page

### 4.1 Page Load and Display

#### TC-UI-B01: Book page displays 8 days starting from today

**Priority:** P0
**UI Path:** `/book`
**Auth:** Employee (logged in)

**Steps:**
1. Login as employee
2. Navigate to `/book`

**Expected:**
- Page displays exactly 8 day cards
- First card labeled "Hôm nay" (Today badge)
- Days shown in chronological order (today + 7 future days)
- Each card shows: day name (CN/T2/T3/etc), date number, status indicator

---

#### TC-UI-B02: Day card displays correct status

**Priority:** P0
**UI Path:** `/book`

**Scenario:** User has existing registration

**Steps:**
1. Pre-condition: User has registration for tomorrow with `eating` status
2. Navigate to `/book`

**Expected:**
- Tomorrow's card shows green "Ăn" status indicator
- Card border color: success (green)

---

#### TC-UI-B03: Day card displays "not eating" status

**Priority:** P0
**UI Path:** `/book`

**Scenario:** User registered as not eating

**Steps:**
1. Pre-condition: User has registration for tomorrow with `not_eating` status
2. Navigate to `/book`

**Expected:**
- Tomorrow's card shows red "Không ăn" status indicator
- Card border color: error (red)

---

#### TC-UI-B04: Day card displays "not chosen" status for new user

**Priority:** P0
**UI Path:** `/book`

**Scenario:** New user with no registrations

**Steps:**
1. Login as user with no registration history
2. Navigate to `/book`

**Expected:**
- All 8 days show "Chưa chọn" (Not chosen) status
- Card border color: default (neutral)

---

#### TC-UI-B05: Stats display correct counts

**Priority:** P1
**UI Path:** `/book`

**Steps:**
1. User has 3 registrations with status `eating`
2. Navigate to `/book`

**Expected:**
- "Đã đăng ký" (Registered) stat shows `3`
- "Tuần này" (This week) stat shows count of non-past days

---

### 4.2 Status Toggle Flow

#### TC-UI-B06: Toggle from "not chosen" to "eating"

**Priority:** P0
**UI Path:** `/book`

**Steps:**
1. Navigate to `/book`
2. Click on a future day card (not today)

**Expected:**
- Status changes from "Chưa chọn" to "Ăn"
- Card border changes to green
- Toast notification: "Đã đăng ký ăn" appears
- Toast auto-dismisses after 3 seconds
- Registration created in database with `eating` status

---

#### TC-UI-B07: Toggle from "eating" to "not eating"

**Priority:** P0
**UI Path:** `/book`

**Steps:**
1. Pre-condition: User has `eating` registration for a future day
2. Navigate to `/book`
3. Click on that day card

**Expected:**
- Status changes from "Ăn" to "Không ăn"
- Card border changes to red
- Toast notification: "Đã hủy" (or "Đã đăng ký không ăn")
- Registration updated to `not_eating` in database

---

#### TC-UI-B08: Toggle from "not eating" to "eating"

**Priority:** P0
**UI Path:** `/book`

**Steps:**
1. Pre-condition: User has `not_eating` registration for a future day
2. Navigate to `/book`
3. Click on that day card

**Expected:**
- Status changes from "Không ăn" to "Ăn"
- Card border changes to green
- Toast: "Đã đăng ký ăn"

---

#### TC-UI-B09: Past date is disabled and non-clickable

**Priority:** P0
**UI Path:** `/book`

**Steps:**
1. Navigate to `/book`

**Expected:**
- Yesterday's date (if shown in grid) is visually dimmed
- Click on past date does NOT trigger toggle
- Cursor changes to `not-allowed` on past dates

---

#### TC-UI-B10: Today is marked but toggleable

**Priority:** P1
**UI Path:** `/book`

**Steps:**
1. Navigate to `/book`

**Expected:**
- First card (today) has ring highlight
- Today is NOT disabled (can register/unregister for today)

---

#### TC-UI-B11: Toggle failure shows error notification

**Priority:** P1
**UI Path:** `/book`

**Scenario:** Network failure during toggle

**Steps:**
1. Cause network error
2. Attempt to toggle a day

**Expected:**
- Toast notification: "Cập nhật thất bại" (Update failed) appears
- Error toast style (red background)
- Status remains unchanged
- No registration created/updated in database

---

## 5. UI Test Cases: /my-history Page

### 5.1 Page Load and Display

#### TC-UI-H01: History page displays current month by default

**Priority:** P0
**UI Path:** `/my-history`
**Auth:** Employee

**Steps:**
1. Login as employee
2. Navigate to `/my-history`

**Expected:**
- Calendar displays current month and year
- Header shows: "Tháng [N] [YYYY]"

---

#### TC-UI-H02: Calendar shows registration status per day

**Priority:** P0
**UI Path:** `/my-history`

**Steps:**
1. Pre-condition: User has registrations in current month
2. Navigate to `/my-history`

**Expected:**
- Days with `eating` status show green dot indicator
- Days with `not_eating` status show red dot indicator
- Days without registration show no indicator

---

#### TC-UI-H03: Stats row shows correct counts

**Priority:** P1
**UI Path:** `/my-history`

**Steps:**
1. Pre-condition: Current month has 5 eating, 2 not eating registrations
2. Navigate to `/my-history`

**Expected:**
- "Tổng" (Total) stat shows `7`
- "Có ăn" (Eating) stat shows `5` in green box
- "Không ăn" (Not eating) stat shows `2` in red box

---

#### TC-UI-H04: Loading skeleton shown during data fetch

**Priority:** P2
**UI Path:** `/my-history`

**Steps:**
1. Navigate to `/my-history`

**Expected:**
- Calendar grid shows animated skeleton placeholders while loading
- Stats show `-` placeholders

---

### 5.2 Month Navigation

#### TC-UI-H05: Navigate to previous month

**Priority:** P1
**UI Path:** `/my-history`

**Steps:**
1. Navigate to `/my-history`
2. Click left arrow button (◀)

**Expected:**
- Calendar updates to show previous month
- Header updates: "Tháng [N-1] [YYYY]"
- Registrations for new month are fetched and displayed

---

#### TC-UI-H06: Navigate to next month

**Priority:** P1
**UI Path:** `/my-history`

**Steps:**
1. Navigate to `/my-history`
2. Click right arrow button (▶)

**Expected:**
- Calendar updates to show next month
- Header updates accordingly

---

#### TC-UI-H07: Navigate from January to December (previous year)

**Priority:** P2
**UI Path:** `/my-history`

**Steps:**
1. Set current month to January 2026
2. Click left arrow

**Expected:**
- Calendar shows December 2025
- Year decrements in header

---

#### TC-UI-H08: Navigate from December to January (next year)

**Priority:** P2
**UI Path:** `/my-history`

**Steps:**
1. Set current month to December 2026
2. Click right arrow

**Expected:**
- Calendar shows January 2027
- Year increments in header

---

### 5.3 Calendar Grid Display

#### TC-UI-H09: Today is highlighted in calendar

**Priority:** P0
**UI Path:** `/my-history`

**Steps:**
1. Navigate to `/my-history` for current month

**Expected:**
- Today's date cell has primary color background (blue)
- White text for date number

---

#### TC-UI-H10: Days outside current month are dimmed

**Priority:** P1
**UI Path:** `/my-history`

**Steps:**
1. Navigate to `/my-history`

**Expected:**
- Previous/next month days shown at start/end of grid
- These days have reduced opacity (40%)

---

## 6. UI Test Cases: /dashboard Page

### 6.1 Weekly Menu Display

#### TC-UI-D01: Dashboard shows Monday-Friday tabs

**Priority:** P0
**UI Path:** `/dashboard`
**Auth:** Employee

**Steps:**
1. Login as employee
2. Navigate to `/dashboard`

**Expected:**
- Horizontal scrollable list of day buttons (T2, T3, T4, T5, T6)
- Current day (today) is pre-selected
- Shows 5 weekdays (Monday to Friday of current week)

---

#### TC-UI-D02: Selecting a day shows menu details

**Priority:** P0
**UI Path:** `/dashboard`

**Steps:**
1. Navigate to `/dashboard`
2. Click on "T3" button

**Expected:**
- Main content area updates to show Tuesday's menu
- Header shows: "Thứ 3, [date]"
- Menu sections display: Món chính (Main), Món rau (Vegetables), Tráng miệng (Dessert)

---

#### TC-UI-D03: Registration status badge shown

**Priority:** P1
**UI Path:** `/dashboard`

**Steps:**
1. Pre-condition: User has `eating` registration for Wednesday
2. Navigate to `/dashboard`
3. Select Wednesday tab

**Expected:**
- Badge shows "Đã đăng ký" (Registered) in green
- Badge shows "Chưa đăng ký" (Not registered) in orange if no registration

---

#### TC-UI-D04: Empty menu handling

**Priority:** P1
**UI Path:** `/dashboard`

**Steps:**
1. Pre-condition: No menu configured for a specific day
2. Navigate to `/dashboard`
3. Select that day

**Expected:**
- "Chưa có menu" (No menu) message shown in dish sections

---

## 7. Edge Cases

### 7.1 Date Edge Cases

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| First day of month | Register for `YYYY-01-01` | Success |
| Last day of month | Register for `YYYY-12-31` | Success |
| Leap year Feb 29 | Register for 2028-02-29 | Success |
| Weekend dates | Register for Saturday/Sunday | Allowed (no blocking) |

### 7.2 Status Transition Edge Cases

| Current Status | Action | New Status |
|----------------|--------|------------|
| null (none) | Click | eating |
| eating | Click | not_eating |
| not_eating | Click | eating |

### 7.3 Concurrent Access

| Scenario | Expected |
|----------|----------|
| Two browsers, same user, same day | Last write wins (upsert) |
| Admin updates while user updates | Last write wins |

### 7.4 Empty/Missing Data

| Scenario | Expected |
|----------|----------|
| No registrations exist | Empty array `[]` returned |
| Registration not found | 404 response |
| Invalid JSON body | 400 with "Invalid JSON body" |

---

## 8. Authorization Matrix

| Endpoint | Method | Employee | Admin |
|----------|--------|----------|-------|
| /api/registrations | GET | Own only | Own only |
| /api/registrations | POST | Allowed | Allowed |
| /api/registrations/[id] | GET | 403 | Allowed |
| /api/registrations/[id] | PATCH | Own only | Own only |
| /api/registrations/[id] | DELETE | 403 | Allowed |

---

## 9. Test Execution Checklist

### Pre-conditions
- [ ] Test database is clean (or has known state)
- [ ] Test users exist (admin, employee)
- [ ] Test can be repeated without side effects

### Execution Order (Recommended)
1. API tests first (TC-API-001 through TC-API-024)
2. UI tests second (TC-UI-B01 through TC-UI-D04)
3. Edge cases last

### Success Criteria
- All P0 tests must pass
- P1 tests should pass (document any failures)
- P2 tests: document results

---

## 10. Known Limitations

1. **Date format validation**: Invalid date formats may not be rejected with clear errors
2. **Double-click prevention**: UI does not explicitly prevent rapid double-clicks (mitigated by 3s toast auto-dismiss)
3. **Note field**: Notes can be updated via API but UI pages do not expose note editing functionality

---

*Document Version: 1.0*
*Last Updated: 2026-05-14*
*Author: AI Assistant*