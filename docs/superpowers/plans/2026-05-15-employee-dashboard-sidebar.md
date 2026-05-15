# Employee Dashboard Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Dashboard` option to the employee sidebar that links to `/dashboard` and appears before existing employee links.

**Architecture:** `EmployeeSidebar` owns a static `navItems` array and renders both desktop sidebar and mobile drawer content through the same component. The change is a small config update plus a focused React Testing Library test that verifies ordering, href, icon, active state, and existing links. No route, layout, auth, or admin sidebar changes are needed.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, React Testing Library, Material Symbols.

---

## File Structure

- Modify: `app/components/sidebar/EmployeeSidebar.tsx`
  - Responsibility: employee navigation UI and static employee nav item config.
  - Change: add `{ label: "Dashboard", href: "/dashboard", icon: "dashboard" }` as first item in `navItems`.
- Create: `app/components/sidebar/EmployeeSidebar.test.tsx`
  - Responsibility: focused unit tests for employee sidebar navigation behavior.
  - Coverage: dashboard item exists first, links to `/dashboard`, uses `dashboard` icon, active state applies on `/dashboard`, and existing employee links remain present.

## Task 1: Add Employee Sidebar Navigation Test

**Files:**
- Create: `app/components/sidebar/EmployeeSidebar.test.tsx`

- [ ] **Step 1: Write failing test**

Create `app/components/sidebar/EmployeeSidebar.test.tsx` with this full content:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { EmployeeSidebar } from './EmployeeSidebar'

const push = vi.fn()
let pathname = '/dashboard'

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({
    push,
  }),
}))

vi.mock('@/lib/api', () => ({
  authApi: {
    logout: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('EmployeeSidebar', () => {
  beforeEach(() => {
    pathname = '/dashboard'
    push.mockClear()
  })

  it('shows Dashboard first with correct link, icon, and active state', () => {
    render(<EmployeeSidebar username="hungpx" fullName="Pham Xuan Hung" />)

    const links = screen.getAllByRole('link')

    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAttribute('href', '/dashboard')
    expect(within(links[0]).getByText('Dashboard')).toBeInTheDocument()
    expect(within(links[0]).getByText('dashboard')).toBeInTheDocument()
    expect(links[0]).toHaveClass('bg-primary')
    expect(within(links[0]).getByText('chevron_right')).toBeInTheDocument()

    expect(links[1]).toHaveAttribute('href', '/book')
    expect(within(links[1]).getByText('Báo cơm')).toBeInTheDocument()

    expect(links[2]).toHaveAttribute('href', '/my-history')
    expect(within(links[2]).getByText('Lịch sử')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- app/components/sidebar/EmployeeSidebar.test.tsx
```

Expected: FAIL because only two links render and first link href is `/book`, not `/dashboard`.

- [ ] **Step 3: Commit failing test**

Run:

```bash
git add app/components/sidebar/EmployeeSidebar.test.tsx
git commit -m "test: cover employee dashboard sidebar link"
```

Expected: commit succeeds with only `app/components/sidebar/EmployeeSidebar.test.tsx` staged.

## Task 2: Add Dashboard Item To Employee Sidebar

**Files:**
- Modify: `app/components/sidebar/EmployeeSidebar.tsx:6-9`
- Test: `app/components/sidebar/EmployeeSidebar.test.tsx`

- [ ] **Step 1: Update navItems with Dashboard first**

Replace the current `navItems` block in `app/components/sidebar/EmployeeSidebar.tsx`:

```tsx
const navItems = [
  { label: "Báo cơm", href: "/book", icon: "restaurant" },
  { label: "Lịch sử", href: "/my-history", icon: "history" },
]
```

with:

```tsx
const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Báo cơm", href: "/book", icon: "restaurant" },
  { label: "Lịch sử", href: "/my-history", icon: "history" },
]
```

- [ ] **Step 2: Run focused test to verify it passes**

Run:

```bash
npm test -- app/components/sidebar/EmployeeSidebar.test.tsx
```

Expected: PASS for `shows Dashboard first with correct link, icon, and active state`.

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS for all Vitest tests. If unrelated existing tests fail, record exact failing test names and errors before continuing.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: Next.js build completes successfully with no TypeScript or route errors.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add app/components/sidebar/EmployeeSidebar.tsx app/components/sidebar/EmployeeSidebar.test.tsx
git commit -m "feat: add employee dashboard sidebar link"
```

Expected: commit succeeds with sidebar implementation and test only.

## Task 3: Close Issue And Push Work

**Files:**
- Modify: `.beads/issues.jsonl` through `bd close`

- [ ] **Step 1: Close beads issue**

Run:

```bash
bd close baocom-0otj --reason="Implemented employee Dashboard sidebar item plan and code path."
```

Expected: issue `baocom-0otj` is closed.

- [ ] **Step 2: Review git status**

Run:

```bash
git status --short
```

Expected: only intended files for this work are changed or staged. Existing unrelated workspace changes may remain; do not modify or revert them.

- [ ] **Step 3: Commit beads metadata if generated**

If `git status --short` shows `.beads/issues.jsonl` modified because `bd close` updated the issue, run:

```bash
git add .beads/issues.jsonl
git commit -m "docs: close employee sidebar planning issue"
```

Expected: commit succeeds with `.beads/issues.jsonl` only. If `.beads/issues.jsonl` contains unrelated pre-existing staged changes, stop and ask for guidance before committing beads metadata.

- [ ] **Step 4: Pull and push**

Run:

```bash
git pull --rebase
git push
git status
```

Expected: push succeeds and `git status` says branch is up to date with origin. If rebase conflicts with unrelated local changes, stop and ask for guidance.

## Self-Review

- Spec coverage: Task 2 adds `Dashboard` first, href `/dashboard`, icon `dashboard`, preserves existing links, and relies on shared `EmployeeSidebar` for desktop and mobile. Task 1 verifies active state and existing links. Task 3 handles beads close and push workflow.
- Placeholder scan: no placeholders, deferred implementation notes, or vague test steps remain.
- Type consistency: test imports `EmployeeSidebar`, uses existing props `username` and `fullName`, mocks existing `next/navigation` hooks and `authApi.logout`, and matches existing `navItems` property names `label`, `href`, and `icon`.
