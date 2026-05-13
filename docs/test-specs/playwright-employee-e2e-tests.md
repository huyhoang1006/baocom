# Playwright E2E Tests - Employee Booking Flows

## Overview

- **Pages Under Test**: Book, Dashboard, My-History
- **Hooks**: `useRegistrations`, `useDailyMenus`
- **APIs**: `/api/registrations`, `/api/daily-menus`
- **Browser**: Chromium (desktop + mobile viewport)

---

## Page Objects

```
src/e2e/page-objects/
├── BookPage.ts
├── DashboardPage.ts
└── HistoryPage.ts
```

### BookPage Object

```typescript
class BookPage {
  // Stats
  registeredCount: () => Locator
  thisWeekCount: () => Locator

  // Day cards (8 days, index 0-7)
  dayCard(index: number): Locator
  dayStatusLabel(index: number): Locator      // "Ăn" | "Không ăn" | "Chưa chọn"
  dayStatusDot(index: number): Locator        // colored circle
  todayBadge(index: number): Locator          // "Hôm nay" badge
  dayButton(index: number): Locator

  // Past day blocking
  isDayDisabled(index: number): Promise<boolean>

  // Notification toast
  notification(): Locator
  notificationMessage(): Locator

  // Navigation
  goto(): Promise<void>
}
```

### DashboardPage Object

```typescript
class DashboardPage {
  // Day selector (Mon-Fri)
  dayTab(dayIndex: number): Locator   // 0=Mon, 4=Fri
  dayTabLabel(dayIndex: number): Locator

  // Content card
  dateHeader(): Locator
  registrationBadge(): Locator        // "Đã đăng ký" | "Chưa đăng ký"
  mainDish(): Locator
  vegetableDish(index: number): Locator
  dessertDish(): Locator
  emptyDishMessage(): Locator

  // Loading states
  dayTabsLoading(): Locator
  contentLoading(): Locator

  goto(): Promise<void>
}
```

### HistoryPage Object

```typescript
class HistoryPage {
  // Stats
  totalStat(): Locator
  eatingStat(): Locator
  notEatingStat(): Locator

  // Calendar navigation
  prevMonthBtn(): Locator
  nextMonthBtn(): Locator
  monthYearLabel(): Locator

  // Calendar grid
  dayCell(day: number, isCurrentMonth: boolean): Locator
  todayCell(): Locator
  dayStatusDot(day: number, isCurrentMonth: boolean): Locator

  // Loading
  calendarLoading(): Locator

  goto(): Promise<void>
}
```

---

## Test Cases

### TC-B01: Book page displays 8 days starting from today

| | |
|---|---|
| **Priority** | P0 |
| **Time** | 5s |

**Steps:**
1. Navigate to `/book`
2. Count visible day cards

**Selectors:**
- `.day-card` (or `button[class*="rounded-[18px]"]`)

**Assertions:**
- Exactly 8 day cards visible
- First card shows "Hôm nay" badge
- Day names: CN, T2, T3, T4, T5, T6, T7 sequence
- Dates increment by 1

---

### TC-B02: Day status toggle cycle (none -> eating -> not-eating -> eating)

| | |
|---|---|
| **Priority** | P0 |
| **Time** | 10s |

**Precondition:** No registration exists for a future day

**Steps:**
1. Go to `/book`
2. Click on a future day card (index > 0)
3. Verify status changes to "Ăn" (eating)
4. Click again
5. Verify status changes to "Không ăn" (not-eating)
6. Click again
7. Verify status returns to "Ăn" (eating)

**Selectors:**
- `dayStatusLabel(index)` - text assertion
- `dayButton(index)` - click target

**Assertions:**
- Status label cycles correctly
- Background color reflects state:
  - eating: `border-success bg-success-bg`
  - not-eating: `border-error bg-error-bg`
  - none: `border-hairline bg-surface-container-low`
- Success toast appears after each toggle

---

### TC-B03: Past date blocking

| | |
|---|---|
| **Priority** | P0 |
| **Time** | 5s |

**Steps:**
1. Navigate to `/book`
2. Identify yesterday's card (last past day)
3. Verify it is disabled and dimmed

**Selectors:**
- `dayButton(index)` with `disabled` attribute
- Past card: `opacity-50 cursor-not-allowed`

**Assertions:**
- Past day buttons have `disabled` attribute
- Clicking past day does NOT trigger toggle
- No toast notification appears when clicking past day

---

### TC-B04: Book page stats display

| | |
|---|---|
| **Priority** | P1 |
| **Time** | 5s |

**Steps:**
1. Navigate to `/book`
2. Count "Ăn" cards manually
3. Compare with stats

**Selectors:**
- `registeredCount()` - first stat box
- `thisWeekCount()` - second stat box

**Assertions:**
- "Đã đăng ký" count equals number of cards with status "Ăn"
- "Tuần này" count equals remaining days (including today)

---

### TC-B05: Today indicator ring

| | |
|---|---|
| **Priority** | P1 |
| **Time** | 3s |

**Steps:**
1. Go to `/book`
2. Locate first day card

**Selectors:**
- `todayBadge(0)` - "Hôm nay" badge element
- Parent button: `ring-2 ring-primary ring-offset-2`

**Assertions:**
- First card has ring indicator
- First card shows "Hôm nay" badge at top-right corner

---

### TC-D01: Dashboard shows weekly menu for current week

| | |
|---|---|
| **Priority** | P0 |
| **Time** | 8s |

**Steps:**
1. Navigate to `/dashboard`
2. Wait for content to load
3. Observe day tabs and menu card

**Selectors:**
- `dayTab(0)` through `dayTab(4)` - 5 weekday tabs
- `dateHeader()` - shows selected day + date
- `mainDish()`, `vegetableDish(0)`, `dessertDish()`

**Assertions:**
- 5 day tabs visible (Mon-Fri of current week)
- Menu displays: Món chính, Món rau, Tráng miệng sections
- Registration badge shows "Đã đăng ký" or "Chưa đăng ký"

---

### TC-D02: Dashboard day tab navigation

| | |
|---|---|
| **Priority** | P0 |
| **Time** | 8s |

**Steps:**
1. Go to `/dashboard`
2. Click each day tab
3. Observe content updates

**Selectors:**
- `dayTab(i)` - click each tab
- `dateHeader()` - read date after each click

**Assertions:**
- Clicking tab updates date header
- Menu content updates to match selected day
- Active tab has `bg-primary text-on-primary`

---

### TC-D03: Dashboard empty menu handling

| | |
|---|---|
| **Priority** | P1 |
| **Time** | 5s |

**Steps:**
1. Mock API `/api/daily-menus` to return empty menus
2. Navigate to `/dashboard`
3. Observe how empty state is displayed

**Selectors:**
- `mainDish()` - may show "Chưa có menu"
- `emptyDishMessage()` - "Chưa có món rau" text

**Assertions:**
- Empty dishes show placeholder text
- No crash or error UI

---

### TC-H01: History page displays calendar with registration status

| | |
|---|---|
| **Priority** | P0 |
| **Time** | 8s |

**Steps:**
1. Navigate to `/my-history`
2. Observe calendar grid

**Selectors:**
- `totalStat()`, `eatingStat()`, `notEatingStat()`
- `dayCell(day, true)` - current month days
- `dayStatusDot(day, true)` - colored indicator dot
- `monthYearLabel()` - "Tháng M YYYY"

**Assertions:**
- Calendar shows full month grid (previous + current + next month fill)
- Days with registrations show colored dots:
  - eating: green dot (`bg-success`)
  - not-eating: red dot (`bg-error`)
- Stats match actual registration counts

---

### TC-H02: History month navigation

| | |
|---|---|
| **Priority** | P1 |
| **Time** | 8s |

**Steps:**
1. Go to `/my-history`
2. Record current month/year
3. Click previous month button
4. Verify month decrements
5. Click next month twice
6. Verify month increments twice

**Selectors:**
- `prevMonthBtn()`, `nextMonthBtn()`
- `monthYearLabel()`

**Assertions:**
- Month/year label updates correctly
- Calendar grid re-renders with new month's data
- Cannot navigate beyond data boundaries (if any)

---

### TC-H03: History stats calculation

| | |
|---|---|
| **Priority** | P1 |
| **Time** | 5s |

**Steps:**
1. Go to `/my-history`
2. Count dots manually in current month
3. Compare with stat numbers

**Assertions:**
- "Tổng" = eating + not-eating
- Each stat matches visible indicators

---

### TC-UI01: Loading states

| | |
|---|---|
| **Priority** | P1 |
| **Time** | 5s each page |

**Steps:**
1. Navigate to each page with throttled network
2. Observe skeleton loaders

**Pages:**
- `/book` - `animate-pulse` on day cards (though book has no explicit loading state, hook returns `loading` which could show skeleton)
- `/dashboard` - `h-12 bg-surface-container rounded-full animate-pulse` for tabs; `rounded-[18px] overflow-hidden border border-hairline bg-surface p-5 animate-pulse` for content
- `/my-history` - `h-10 bg-surface-container rounded animate-pulse` in calendar grid

**Assertions:**
- No raw JSON or error text during load
- Page layout remains stable

---

### TC-UI02: Error handling

| | |
|---|---|
| **Priority** | P1 |
| **Time** | 5s each page |

**Steps:**
1. Mock API to throw 500 error
2. Navigate to each page

**Assertions:**
- Error message displayed (from `err.message` in hooks)
- No crash - page remains functional
- Retry/refetch possible

---

### TC-UI03: Empty states

| | |
|---|---|
| **Priority** | P2 |
| **Time** | 5s each page |

**Steps:**
1. Mock APIs to return empty data
2. Visit each page

**Assertions:**
- Meaningful empty state messages
- No broken layouts

---

### TC-R01: Responsive - mobile viewport (375px)

| | |
|---|---|
| **Priority** | P1 |
| **Time** | 15s |

**Steps:**
1. Set viewport to `375 x 812` (iPhone-like)
2. Navigate to `/book`, `/dashboard`, `/my-history`
3. Verify layout adapts

**Assertions:**
- No horizontal overflow
- Day cards stack 2-column (grid `grid-cols-2`)
- Touch targets minimum 44px
- Text readable without zoom

---

### TC-R02: Responsive - tablet viewport (768px)

| | |
|---|---|
| **Priority** | P2 |
| **Time** | 10s |

**Steps:**
1. Set viewport to `768 x 1024`
2. Visit each page

**Assertions:**
- Content uses full width up to `max-w-[900px]`
- Comfortable spacing maintained

---

### TC-R03: Responsive - desktop viewport (1280px)

| | |
|---|---|
| **Priority** | P1 |
| **Time** | 10s |

**Steps:**
1. Set viewport to `1280 x 720`
2. Visit each page

**Assertions:**
- Content centered with `max-w-[900px] mx-auto`
- Large padding respected (`px-6 lg:px-10`)

---

## Test Execution Order

```
Setup:  Clean test database state
├── Smoke (P0)
│   ├── TC-B01 - 8 days display
│   ├── TC-B02 - Status toggle cycle
│   ├── TC-B03 - Past date blocking
│   ├── TC-D01 - Dashboard weekly menu
│   ├── TC-D02 - Day tab navigation
│   └── TC-H01 - History calendar
└── Core (P1)
    ├── TC-B04, TC-B05
    ├── TC-D03
    ├── TC-H02, TC-H03
    └── TC-UI01, TC-UI02, TC-R01, TC-R03
        Optional (P2)
        ├── TC-UI03
        └── TC-R02
```

---

## Fixtures & Helpers

```typescript
// fixtures/api.ts
export const apiFixtures = {
  mockRegistrations: (page: Page, data: Registration[]) => {...},
  mockDailyMenus: (page: Page, data: DailyMenu[]) => {...},
  mockNetworkError: (page: Page) => {...},
}

// helpers.ts
export const selectToday = (page: Page) => page.locator('button').filter({hasText: 'Hôm nay'}).first()
export const waitForNotification = (page: Page, text: string) => {...}
export const getDayStatus = (page: Page, index: number) => {...}
```

---

## Mock Data Shapes

```typescript
interface Registration {
  id: string
  date: string        // "2026-05-13"
  status: "eating" | "not_eating"
  note?: string
}

interface DailyMenu {
  id: string
  date: string
  meals: Array<{
    id: string
    sortOrder: number
    meal: { id: string; name: string; type: 'main' | 'vegetable' | 'dessert' }
  }>
}
```