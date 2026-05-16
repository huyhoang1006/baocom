# Testing Patterns

**Analysis Date:** 2026-05-16

## Test Framework

**Runner:**
- Vitest `^4.1.6` for unit/component tests, configured in `vitest.config.ts`.
- Playwright `^1.60.0` for E2E/API flows under `tests/e2e/`.
- Vitest excludes `**/tests/e2e/**`, so Playwright specs are separate from `npm test`.

**Assertion Library:**
- Vitest `expect` for unit/component tests.
- `@testing-library/jest-dom` loaded from `vitest.setup.ts` for DOM matchers like `toBeInTheDocument`, `toBeDisabled`, `toHaveClass`.
- Playwright `expect` from `@playwright/test` for browser/API assertions.

**Run Commands:**
```bash
npm test              # Run Vitest tests
npm run lint          # Run ESLint
npx playwright test   # Run Playwright E2E/API tests
```

## Test File Organization

**Location:**
- Component/page tests are co-located beside implementation: `app/(auth)/login/page.test.tsx`, `app/(employee)/book/page.test.tsx`, `app/components/sidebar/EmployeeSidebar.test.tsx`.
- E2E/API specs live under `tests/e2e/`: `tests/e2e/auth-flows.spec.ts`, `tests/e2e/authorization.spec.ts`, `tests/e2e/security.spec.ts`.

**Naming:**
- Use `*.test.tsx` for Vitest React tests.
- Use `*.spec.ts` for Playwright specs.
- E2E test titles often include external test-case IDs, e.g. `TC-E2E-007`, `TC-SEC-AUTHZ-001` in `tests/e2e/auth-flows.spec.ts` and `tests/e2e/authorization.spec.ts`.

**Structure:**
```text
app/**/page.test.tsx                    # Co-located page/component unit tests
app/components/**/*.test.tsx            # Co-located component tests
tests/e2e/*.spec.ts                     # Playwright API/browser/security flows
vitest.config.ts                        # Unit/component test config
vitest.setup.ts                         # Shared Vitest setup
```

## Test Structure

**Suite Organization:**
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import BookPage from './page'

describe('BookPage weekly cards', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders Monday through Friday cards even when today is Friday', () => {
    render(<BookPage />)
    expect(screen.getByTestId('book-day-2026-05-11')).toBeInTheDocument()
  })
})
```

**Patterns:**
- Put imports at top, mocks before `describe`, setup in `beforeEach`, cleanup in `afterEach`.
- Use Testing Library user-facing queries (`getByRole`, `getByText`, `getByPlaceholderText`) when possible; use `data-testid` for repeated date cards in `app/(employee)/book/page.tsx`.
- Use `within(...)` for assertions scoped to cards/links, as in `app/(employee)/book/page.test.tsx` and `app/components/sidebar/EmployeeSidebar.test.tsx`.
- Use `vi.setSystemTime` for date-sensitive booking behavior in `app/(employee)/book/page.test.tsx`.

## Mocking

**Framework:** Vitest `vi`.

**Patterns:**
```typescript
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

```typescript
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push }),
}))
```

**What to Mock:**
- Mock Next.js navigation in component tests: `app/(auth)/login/page.test.tsx`, `app/components/sidebar/EmployeeSidebar.test.tsx`.
- Mock hooks/API clients when testing UI state rendering and event wiring: `@/hooks/useRegistrations` in `app/(employee)/book/page.test.tsx`, `@/lib/api` in `app/components/sidebar/EmployeeSidebar.test.tsx`.
- Mock time with fake timers for booking-window logic.

**What NOT to Mock:**
- Do not mock browser/API request behavior in Playwright specs; use `request`, `page`, and `browser` fixtures against real endpoints in `tests/e2e/*.spec.ts`.
- Do not mock DOM matchers; `vitest.setup.ts` loads `@testing-library/jest-dom` globally.

## Fixtures and Factories

**Test Data:**
```typescript
mockStatuses = { '2026-05-12': 'not-eating' }
vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))
```

```typescript
const loginResponse = await request.post('/api/auth/login', {
  data: { username: 'admin', password: 'admin123' },
})
const cookies = getCookieHeader(loginResponse.headers())
```

**Location:**
- No shared fixture/factory directory detected.
- Inline fixtures live in tests: user credentials and cookies in `tests/e2e/auth-flows.spec.ts` and `tests/e2e/authorization.spec.ts`; date/status fixtures in `app/(employee)/book/page.test.tsx`.
- E2E tests depend on seeded users such as `admin` and `nguyenvana`, documented inline in `tests/e2e/authorization.spec.ts`.

## Coverage

**Requirements:** None enforced in `vitest.config.ts`.

**View Coverage:**
```bash
npm test -- --coverage
```

## Test Types

**Unit Tests:**
- Co-located Vitest tests verify isolated page/component behavior with mocked dependencies.
- Examples: validation message in `app/(auth)/login/page.test.tsx`, sidebar links in `app/components/sidebar/EmployeeSidebar.test.tsx`, weekly booking card behavior in `app/(employee)/book/page.test.tsx`.

**Integration Tests:**
- Playwright API specs call Next.js API routes and assert status/body behavior: `tests/e2e/auth-flows.spec.ts`, `tests/e2e/authorization.spec.ts`, `tests/e2e/idor.spec.ts`, `tests/e2e/meals-holidays.spec.ts`, `tests/e2e/security.spec.ts`.
- Cookie helpers parse `set-cookie` headers for authenticated API calls in `tests/e2e/auth-flows.spec.ts` and `tests/e2e/authorization.spec.ts`.

**E2E Tests:**
- Playwright browser flows use `page` for login/navigation checks, e.g. admin dashboard quick actions in `tests/e2e/authorization.spec.ts`.
- Playwright API flows use `request` for auth, admin, registration, security, and CRUD endpoints.

## Common Patterns

**Async Testing:**
```typescript
fireEvent.click(within(monday).getByRole('button', { name: 'Có ăn' }))
expect(setStatus).toHaveBeenCalledWith('2026-05-18', 'eating')
await Promise.resolve()
rerender(<BookPage />)
```

```typescript
const response = await request.post('/api/auth/login', {
  data: { username: 'admin', password: 'admin123' },
})
expect(response.status()).toBe(200)
const body = await response.json()
expect(body.user.username).toBe('admin')
```

**Error Testing:**
```typescript
const response = await request.post('/api/auth/login', {
  data: { username: 'nonexistent', password: 'any' },
})
expect(response.status()).toBe(401)
const body = await response.json()
expect(body.error).toBe('Invalid credentials')
```

```typescript
fireEvent.change(passwordInput, { target: { value: '123' } })
fireEvent.click(submitButton)
expect(screen.getByText('Mật khẩu phải có ít nhất 4 ký tự')).toBeInTheDocument()
```

---

*Testing analysis: 2026-05-16*
