# Book Weekly Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `/book` to always show mobile-first cards for Monday through Friday of the current week while preserving strict backend edit validation.

**Architecture:** Split display-window rules from write-validation rules in `src/lib/registrationWindow.ts`. `/book` uses the display helper to render all current-week weekdays, while `RegistrationService` continues using `isAllowedRegistrationDate()` for authoritative write checks. UI tests cover the visible five-card behavior; helper tests cover weekday generation for Monday, Friday, and weekend current dates.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, Prisma-backed API services.

---

## File Structure

- Modify: `src/lib/registrationWindow.ts`
  - Add `getCurrentWeekWeekdays(now)` for display-only Monday-Friday current-week cards.
  - Keep `getCurrentWeekFutureWeekdays(now)` for compatibility if other code still imports it.
  - Keep `isAllowedRegistrationDate(targetDate, now)` strict for backend writes.
- Modify: `tests/lib/registrationWindow.test.ts`
  - Add tests proving `getCurrentWeekWeekdays()` returns all weekdays for Monday, Friday, Saturday, and Sunday.
  - Keep existing cutoff/write validation tests.
- Modify: `app/(employee)/book/page.tsx`
  - Use `getCurrentWeekWeekdays()` instead of `getCurrentWeekFutureWeekdays()`.
  - Render five cards in mobile-first order `T2` to `T6`.
  - Treat today, past days, and cutoff-locked days as disabled.
  - Remove empty-state copy for Friday/weekend because the list is never empty.
- Create: `app/(employee)/book/page.test.tsx`
  - Unit test `/book` renders five weekday cards on Friday and weekend.
  - Unit test locked/disabled cards remain visible.
  - Unit test open future day can call `setStatus()`.

## Task 1: Display Helper For Full Current Week

**Files:**
- Modify: `src/lib/registrationWindow.ts`
- Modify: `tests/lib/registrationWindow.test.ts`

- [ ] **Step 1: Write failing helper tests**

In `tests/lib/registrationWindow.test.ts`, update import block to include `getCurrentWeekWeekdays`:

```ts
import {
  getCurrentWeekFutureWeekdays,
  getCurrentWeekWeekdays,
  getCutoffAt,
  getRegistrationDayState,
  isAllowedRegistrationDate,
} from '@/lib/registrationWindow'
```

Append these tests inside `describe('registrationWindow', () => { ... })`:

```ts
  it('returns Monday through Friday for the current week when today is Monday', () => {
    const now = new Date('2026-05-11T10:00:00+07:00')

    const days = getCurrentWeekWeekdays(now)

    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
    ])
  })

  it('returns Monday through Friday for the current week when today is Friday', () => {
    const now = new Date('2026-05-15T10:00:00+07:00')

    const days = getCurrentWeekWeekdays(now)

    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
    ])
  })

  it('returns Monday through Friday for the same current week when today is Saturday', () => {
    const now = new Date('2026-05-16T10:00:00+07:00')

    const days = getCurrentWeekWeekdays(now)
    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
    ])
  })

  it('returns Monday through Friday for the same current week when today is Sunday', () => {
    const now = new Date('2026-05-17T10:00:00+07:00')

    const days = getCurrentWeekWeekdays(now)
    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
    ])
  })
```

- [ ] **Step 2: Run helper tests to verify failure**

Run: `npm test -- tests/lib/registrationWindow.test.ts --run`

Expected: FAIL with `getCurrentWeekWeekdays` export missing.

- [ ] **Step 3: Implement display helper**

In `src/lib/registrationWindow.ts`, add this helper after `isSameCurrentWeek`:

```ts
export function getCurrentWeekWeekdays(now = new Date()): RegistrationDayState[] {
  const today = startOfLocalDay(now)
  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(monday.getDate() + diffToMonday)

  return [0, 1, 2, 3, 4].map((offset) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + offset)
    return getRegistrationDayState(date, now)
  })
}
```

- [ ] **Step 4: Run helper tests to verify pass**

Run: `npm test -- tests/lib/registrationWindow.test.ts --run`

Expected: PASS all tests in `registrationWindow.test.ts`.

- [ ] **Step 5: Commit helper**

```bash
git add src/lib/registrationWindow.ts tests/lib/registrationWindow.test.ts
git commit -m "feat: add current week display window"
```

## Task 2: Book Page Weekly Card Tests

**Files:**
- Create: `app/(employee)/book/page.test.tsx`

- [ ] **Step 1: Write failing page tests**

Create `app/(employee)/book/page.test.tsx` with:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BookPage from './page'

const setStatus = vi.fn()

vi.mock('@/hooks/useRegistrations', () => ({
  useRegistrations: () => ({
    loading: false,
    error: null,
    setStatus,
    getStatusForDate: (dateKey: string) => {
      if (dateKey === '2026-05-12') return 'not-eating'
      return null
    },
  }),
}))

describe('BookPage weekly cards', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))
    setStatus.mockResolvedValue(true)
    setStatus.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders Monday through Friday cards even when today is Friday', () => {
    render(<BookPage />)

    expect(screen.getByTestId('book-day-2026-05-11')).toBeInTheDocument()
    expect(screen.getByTestId('book-day-2026-05-12')).toBeInTheDocument()
    expect(screen.getByTestId('book-day-2026-05-13')).toBeInTheDocument()
    expect(screen.getByTestId('book-day-2026-05-14')).toBeInTheDocument()
    expect(screen.getByTestId('book-day-2026-05-15')).toBeInTheDocument()
    expect(screen.queryByText('Không còn ngày làm việc tương lai trong tuần này.')).not.toBeInTheDocument()
  })

  it('shows locked cards as visible and disabled', () => {
    render(<BookPage />)

    const monday = screen.getByTestId('book-day-2026-05-11')
    expect(within(monday).getByText('Đã khóa')).toBeInTheDocument()
    expect(within(monday).getByRole('button', { name: 'Có ăn' })).toBeDisabled()
    expect(within(monday).getByRole('button', { name: 'Không ăn' })).toBeDisabled()
  })

  it('renders five weekday cards when today is Saturday', () => {
    vi.setSystemTime(new Date('2026-05-16T10:00:00+07:00'))

    render(<BookPage />)

    expect(screen.getAllByTestId(/^book-day-/)).toHaveLength(5)
    expect(screen.getByTestId('book-day-2026-05-15')).toBeInTheDocument()
  })

  it('lets employees change an open future day', async () => {
    vi.setSystemTime(new Date('2026-05-11T10:00:00+07:00'))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(<BookPage />)

    const wednesday = screen.getByTestId('book-day-2026-05-13')
    await user.click(within(wednesday).getByRole('button', { name: 'Không ăn' }))

    expect(setStatus).toHaveBeenCalledWith('2026-05-13', 'not-eating')
  })
})
```

- [ ] **Step 2: Run page tests to verify failure**

Run: `npm test -- "app/(employee)/book/page.test.tsx" --run`

Expected: FAIL because `/book` does not render five current-week cards and cards do not have `data-testid` attributes.

- [ ] **Step 3: Commit failing tests not allowed**

Do not commit red tests alone. Continue to Task 3.

## Task 3: Book Page Weekly Card UI

**Files:**
- Modify: `app/(employee)/book/page.tsx`
- Test: `app/(employee)/book/page.test.tsx`

- [ ] **Step 1: Update imports and day source**

In `app/(employee)/book/page.tsx`, change helper import:

```tsx
import { getCurrentWeekWeekdays, startOfLocalDay } from "@/lib/registrationWindow"
```

Replace the `days` memo with:

```tsx
  const days = useMemo(() => {
    const todayStart = startOfLocalDay(today)

    return getCurrentWeekWeekdays(today).map((day) => {
      const isPastOrToday = day.date <= todayStart

      return {
        ...day,
        locked: day.locked || isPastOrToday,
        status: (getStatusForDate(day.dateKey) || "eating") as Status,
      }
    })
  }, [today, getStatusForDate])
```

- [ ] **Step 2: Update header copy and stats**

Replace header paragraph with:

```tsx
          <p className="text-base text-ink-muted-80 mt-2">
            Tuần này luôn hiển thị từ Thứ 2 đến Thứ 6. Bạn chỉ chỉnh được các ngày tương lai chưa khóa.
          </p>
```

Replace `openCount` if needed; keep this exact line:

```tsx
  const openCount = days.filter((day) => !day.locked).length
```

- [ ] **Step 3: Remove empty state for Friday/weekend**

Delete this block from `page.tsx`:

```tsx
          {!loading && days.length === 0 && (
            <div className="rounded-[18px] bg-surface-container-low p-5 text-ink-muted-80">
              Không còn ngày làm việc tương lai trong tuần này.
            </div>
          )}
```

Keep the `openCount === 0` message so users understand the week is visible but all cards are locked.

- [ ] **Step 4: Add card test ids and mobile-first grid**

In the day card `<div ...>` inside `days.map`, add `data-testid`:

```tsx
                  <div
                    key={day.dateKey}
                    data-testid={`book-day-${day.dateKey}`}
                    className={`
```

Ensure the card grid is mobile-first with one column on mobile:

```tsx
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
```

- [ ] **Step 5: Run page tests to verify pass**

Run: `npm test -- "app/(employee)/book/page.test.tsx" --run`

Expected: PASS all `BookPage weekly cards` tests.

- [ ] **Step 6: Run helper and page tests together**

Run: `npm test -- tests/lib/registrationWindow.test.ts "app/(employee)/book/page.test.tsx" --run`

Expected: PASS helper and page tests.

- [ ] **Step 7: Commit UI changes**

```bash
git add src/lib/registrationWindow.ts tests/lib/registrationWindow.test.ts "app/(employee)/book/page.tsx" "app/(employee)/book/page.test.tsx"
git commit -m "feat: show full current week on book page"
```

## Task 4: Final Verification

**Files:**
- Verify: all changed files

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm test -- tests/lib/registrationWindow.test.ts "app/(employee)/book/page.test.tsx" tests/services/RegistrationService.test.ts tests/controllers/RegistrationsController.test.ts tests/hooks/useRegistrations.test.ts --run
```

Expected: PASS all targeted tests.

- [ ] **Step 2: Run full Vitest suite**

Run: `npm test -- --run`

Expected: PASS all Vitest tests.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS Next.js build.

- [ ] **Step 4: Run lint and record existing failures**

Run: `npm run lint`

Expected: May FAIL because repo already has unrelated lint debt. Confirm there are no new lint errors in `app/(employee)/book/page.tsx`, `app/(employee)/book/page.test.tsx`, `src/lib/registrationWindow.ts`, or `tests/lib/registrationWindow.test.ts`.

- [ ] **Step 5: Review final diff**

Run: `git diff --stat HEAD~1..HEAD`

Expected: Shows helper tests/helper plus `/book` page/test changes only.

- [ ] **Step 6: Commit verification fixes if any**

If verification requires fixes, commit them:

```bash
git add src/lib/registrationWindow.ts tests/lib/registrationWindow.test.ts "app/(employee)/book/page.tsx" "app/(employee)/book/page.test.tsx"
git commit -m "fix: stabilize weekly book cards"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

Spec coverage:

- Monday-Friday current week display: Task 1 helper and Task 3 UI.
- Friday/weekend still shows cards: Task 1 and Task 2 tests.
- No week navigation: Task 3 does not add navigation.
- No Saturday/Sunday cards: Task 1 helper returns only five weekdays.
- Past/today/locked visible but disabled: Task 2 tests and Task 3 UI.
- Open future days editable: Task 2 test and existing `setStatus` behavior.
- Backend strict validation: unchanged `isAllowedRegistrationDate` and existing service/controller tests in Task 4.

Placeholder scan: no placeholder-only steps; all code-changing steps include exact code.

Type consistency: display helper returns `RegistrationDayState[]`; UI status remains `eating` / `not-eating`; API write validation remains unchanged.
