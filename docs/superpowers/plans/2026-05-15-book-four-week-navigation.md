# Book Four Week Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/book` week navigation from the current week through four future weeks while keeping backend cutoff validation authoritative.

**Architecture:** `src/lib/registrationWindow.ts` owns all week-offset and write-window logic. `/book` stores a `weekOffset` UI state and renders Monday-Friday cards for that selected offset. `RegistrationService` continues to call `isAllowedRegistrationDate()` so the API rejects invalid dates even if the UI is bypassed.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, Prisma.

---

## File Structure

- Modify: `src/lib/registrationWindow.ts`
  - Add `MAX_BOOKING_WEEK_OFFSET = 4`.
  - Add `getWeekStart(now, weekOffset)`.
  - Add `getWeekdaysForOffset(now, weekOffset)`.
  - Update `isAllowedRegistrationDate()` to allow future weekdays through week offset `4`.
- Modify: `tests/lib/registrationWindow.test.ts`
  - Add tests for week offsets `0`, `1`, `4`, and rejection of offset `5`.
  - Add Sunday 23:00 next-Monday cutoff test.
- Modify: `tests/services/RegistrationService.test.ts`
  - Add tests for creating valid offset `4` date and rejecting offset `5` date.
- Modify: `app/(employee)/book/page.tsx`
  - Add week navigation state and buttons.
  - Use `getWeekdaysForOffset()` instead of current-week-only helper.
  - Show selected week range and current-week badge.
- Modify: `app/(employee)/book/page.test.tsx`
  - Add tests for next/previous navigation, disabled boundaries, Friday/Saturday/Sunday next-week accessibility.

## Task 1: Week Offset Helpers And Validation

**Files:**
- Modify: `src/lib/registrationWindow.ts`
- Modify: `tests/lib/registrationWindow.test.ts`

- [ ] **Step 1: Write failing helper tests**

Update import in `tests/lib/registrationWindow.test.ts`:

```ts
import {
  getCurrentWeekFutureWeekdays,
  getCurrentWeekWeekdays,
  getCutoffAt,
  getRegistrationDayState,
  getWeekdaysForOffset,
  isAllowedRegistrationDate,
} from '@/lib/registrationWindow'
```

Append tests inside `describe('registrationWindow', () => { ... })`:

```ts
  it('returns Monday through Friday for next week offset', () => {
    const now = new Date('2026-05-15T10:00:00+07:00')

    const days = getWeekdaysForOffset(now, 1)

    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-05-18',
      '2026-05-19',
      '2026-05-20',
      '2026-05-21',
      '2026-05-22',
    ])
  })

  it('returns Monday through Friday for fourth future week offset', () => {
    const now = new Date('2026-05-15T10:00:00+07:00')

    const days = getWeekdaysForOffset(now, 4)

    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-06-08',
      '2026-06-09',
      '2026-06-10',
      '2026-06-11',
      '2026-06-12',
    ])
  })

  it('allows future weekdays through week offset 4', () => {
    const now = new Date('2026-05-15T10:00:00+07:00')

    expect(isAllowedRegistrationDate(new Date('2026-06-12T00:00:00+07:00'), now)).toEqual({ ok: true })
  })

  it('rejects future weekdays after week offset 4', () => {
    const now = new Date('2026-05-15T10:00:00+07:00')

    expect(isAllowedRegistrationDate(new Date('2026-06-15T00:00:00+07:00'), now)).toEqual({ ok: false, reason: 'OUTSIDE_CURRENT_WEEK' })
  })

  it('locks next Monday at Sunday 23:00', () => {
    const now = new Date('2026-05-17T23:00:00+07:00')

    expect(isAllowedRegistrationDate(new Date('2026-05-18T00:00:00+07:00'), now)).toEqual({ ok: false, reason: 'LOCKED' })
    expect(isAllowedRegistrationDate(new Date('2026-05-19T00:00:00+07:00'), now)).toEqual({ ok: true })
  })
```

- [ ] **Step 2: Run helper tests to verify failure**

Run: `npm test -- tests/lib/registrationWindow.test.ts --run`

Expected: FAIL because `getWeekdaysForOffset` does not exist and offset `4` write validation still rejects outside current week.

- [ ] **Step 3: Implement week-offset helpers**

In `src/lib/registrationWindow.ts`, add constant after `WEEKDAY_NAMES`:

```ts
export const MAX_BOOKING_WEEK_OFFSET = 4
```

Add helper after `isSameCurrentWeek`:

```ts
export function getWeekStart(now = new Date(), weekOffset = 0): Date {
  const today = startOfLocalDay(now)
  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(monday.getDate() + diffToMonday + weekOffset * 7)
  return monday
}

export function getWeekdaysForOffset(now = new Date(), weekOffset = 0): RegistrationDayState[] {
  const monday = getWeekStart(now, weekOffset)

  return [0, 1, 2, 3, 4].map((offset) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + offset)
    return getRegistrationDayState(date, now)
  })
}
```

Replace `getCurrentWeekWeekdays` body with:

```ts
export function getCurrentWeekWeekdays(now = new Date()): RegistrationDayState[] {
  return getWeekdaysForOffset(now, 0)
}
```

Add helper before `isAllowedRegistrationDate`:

```ts
function isWithinBookingWindow(targetDate: Date, now: Date): boolean {
  const target = startOfLocalDay(targetDate)
  const currentWeekStart = getWeekStart(now, 0)
  const maxWeekStart = getWeekStart(now, MAX_BOOKING_WEEK_OFFSET)
  const maxWindowEnd = new Date(maxWeekStart)
  maxWindowEnd.setDate(maxWeekStart.getDate() + 7)

  return target >= currentWeekStart && target < maxWindowEnd
}
```

Replace current-week validation line in `isAllowedRegistrationDate`:

```ts
  if (!isWithinBookingWindow(target, now)) return { ok: false, reason: 'OUTSIDE_CURRENT_WEEK' }
```

- [ ] **Step 4: Run helper tests to verify pass**

Run: `npm test -- tests/lib/registrationWindow.test.ts --run`

Expected: PASS all helper tests.

- [ ] **Step 5: Commit helper changes**

```bash
git add src/lib/registrationWindow.ts tests/lib/registrationWindow.test.ts
git commit -m "feat: add four week booking window"
```

## Task 2: Service Validation For Four-Week Window

**Files:**
- Modify: `tests/services/RegistrationService.test.ts`

- [ ] **Step 1: Add service tests**

Append tests inside `describe('RegistrationService', () => { ... })`:

```ts
  it('allows creating a registration in week offset 4', async () => {
    const repository = (registrationService as any).registrationRepository
    repository.upsert = vi.fn().mockResolvedValue({
      id: 'reg-offset-4',
      userId: 'test-user-id',
      date: new Date('2026-06-12T00:00:00.000'),
      status: 'not_eating',
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const registration = await registrationService.create(
      'test-user-id',
      { date: '2026-06-12', status: 'not_eating' },
      new Date('2026-05-15T10:00:00+07:00')
    )

    expect(registration.status).toBe('not_eating')
    expect(repository.upsert).toHaveBeenCalledWith('test-user-id', new Date('2026-06-12T00:00:00.000'), 'not_eating')
  })

  it('rejects creating a registration after week offset 4', async () => {
    await expect(
      registrationService.create(
        'test-user-id',
        { date: '2026-06-15', status: 'not_eating' },
        new Date('2026-05-15T10:00:00+07:00')
      )
    ).rejects.toThrow('Ngay nay khong nam trong lich bao com')
  })
```

- [ ] **Step 2: Run service tests**

Run: `npm test -- tests/services/RegistrationService.test.ts --run`

Expected: PASS because Task 1 changed `isAllowedRegistrationDate` used by `RegistrationService`.

- [ ] **Step 3: Commit service tests**

```bash
git add tests/services/RegistrationService.test.ts
git commit -m "test: cover four week registration service window"
```

## Task 3: Book Page Navigation Tests

**Files:**
- Modify: `app/(employee)/book/page.test.tsx`

- [ ] **Step 1: Add navigation tests**

Append tests inside `describe('BookPage weekly cards', () => { ... })`:

```tsx
  it('opens on current week with previous disabled', () => {
    vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))

    render(<BookPage />)

    expect(screen.getByText('Tuần 11/05 - 15/05')).toBeInTheDocument()
    expect(screen.getByText('Tuần hiện tại')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '← Tuần trước' })).toBeDisabled()
  })

  it('advances to next week and returns to current week', () => {
    vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))

    render(<BookPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Tuần sau →' }))
    expect(screen.getByText('Tuần 18/05 - 22/05')).toBeInTheDocument()
    expect(screen.getByTestId('book-day-2026-05-18')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '← Tuần trước' }))
    expect(screen.getByText('Tuần 11/05 - 15/05')).toBeInTheDocument()
  })

  it('disables next at week offset 4', () => {
    vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))

    render(<BookPage />)

    const nextButton = screen.getByRole('button', { name: 'Tuần sau →' })
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)

    expect(screen.getByText('Tuần 08/06 - 12/06')).toBeInTheDocument()
    expect(nextButton).toBeDisabled()
  })

  it('keeps next week accessible on Saturday', () => {
    vi.setSystemTime(new Date('2026-05-16T10:00:00+07:00'))

    render(<BookPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Tuần sau →' }))
    expect(screen.getByTestId('book-day-2026-05-18')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run page tests to verify failure**

Run: `npm test -- "app/(employee)/book/page.test.tsx" --run`

Expected: FAIL because navigation controls and week range do not exist yet.

- [ ] **Step 3: Do not commit red tests alone**

Continue to Task 4 before committing.

## Task 4: Book Page Navigation UI

**Files:**
- Modify: `app/(employee)/book/page.tsx`
- Test: `app/(employee)/book/page.test.tsx`

- [ ] **Step 1: Update imports and state**

Replace import line in `app/(employee)/book/page.tsx`:

```tsx
import { MAX_BOOKING_WEEK_OFFSET, getWeekdaysForOffset, startOfLocalDay } from "@/lib/registrationWindow"
```

After hook call, add week state:

```tsx
  const [weekOffset, setWeekOffset] = useState(0)
```

- [ ] **Step 2: Use selected week offset**

Replace `days` memo with:

```tsx
  const days = useMemo(() => {
    const todayStart = startOfLocalDay(today)

    return getWeekdaysForOffset(today, weekOffset).map((day) => {
      const isPastOrToday = day.date <= todayStart

      return {
        ...day,
        locked: day.locked || isPastOrToday,
        status: (getStatusForDate(day.dateKey) || "eating") as Status,
      }
    })
  }, [today, weekOffset, getStatusForDate])
```

Add derived week label below counts:

```tsx
  const weekRangeLabel = days.length > 0
    ? `Tuần ${days[0].date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${days[4].date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`
    : "Tuần này"
```

- [ ] **Step 3: Add navigation controls**

Inside the main content, before stats row, add:

```tsx
          <div className="rounded-[18px] bg-surface-container-low p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-ink">{weekRangeLabel}</div>
                {weekOffset === 0 && (
                  <div className="text-xs font-semibold text-primary mt-1">Tuần hiện tại</div>
                )}
              </div>
              <div className="text-sm text-ink-muted-80">{weekOffset + 1}/5</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={weekOffset === 0}
                onClick={() => setWeekOffset((value) => Math.max(0, value - 1))}
                className="rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                ← Tuần trước
              </button>
              <button
                type="button"
                disabled={weekOffset === MAX_BOOKING_WEEK_OFFSET}
                onClick={() => setWeekOffset((value) => Math.min(MAX_BOOKING_WEEK_OFFSET, value + 1))}
                className="rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                Tuần sau →
              </button>
            </div>
          </div>
```

- [ ] **Step 4: Update helper text**

Replace header paragraph with:

```tsx
          <p className="text-base text-ink-muted-80 mt-2">
            Xem tuần hiện tại và 4 tuần tới. Bạn chỉ chỉnh được các ngày tương lai chưa khóa.
          </p>
```

- [ ] **Step 5: Run page tests**

Run: `npm test -- "app/(employee)/book/page.test.tsx" --run`

Expected: PASS all page tests.

- [ ] **Step 6: Commit UI navigation**

```bash
git add "app/(employee)/book/page.tsx" "app/(employee)/book/page.test.tsx"
git commit -m "feat: navigate book weeks"
```

## Task 5: Final Verification

**Files:**
- Verify: all changed files

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm test -- tests/lib/registrationWindow.test.ts tests/services/RegistrationService.test.ts "app/(employee)/book/page.test.tsx" tests/controllers/RegistrationsController.test.ts tests/hooks/useRegistrations.test.ts --run
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

Expected: May FAIL because repo already has unrelated lint debt. Confirm no new lint errors in changed files.

- [ ] **Step 5: Review final diff**

Run: `git diff --stat HEAD~4..HEAD`

Expected: Shows only `registrationWindow`, service tests, `/book` page/tests, and plan/spec docs.

- [ ] **Step 6: Commit verification fixes if needed**

If verification requires fixes, commit them:

```bash
git add src/lib/registrationWindow.ts tests/lib/registrationWindow.test.ts tests/services/RegistrationService.test.ts "app/(employee)/book/page.tsx" "app/(employee)/book/page.test.tsx"
git commit -m "fix: stabilize book week navigation"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

Spec coverage:

- Current week default: Task 4 state initializes to `0` and Task 3 test covers label.
- Four future weeks: Task 1 helper, Task 3 UI test, Task 4 UI boundary.
- No previous weeks: Task 4 disables previous at `0`.
- No beyond offset `4`: Task 1 backend helper rejects offset `5`; Task 4 disables next at `4`.
- Monday-Friday only: Task 1 helper returns five weekdays.
- Friday/Saturday/Sunday next-week access: Task 3 tests Saturday; Task 1 tests Sunday cutoff.
- Backend authoritative: Task 1 validation and Task 2 service coverage.

Placeholder scan: no placeholder-only steps; code-changing steps include exact snippets.

Type consistency: `weekOffset` is a number, bounded by `MAX_BOOKING_WEEK_OFFSET`; helpers return `RegistrationDayState[]`; status values remain `eating` / `not-eating` in UI and `eating` / `not_eating` in API.
