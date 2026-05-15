# Registration DateKey Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/book` show the updated future-day registration status after API success and after refresh by using canonical `dateKey` matching.

**Architecture:** `RegistrationsController` shapes registration responses with a stable `dateKey` while keeping the existing `date` field. `useRegistrations()` treats `dateKey` as the primary day identity, updates local state from successful POST responses, and then refetches to sync with backend truth.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Testing Library React hooks, Prisma-backed services.

---

## File Structure

- Modify: `src/controllers/RegistrationsController.ts`
  - Add a small private response mapper that spreads a registration and adds `dateKey: toDateKey(registration.date)`.
  - Use mapper in `getAll()` and `create()` responses.
- Modify: `tests/controllers/RegistrationsController.test.ts`
  - Add controller tests proving `GET` and `POST` responses include `dateKey`.
- Modify: `src/hooks/useRegistrations.ts`
  - Extend local `Registration` type with optional `dateKey`.
  - Add `getRegistrationDateKey()` helper for primary `dateKey` and fallback `date` conversion.
  - Add local upsert from successful POST response before refetch.
- Modify: `tests/hooks/useRegistrations.test.ts`
  - Add tests for dateKey-based matching and post-success state update.
- Verify: `app/(employee)/book/page.test.tsx`
  - Existing page tests should continue to pass because `/book` already sends `day.dateKey`.

## Task 1: API Registration Responses Include DateKey

**Files:**
- Modify: `tests/controllers/RegistrationsController.test.ts`
- Modify: `src/controllers/RegistrationsController.ts`

- [ ] **Step 1: Add failing controller response tests**

In `tests/controllers/RegistrationsController.test.ts`, update the import line:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
```

Append these tests inside `describe('getAll', () => { ... })` after the existing `should return user registrations` test:

```ts
    it('returns dateKey for fetched registrations', async () => {
      const service = (controller as unknown as { registrationService: { findAll: ReturnType<typeof vi.fn> } }).registrationService
      service.findAll = vi.fn().mockResolvedValue([
        {
          id: 'reg-1',
          userId: 'test-user-id',
          date: new Date('2026-05-18T00:00:00.000Z'),
          status: 'eating',
          note: null,
          createdAt: new Date('2026-05-15T00:00:00.000Z'),
          updatedAt: new Date('2026-05-15T00:00:00.000Z'),
          user: { name: 'Nguyen Van A', username: 'nguyenvana' },
        },
      ])

      const req = new NextRequest('http://localhost/api/registrations')
      const response = await controller.getAll(req, 'test-user-id')
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.registrations[0].dateKey).toBe('2026-05-18')
      expect(body.registrations[0].status).toBe('eating')
    })
```

Append this test inside `describe('create', () => { ... })` after the missing-fields test:

```ts
    it('returns dateKey for created registrations', async () => {
      const service = (controller as unknown as { registrationService: { create: ReturnType<typeof vi.fn> } }).registrationService
      service.create = vi.fn().mockResolvedValue({
        id: 'reg-2',
        userId: 'test-user-id',
        date: new Date('2026-05-18T00:00:00.000Z'),
        status: 'eating',
        note: null,
        createdAt: new Date('2026-05-15T00:00:00.000Z'),
        updatedAt: new Date('2026-05-15T00:00:00.000Z'),
      })
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-05-18', status: 'eating' }),
      })

      const response = await controller.create(req, 'test-user-id', new Date('2026-05-15T10:00:00+07:00'))
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.registration.dateKey).toBe('2026-05-18')
      expect(body.registration.status).toBe('eating')
    })
```

- [ ] **Step 2: Run controller tests to verify failure**

Run: `npm test -- tests/controllers/RegistrationsController.test.ts --run`

Expected: FAIL because `body.registrations[0].dateKey` and `body.registration.dateKey` are `undefined`.

- [ ] **Step 3: Implement response mapper**

In `src/controllers/RegistrationsController.ts`, add import:

```ts
import { toDateKey } from '@/lib/registrationWindow'
```

Add this private method inside `RegistrationsController` before `async getAll`:

```ts
  private withDateKey<T extends { date: Date }>(registration: T): T & { dateKey: string } {
    return {
      ...registration,
      dateKey: toDateKey(registration.date),
    }
  }
```

Replace `getAll()` response body:

```ts
    const registrations = await this.registrationService.findAll(userId, startDate || undefined, endDate || undefined)
    return NextResponse.json({ registrations: registrations.map((registration) => this.withDateKey(registration)) })
```

Replace successful `create()` response body:

```ts
      const registration = await this.registrationService.create(userId, body, now)
      return NextResponse.json({ registration: this.withDateKey(registration) }, { status: 201 })
```

- [ ] **Step 4: Run controller tests to verify pass**

Run: `npm test -- tests/controllers/RegistrationsController.test.ts --run`

Expected: PASS all controller tests.

- [ ] **Step 5: Commit API response changes**

```bash
git add src/controllers/RegistrationsController.ts tests/controllers/RegistrationsController.test.ts
git commit -m "feat: add registration date keys to API responses"
```

## Task 2: Hook Matches And Updates By DateKey

**Files:**
- Modify: `tests/hooks/useRegistrations.test.ts`
- Modify: `src/hooks/useRegistrations.ts`

- [ ] **Step 1: Add failing hook tests**

Append these tests inside `describe('useRegistrations', () => { ... })` after `getStatusForDate returns status for matching date`:

```ts
  it('prefers registration dateKey when matching status', async () => {
    const mockRegistrations = [
      { id: '1', date: '2026-05-17T17:00:00.000Z', dateKey: '2026-05-18', status: 'eating' },
    ]
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: mockRegistrations })

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.getStatusForDate('2026-05-18')).toBe('eating')
  })
```

Append this test after `saves explicit not-eating status for a date`:

```ts
  it('updates local status from successful save response before refetch completes', async () => {
    let resolveRefetch: (value: { registrations: Array<{ id: string; date: string; dateKey: string; status: string }> }) => void = () => {}
    vi.mocked(registrationsApi.getAll)
      .mockResolvedValueOnce({ registrations: [{ id: 'reg-1', date: '2026-05-18T00:00:00.000Z', dateKey: '2026-05-18', status: 'not_eating' }] })
      .mockReturnValueOnce(new Promise((resolve) => {
        resolveRefetch = resolve
      }))
    vi.mocked(registrationsApi.create).mockResolvedValue({
      registration: { id: 'reg-1', date: '2026-05-18T00:00:00.000Z', dateKey: '2026-05-18', status: 'eating' },
    })

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.getStatusForDate('2026-05-18')).toBe('not-eating')
    })

    const savePromise = result.current.setStatus('2026-05-18', 'eating')

    await waitFor(() => {
      expect(result.current.getStatusForDate('2026-05-18')).toBe('eating')
    })

    resolveRefetch({ registrations: [{ id: 'reg-1', date: '2026-05-18T00:00:00.000Z', dateKey: '2026-05-18', status: 'eating' }] })
    await expect(savePromise).resolves.toBe(true)
  })
```

- [ ] **Step 2: Run hook tests to verify failure**

Run: `npm test -- tests/hooks/useRegistrations.test.ts --run`

Expected: FAIL because `getStatusForDate()` still derives date from ISO `date`, and `setStatus()` does not upsert returned registration before awaiting refetch.

- [ ] **Step 3: Implement hook dateKey matching and local upsert**

In `src/hooks/useRegistrations.ts`, replace `Registration` interface with:

```ts
interface Registration {
  id: string
  date: string
  dateKey?: string
  status: string
  note?: string
}
```

Add helper above `export function useRegistrations`:

```ts
function getRegistrationDateKey(registration: Registration): string {
  if (registration.dateKey) return registration.dateKey
  return new Date(registration.date).toISOString().split('T')[0]
}
```

In `setStatus`, replace create/refetch block:

```ts
    try {
      const response = await registrationsApi.create(date, apiStatus)
      const registration = response.registration as Registration | undefined

      if (registration) {
        setRegistrations((current) => {
          const next = current.filter((item) => getRegistrationDateKey(item) !== getRegistrationDateKey(registration))
          return [...next, registration]
        })
      }

      await fetchRegistrations()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update registration')
      return false
    }
```

In `getStatusForDate`, replace the date comparison with:

```ts
    const reg = registrations.find(r => getRegistrationDateKey(r) === dateStr)
```

- [ ] **Step 4: Run hook tests to verify pass**

Run: `npm test -- tests/hooks/useRegistrations.test.ts --run`

Expected: PASS all hook tests.

- [ ] **Step 5: Commit hook sync changes**

```bash
git add src/hooks/useRegistrations.ts tests/hooks/useRegistrations.test.ts
git commit -m "fix: sync registration status by date key"
```

## Task 3: Page Regression And Final Verification

**Files:**
- Modify: `app/(employee)/book/page.test.tsx`
- Verify: changed files and existing booking tests

- [ ] **Step 1: Add page regression test**

In `app/(employee)/book/page.test.tsx`, replace the hook mock at the top with stateful mock data:

```tsx
const setStatus = vi.fn(async (dateKey: string, status: 'eating' | 'not-eating') => {
  mockStatuses[dateKey] = status
  return true
})
let mockStatuses: Record<string, 'eating' | 'not-eating'> = {}

vi.mock('@/hooks/useRegistrations', () => ({
  useRegistrations: () => ({
    loading: false,
    error: null,
    setStatus,
    getStatusForDate: (dateKey: string) => mockStatuses[dateKey] || null,
  }),
}))
```

In `beforeEach`, replace `setStatus.mockResolvedValue(true)` with:

```tsx
    mockStatuses = { '2026-05-12': 'not-eating' }
```

Append this test inside `describe('BookPage weekly cards', () => { ... })`:

```tsx
  it('shows updated status after changing next Monday from not eating to eating', async () => {
    vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))
    mockStatuses = { '2026-05-18': 'not-eating' }

    const { rerender } = render(<BookPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Tuần sau →' }))
    const monday = screen.getByTestId('book-day-2026-05-18')
    fireEvent.click(within(monday).getByRole('button', { name: 'Có ăn' }))

    await waitFor(() => {
      expect(setStatus).toHaveBeenCalledWith('2026-05-18', 'eating')
    })

    rerender(<BookPage />)
    expect(within(screen.getByTestId('book-day-2026-05-18')).getByRole('button', { name: 'Có ăn' })).toBeDisabled()
    expect(within(screen.getByTestId('book-day-2026-05-18')).getByRole('button', { name: 'Không ăn' })).not.toBeDisabled()
  })
```

Also update import line to include `waitFor`:

```tsx
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
```

- [ ] **Step 2: Run page tests**

Run: `npm test -- "app/(employee)/book/page.test.tsx" --run`

Expected: PASS all page tests after Task 2; if this fails because the mock is not stateful, use exactly the stateful mock from Step 1.

- [ ] **Step 3: Run targeted verification**

Run:

```bash
npm test -- tests/controllers/RegistrationsController.test.ts tests/hooks/useRegistrations.test.ts "app/(employee)/book/page.test.tsx" tests/services/RegistrationService.test.ts tests/lib/registrationWindow.test.ts --run
```

Expected: PASS all targeted tests.

- [ ] **Step 4: Run full tests**

Run: `npm test -- --run`

Expected: PASS all Vitest tests.

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: PASS Next.js build.

- [ ] **Step 6: Run lint and record existing failures**

Run: `npm run lint`

Expected: May FAIL from known existing lint debt. Confirm no new lint errors in changed files: `src/controllers/RegistrationsController.ts`, `tests/controllers/RegistrationsController.test.ts`, `src/hooks/useRegistrations.ts`, `tests/hooks/useRegistrations.test.ts`, `app/(employee)/book/page.test.tsx`.

- [ ] **Step 7: Commit regression test and verification fixes**

```bash
git add "app/(employee)/book/page.test.tsx" src/controllers/RegistrationsController.ts tests/controllers/RegistrationsController.test.ts src/hooks/useRegistrations.ts tests/hooks/useRegistrations.test.ts
git commit -m "test: cover book status sync after save"
```

If Step 7 has no staged changes because prior tasks already committed everything and the page test was unnecessary, do not create an empty commit.

## Self-Review

Spec coverage:

- API response includes `dateKey`: Task 1.
- Hook primary matching by `dateKey`: Task 2.
- Hook local update from successful POST before refetch: Task 2.
- `/book` keeps using `day.dateKey`: Task 3 verifies page behavior without page implementation changes.
- Backend validation remains authoritative: Task 3 targeted tests include existing service/window tests.
- No DB schema changes: no task changes Prisma schema.

Placeholder scan:

- No `TBD`, `TODO`, or open-ended implementation steps.
- Code snippets define exact test and implementation changes.

Type consistency:

- API status remains `eating | not_eating`.
- UI status remains `eating | not-eating`.
- `dateKey` is always string `YYYY-MM-DD`.
