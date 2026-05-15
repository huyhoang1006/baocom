# Bao Com Cutoff Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build employee meal registration so future weekdays in the current week remain editable until each day's own 23:00 previous-day cutoff, while locked days stay visible and disabled.

**Architecture:** Put date-window and cutoff rules in a small pure helper so service and UI can use the same behavior. `RegistrationService` remains the backend authority and rejects invalid or locked writes. `/book` renders only future weekdays through Friday, marks locked days disabled, and saves explicit `eating` / `not_eating` statuses through the existing registrations API.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Vitest, Testing Library.

---

## File Structure

- Create: `src/lib/registrationWindow.ts`
  - Pure date helper functions for current-week future weekdays, cutoff calculation, and date validation.
- Create: `tests/lib/registrationWindow.test.ts`
  - Unit tests for date filtering and independent cutoff behavior.
- Modify: `src/services/RegistrationService.ts`
  - Use helper to reject locked, weekend, today/past, and outside-current-week writes in `create` and `update`.
- Modify: `tests/services/RegistrationService.test.ts`
  - Add service-level validation tests using stubbed repository methods and fixed `now`.
- Modify: `src/controllers/RegistrationsController.ts`
  - Map domain validation errors to 400 responses with user-facing messages.
- Modify: `src/hooks/useRegistrations.ts`
  - Expose `setStatus(date, status)` instead of status-inverting-only behavior.
- Modify: `tests/hooks/useRegistrations.test.ts`
  - Mock `create` and verify explicit status save plus API error propagation.
- Modify: `app/(employee)/book/page.tsx`
  - Render future weekdays remaining this week, show locked disabled cards, and let open days switch `Co an` / `Khong an`.

## Task 1: Date Window And Cutoff Helper

**Files:**
- Create: `src/lib/registrationWindow.ts`
- Create: `tests/lib/registrationWindow.test.ts`

- [ ] **Step 1: Write failing helper tests**

Create `tests/lib/registrationWindow.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import {
  getCurrentWeekFutureWeekdays,
  getCutoffAt,
  getRegistrationDayState,
  isAllowedRegistrationDate,
} from '@/lib/registrationWindow'

describe('registrationWindow', () => {
  it('returns Tuesday through Friday for Monday before cutoff', () => {
    const now = new Date('2026-05-11T10:00:00+07:00')

    const days = getCurrentWeekFutureWeekdays(now)

    expect(days.map((day) => day.dateKey)).toEqual([
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
    ])
  })

  it('excludes today and weekend days', () => {
    const now = new Date('2026-05-15T10:00:00+07:00')

    const days = getCurrentWeekFutureWeekdays(now)

    expect(days).toEqual([])
  })

  it('calculates cutoff as 23:00 on previous day', () => {
    const targetDate = new Date('2026-05-12T00:00:00+07:00')

    expect(getCutoffAt(targetDate).toISOString()).toBe(new Date('2026-05-11T23:00:00+07:00').toISOString())
  })

  it('locks Tuesday at Monday 23:00 but keeps Wednesday through Friday open', () => {
    const now = new Date('2026-05-11T23:00:00+07:00')

    const states = getCurrentWeekFutureWeekdays(now).map((day) => getRegistrationDayState(day.date, now))

    expect(states.map((state) => ({ dateKey: state.dateKey, locked: state.locked }))).toEqual([
      { dateKey: '2026-05-12', locked: true },
      { dateKey: '2026-05-13', locked: false },
      { dateKey: '2026-05-14', locked: false },
      { dateKey: '2026-05-15', locked: false },
    ])
  })

  it('locks Wednesday at Tuesday 23:00 but keeps Thursday and Friday open', () => {
    const now = new Date('2026-05-12T23:00:00+07:00')

    const states = getCurrentWeekFutureWeekdays(now).map((day) => getRegistrationDayState(day.date, now))

    expect(states.map((state) => ({ dateKey: state.dateKey, locked: state.locked }))).toEqual([
      { dateKey: '2026-05-13', locked: true },
      { dateKey: '2026-05-14', locked: false },
      { dateKey: '2026-05-15', locked: false },
    ])
  })

  it('rejects today, weekend, past date, and next week date', () => {
    const now = new Date('2026-05-11T10:00:00+07:00')

    expect(isAllowedRegistrationDate(new Date('2026-05-11T00:00:00+07:00'), now)).toEqual({ ok: false, reason: 'DATE_NOT_FUTURE' })
    expect(isAllowedRegistrationDate(new Date('2026-05-10T00:00:00+07:00'), now)).toEqual({ ok: false, reason: 'DATE_NOT_FUTURE' })
    expect(isAllowedRegistrationDate(new Date('2026-05-16T00:00:00+07:00'), now)).toEqual({ ok: false, reason: 'WEEKEND' })
    expect(isAllowedRegistrationDate(new Date('2026-05-18T00:00:00+07:00'), now)).toEqual({ ok: false, reason: 'OUTSIDE_CURRENT_WEEK' })
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/lib/registrationWindow.test.ts --run`

Expected: FAIL with module not found for `@/lib/registrationWindow`.

- [ ] **Step 3: Implement helper**

Create `src/lib/registrationWindow.ts` with:

```ts
export type RegistrationDateRejectionReason =
  | 'DATE_NOT_FUTURE'
  | 'WEEKEND'
  | 'OUTSIDE_CURRENT_WEEK'
  | 'LOCKED'

export type RegistrationDateValidation =
  | { ok: true }
  | { ok: false; reason: RegistrationDateRejectionReason }

export interface RegistrationDayState {
  date: Date
  dateKey: string
  dayName: string
  cutoffAt: Date
  locked: boolean
}

const WEEKDAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getCutoffAt(targetDate: Date): Date {
  const cutoffAt = startOfLocalDay(targetDate)
  cutoffAt.setDate(cutoffAt.getDate() - 1)
  cutoffAt.setHours(23, 0, 0, 0)
  return cutoffAt
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isSameCurrentWeek(targetDate: Date, now: Date): boolean {
  const target = startOfLocalDay(targetDate)
  const today = startOfLocalDay(now)
  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(monday.getDate() + diffToMonday)

  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)

  return target >= monday && target < nextMonday
}

export function isAllowedRegistrationDate(targetDate: Date, now = new Date()): RegistrationDateValidation {
  const target = startOfLocalDay(targetDate)
  const today = startOfLocalDay(now)

  if (target <= today) return { ok: false, reason: 'DATE_NOT_FUTURE' }
  if (isWeekend(target)) return { ok: false, reason: 'WEEKEND' }
  if (!isSameCurrentWeek(target, now)) return { ok: false, reason: 'OUTSIDE_CURRENT_WEEK' }
  if (now >= getCutoffAt(target)) return { ok: false, reason: 'LOCKED' }

  return { ok: true }
}

export function getRegistrationDayState(targetDate: Date, now = new Date()): RegistrationDayState {
  const date = startOfLocalDay(targetDate)
  const cutoffAt = getCutoffAt(date)

  return {
    date,
    dateKey: toDateKey(date),
    dayName: WEEKDAY_NAMES[date.getDay()],
    cutoffAt,
    locked: now >= cutoffAt,
  }
}

export function getCurrentWeekFutureWeekdays(now = new Date()): RegistrationDayState[] {
  const today = startOfLocalDay(now)
  const result: RegistrationDayState[] = []

  for (let offset = 1; offset <= 6; offset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)

    if (!isSameCurrentWeek(date, now)) break
    if (isWeekend(date)) continue

    result.push(getRegistrationDayState(date, now))
  }

  return result
}
```

- [ ] **Step 4: Run helper tests**

Run: `npm test -- tests/lib/registrationWindow.test.ts --run`

Expected: PASS all tests in `registrationWindow.test.ts`.

- [ ] **Step 5: Commit helper**

```bash
git add src/lib/registrationWindow.ts tests/lib/registrationWindow.test.ts
git commit -m "feat: add registration cutoff window helpers"
```

## Task 2: Service-Level Cutoff Validation

**Files:**
- Modify: `src/services/RegistrationService.ts`
- Modify: `tests/services/RegistrationService.test.ts`

- [ ] **Step 1: Add failing service tests**

Append these tests inside `describe('RegistrationService', () => { ... })` in `tests/services/RegistrationService.test.ts`:

```ts
  it('rejects creating a registration for a locked date', async () => {
    await expect(
      registrationService.create(
        'test-user-id',
        { date: '2026-05-12', status: 'not_eating' },
        new Date('2026-05-11T23:00:00+07:00')
      )
    ).rejects.toThrow('Ngay nay da khoa bao com')
  })

  it('rejects creating a registration for a weekend', async () => {
    await expect(
      registrationService.create(
        'test-user-id',
        { date: '2026-05-16', status: 'not_eating' },
        new Date('2026-05-11T10:00:00+07:00')
      )
    ).rejects.toThrow('Ngay nay khong nam trong lich bao com')
  })

  it('allows creating a registration for a later weekday that is still open', async () => {
    const repository = (registrationService as any).registrationRepository
    repository.upsert = vi.fn().mockResolvedValue({
      id: 'reg-1',
      userId: 'test-user-id',
      date: new Date('2026-05-13T00:00:00+07:00'),
      status: 'not_eating',
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const registration = await registrationService.create(
      'test-user-id',
      { date: '2026-05-13', status: 'not_eating' },
      new Date('2026-05-11T23:00:00+07:00')
    )

    expect(registration.status).toBe('not_eating')
    expect(repository.upsert).toHaveBeenCalledWith('test-user-id', new Date('2026-05-13T00:00:00.000'), 'not_eating')
  })
```

Also update first import line:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
```

- [ ] **Step 2: Run service tests to verify failure**

Run: `npm test -- tests/services/RegistrationService.test.ts --run`

Expected: FAIL because `RegistrationService.create` accepts only 2 arguments and does not validate cutoff/window rules.

- [ ] **Step 3: Implement service validation**

Modify `src/services/RegistrationService.ts` imports:

```ts
import { prisma } from '@/lib/prisma'
import { RegistrationRepository } from '@/repositories/RegistrationRepository'
import { CreateRegistrationDTO, UpdateRegistrationDTO, RegistrationStatus } from '@/dto/RegistrationDTO'
import { isAllowedRegistrationDate, startOfLocalDay } from '@/lib/registrationWindow'
```

Add helper method inside `RegistrationService` class:

```ts
  private validateEditableDate(date: Date, now = new Date()) {
    const validation = isAllowedRegistrationDate(date, now)
    if (validation.ok) return

    if (validation.reason === 'LOCKED') {
      throw new Error('Ngay nay da khoa bao com')
    }

    throw new Error('Ngay nay khong nam trong lich bao com')
  }
```

Replace `create` method with:

```ts
  async create(userId: string, data: CreateRegistrationDTO, now = new Date()) {
    if (!['eating', 'not_eating'].includes(data.status)) {
      throw new Error('Invalid status')
    }

    const date = startOfLocalDay(new Date(data.date))
    this.validateEditableDate(date, now)

    return this.registrationRepository.upsert(userId, date, data.status)
  }
```

In `update`, after forbidden check and before building `updateData`, add:

```ts
    if (role !== 'admin') {
      this.validateEditableDate(registration.date)
    }
```

- [ ] **Step 4: Run service tests**

Run: `npm test -- tests/services/RegistrationService.test.ts --run`

Expected: PASS all service tests.

- [ ] **Step 5: Commit service validation**

```bash
git add src/services/RegistrationService.ts tests/services/RegistrationService.test.ts
git commit -m "fix: enforce registration cutoff in service"
```

## Task 3: Controller Error Mapping

**Files:**
- Modify: `src/controllers/RegistrationsController.ts`
- Modify: `tests/controllers/RegistrationsController.test.ts`

- [ ] **Step 1: Add failing controller tests**

Append tests inside `describe('create', () => { ... })` in `tests/controllers/RegistrationsController.test.ts`:

```ts
    it('returns 400 for locked registration date', async () => {
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-05-12', status: 'not_eating' })
      })

      const response = await controller.create(req, 'test-user-id', new Date('2026-05-11T23:00:00+07:00'))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toBe('Ngay nay da khoa bao com')
    })

    it('returns 400 for weekend registration date', async () => {
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-05-16', status: 'not_eating' })
      })

      const response = await controller.create(req, 'test-user-id', new Date('2026-05-11T10:00:00+07:00'))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toBe('Ngay nay khong nam trong lich bao com')
    })
```

- [ ] **Step 2: Run controller tests to verify failure**

Run: `npm test -- tests/controllers/RegistrationsController.test.ts --run`

Expected: FAIL because `controller.create` does not accept a fixed `now` and does not map these errors.

- [ ] **Step 3: Implement controller mapping**

Change create signature in `src/controllers/RegistrationsController.ts`:

```ts
  async create(req: NextRequest, userId: string, now = new Date()) {
```

Change create service call:

```ts
      const registration = await this.registrationService.create(userId, body, now)
```

Replace create catch block with:

```ts
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid status') {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }
        if (error.message === 'Ngay nay da khoa bao com' || error.message === 'Ngay nay khong nam trong lich bao com') {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }
      throw error
    }
```

In update catch block, after forbidden mapping, add:

```ts
        if (error.message === 'Ngay nay da khoa bao com' || error.message === 'Ngay nay khong nam trong lich bao com') {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
```

- [ ] **Step 4: Run controller tests**

Run: `npm test -- tests/controllers/RegistrationsController.test.ts --run`

Expected: PASS all controller tests.

- [ ] **Step 5: Commit controller mapping**

```bash
git add src/controllers/RegistrationsController.ts tests/controllers/RegistrationsController.test.ts
git commit -m "fix: return registration cutoff errors"
```

## Task 4: Hook Explicit Status Save

**Files:**
- Modify: `src/hooks/useRegistrations.ts`
- Modify: `tests/hooks/useRegistrations.test.ts`

- [ ] **Step 1: Add failing hook test**

Update mock in `tests/hooks/useRegistrations.test.ts`:

```ts
vi.mock('@/lib/api', () => ({
  registrationsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}))
```

Append tests inside `describe('useRegistrations', () => { ... })`:

```ts
  it('saves explicit not-eating status for a date', async () => {
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: [] })
    vi.mocked(registrationsApi.create).mockResolvedValue({ registration: { id: 'reg-1' } })

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await result.current.setStatus('2026-05-13', 'not-eating')

    expect(success).toBe(true)
    expect(registrationsApi.create).toHaveBeenCalledWith('2026-05-13', 'not_eating')
  })

  it('returns API error message when save fails', async () => {
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: [] })
    vi.mocked(registrationsApi.create).mockRejectedValue(new Error('Ngay nay da khoa bao com'))

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await result.current.setStatus('2026-05-12', 'not-eating')

    expect(success).toBe(false)
    expect(result.current.error).toBe('Ngay nay da khoa bao com')
  })
```

- [ ] **Step 2: Run hook tests to verify failure**

Run: `npm test -- tests/hooks/useRegistrations.test.ts --run`

Expected: FAIL because `setStatus` does not exist.

- [ ] **Step 3: Implement explicit setter**

In `src/hooks/useRegistrations.ts`, replace `toggle` callback with:

```ts
  const setStatus = useCallback(async (date: string, status: UIStatus) => {
    if (status !== 'eating' && status !== 'not-eating') {
      setError('Invalid status')
      return false
    }

    const apiStatus = toAPIStatus(status)

    try {
      await registrationsApi.create(date, apiStatus)
      await fetchRegistrations()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update registration')
      return false
    }
  }, [fetchRegistrations])
```

Update returned object:

```ts
    setStatus,
```

Remove `toggle` from returned object. Keep `src/lib/api.ts` unchanged because existing `registrationsApi.create` upserts by date.

- [ ] **Step 4: Run hook tests**

Run: `npm test -- tests/hooks/useRegistrations.test.ts --run`

Expected: PASS all hook tests.

- [ ] **Step 5: Commit hook setter**

```bash
git add src/hooks/useRegistrations.ts tests/hooks/useRegistrations.test.ts
git commit -m "feat: save explicit registration status"
```

## Task 5: Employee Book UI

**Files:**
- Modify: `app/(employee)/book/page.tsx`

- [ ] **Step 1: Replace day generation and hook usage**

In `app/(employee)/book/page.tsx`, replace imports with:

```tsx
"use client"

import { useState, useMemo } from "react"
import { useRegistrations } from "@/hooks/useRegistrations"
import { getCurrentWeekFutureWeekdays } from "@/lib/registrationWindow"
import type { UIStatus } from "@/lib/statusUtils"
```

Replace local `Status`, `DayInfo`, and `WEEKDAY_NAMES` declarations with:

```tsx
type Status = "eating" | "not-eating"
```

Inside component, replace date and hook setup with:

```tsx
  const today = new Date()
  const { loading, error, setStatus, getStatusForDate } = useRegistrations()
```

Replace `days` memo with:

```tsx
  const days = useMemo(() => {
    return getCurrentWeekFutureWeekdays(today).map((day) => ({
      ...day,
      status: (getStatusForDate(day.dateKey) || "eating") as Status,
    }))
  }, [today, getStatusForDate])
```

Replace `handleToggle` with:

```tsx
  const handleStatusChange = async (dateKey: string, status: Status) => {
    const success = await setStatus(dateKey, status)
    if (success) {
      showNotification(status === "eating" ? "Đã đăng ký ăn" : "Đã đăng ký không ăn", "success")
    } else {
      showNotification(error || "Cập nhật thất bại", "error")
    }
  }
```

Replace counts with:

```tsx
  const eatingCount = days.filter((day) => day.status === "eating").length
  const openCount = days.filter((day) => !day.locked).length
```

- [ ] **Step 2: Replace stats labels**

In JSX stats row, use:

```tsx
              <div className="text-2xl font-semibold text-ink">{eatingCount}</div>
              <div className="text-sm text-ink-muted-80 mt-1">Có ăn</div>
```

and:

```tsx
              <div className="text-2xl font-semibold text-ink">{openCount}</div>
              <div className="text-sm text-ink-muted-80 mt-1">Còn sửa được</div>
```

- [ ] **Step 3: Replace day grid rendering**

Replace entire day grid block with:

```tsx
          {loading && (
            <div className="rounded-[18px] bg-surface-container-low p-5 text-ink-muted-80">
              Đang tải lịch báo cơm...
            </div>
          )}

          {!loading && days.length === 0 && (
            <div className="rounded-[18px] bg-surface-container-low p-5 text-ink-muted-80">
              Không còn ngày làm việc tương lai trong tuần này.
            </div>
          )}

          {!loading && days.length > 0 && openCount === 0 && (
            <div className="rounded-[18px] bg-surface-container-low p-5 text-ink-muted-80">
              Không còn ngày nào mở để chỉnh sửa trong tuần này.
            </div>
          )}

          {!loading && days.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {days.map((day) => {
                const isEating = day.status === "eating"
                const isNotEating = day.status === "not-eating"

                return (
                  <div
                    key={day.dateKey}
                    className={`
                      relative p-4 rounded-[18px] border-2 transition-all duration-200
                      ${day.locked ? "opacity-60" : ""}
                      ${isEating ? "border-success bg-success-bg" : ""}
                      ${isNotEating ? "border-error bg-error-bg" : ""}
                    `}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-semibold text-ink">{day.dayName}</span>
                          <span className="text-2xl font-bold text-ink">{day.date.getDate()}</span>
                        </div>
                        <div className="text-xs text-ink-muted-80 mt-1">
                          Khóa lúc {day.cutoffAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày {day.cutoffAt.toLocaleDateString("vi-VN")}
                        </div>
                      </div>

                      {day.locked && (
                        <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-xs font-semibold text-ink-muted-80">
                          Đã khóa
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={day.locked || isEating}
                        onClick={() => handleStatusChange(day.dateKey, "eating")}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                          isEating ? "border-success bg-success text-on-primary" : "border-hairline bg-canvas text-ink"
                        } ${day.locked ? "cursor-not-allowed" : "active:scale-95"}`}
                      >
                        Có ăn
                      </button>
                      <button
                        type="button"
                        disabled={day.locked || isNotEating}
                        onClick={() => handleStatusChange(day.dateKey, "not-eating")}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                          isNotEating ? "border-error bg-error text-on-primary" : "border-hairline bg-canvas text-ink"
                        } ${day.locked ? "cursor-not-allowed" : "active:scale-95"}`}
                      >
                        Không ăn
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
```

- [ ] **Step 4: Run lint/build check**

Run: `npm run lint`

Expected: PASS with no lint errors from `app/(employee)/book/page.tsx`.

Run: `npm run build`

Expected: PASS Next.js build.

- [ ] **Step 5: Commit UI**

```bash
git add "app/(employee)/book/page.tsx"
git commit -m "feat: show cutoff-aware meal booking UI"
```

## Task 6: Final Verification

**Files:**
- Verify: all changed files

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm test -- tests/lib/registrationWindow.test.ts tests/services/RegistrationService.test.ts tests/controllers/RegistrationsController.test.ts tests/hooks/useRegistrations.test.ts --run
```

Expected: PASS all targeted tests.

- [ ] **Step 2: Run full test suite**

Run: `npm test -- --run`

Expected: PASS. If existing unrelated tests fail, capture exact failing file/test and do not modify unrelated code without review.

- [ ] **Step 3: Run lint and build**

Run: `npm run lint`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Review git diff**

Run: `git diff --stat HEAD~5..HEAD`

Expected: Shows only registration cutoff helper, service/controller/hook/UI changes, and matching tests.

- [ ] **Step 5: Commit any verification-only fixes**

If verification required fixes, commit them:

```bash
git add src/lib/registrationWindow.ts tests/lib/registrationWindow.test.ts src/services/RegistrationService.ts tests/services/RegistrationService.test.ts src/controllers/RegistrationsController.ts tests/controllers/RegistrationsController.test.ts src/hooks/useRegistrations.ts tests/hooks/useRegistrations.test.ts "app/(employee)/book/page.tsx"
git commit -m "fix: stabilize registration cutoff flow"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

Spec coverage:

- Future weekdays in current week: Task 1 helper, Task 5 UI.
- Exclude today and weekends: Task 1 tests/helper, Task 2 service validation.
- Locked visible and disabled: Task 5 UI.
- Editable `Co an` / `Khong an`: Task 4 hook, Task 5 UI.
- API/service cutoff enforcement: Task 2 service, Task 3 controller.
- Locked-date error message: Task 2 and Task 3.
- Race between UI and save: Task 3 maps API error, Task 5 displays save failure.

Placeholder scan: no placeholder-only steps; each code-changing step includes concrete code.

Type consistency: UI uses `eating` / `not-eating`; API uses `eating` / `not_eating`; `toAPIStatus` bridges them in `useRegistrations.setStatus`.
