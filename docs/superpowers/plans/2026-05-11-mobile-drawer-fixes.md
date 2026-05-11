# Mobile Drawer & Responsive Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix mobile drawer issues - body scroll lock, hamburger icon toggle, overlay animation, sidebar visibility on close, and integrate MobileDrawer component.

**Architecture:**
- Create a unified `MobileSidebar` component that handles both employee and admin mobile drawer behavior
- Integrate body scroll lock into layouts
- Fix hamburger icon toggle (menu ↔ close)
- Add overlay opacity transition
- Fix sidebar visibility when drawer closes
- Remove dead code (MobileDrawer.tsx if after integration it's unused)

**Tech Stack:** Next.js App Router, React, Tailwind CSS, TypeScript

---

## File Structure

| File | Responsibility |
|------|----------------|
| `app/components/sidebar/MobileSidebar.tsx` | NEW - Unified mobile drawer component with scroll lock, overlay animation, hamburger icon toggle |
| `app/(employee)/layout.tsx` | Uses MobileSidebar, passes EmployeeSidebar content |
| `app/admin/layout.tsx` | Uses MobileSidebar, passes AdminSidebar content |
| `app/components/sidebar/MobileDrawer.tsx` | DELETE after integration |
| `app/admin/dashboard/page.tsx` | Fix stats grid responsive: `grid-cols-1 sm:grid-cols-3` |
| `app/admin/employees/page.tsx` | Fix table responsive: add `overflow-x-auto` |
| `app/admin/reports/page.tsx` | Fix buttons responsive: `grid-cols-1 sm:grid-cols-3` |
| `app/(employee)/dashboard/page.tsx` | Fix stats responsive and image height |
| `app/(employee)/book/page.tsx` | Fix week strip grid responsive |
| `app/(employee)/my-history/page.tsx` | Fix table and filters responsive |

---

## Task 1: Create MobileSidebar Component

**Files:**
- Create: `app/components/sidebar/MobileSidebar.tsx`

### Steps:

- [ ] **Step 1: Create MobileSidebar.tsx with full implementation**

```tsx
"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface Props {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  hamburgerRef?: React.RefObject<HTMLButtonElement>
}

export function MobileSidebar({ isOpen, onClose, children, hamburgerRef }: Props) {
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      setIsAnimating(true)
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Overlay with opacity transition */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      {/* Drawer with slide transition */}
      <div
        className={`fixed left-0 top-0 h-full w-[260px] bg-surface-container-lowest z-[65] shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        {/* Close button in drawer - 44px touch target */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container-low active:bg-surface-container-high"
          aria-label="Close drawer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Content */}
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/sidebar/MobileSidebar.tsx
git commit -m "feat: add MobileSidebar component with scroll lock and animations"
```

---

## Task 2: Update Employee Layout

**Files:**
- Modify: `app/(employee)/layout.tsx`

### Steps:

- [ ] **Step 1: Replace inline drawer with MobileSidebar component**

```tsx
"use client"

import { useState, useRef } from "react"
import { EmployeeSidebar } from "../components/sidebar/EmployeeSidebar"
import { MobileSidebar } from "../components/sidebar/MobileSidebar"

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const mockUser = {
    username: "hungpx",
    fullName: "Phạm Xuân Hùng",
  }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <EmployeeSidebar
          username={mockUser.username}
          fullName={mockUser.fullName}
        />
      </div>

      {/* Mobile Sidebar with scroll lock and animations */}
      <MobileSidebar
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hamburgerRef={hamburgerRef}
      >
        <EmployeeSidebar
          username={mockUser.username}
          fullName={mockUser.fullName}
        />
      </MobileSidebar>

      {/* Hamburger button - changes icon based on state */}
      <button
        ref={hamburgerRef}
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className={`md:hidden fixed top-4 left-4 z-[55] w-11 h-11 rounded-xl bg-surface-container-low shadow-md border border-hairline flex items-center justify-center transition-all duration-200 ${
          isDrawerOpen ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{ pointerEvents: isDrawerOpen ? 'none' : 'auto' }}
        aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
      >
        <span className="material-symbols-outlined">
          {isDrawerOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Main Content - offset for desktop sidebar */}
      <main className="md:ml-[260px] min-h-dvh">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(employee\)/layout.tsx
git commit -m "refactor: use MobileSidebar component in employee layout"
```

---

## Task 3: Update Admin Layout

**Files:**
- Modify: `app/admin/layout.tsx`

### Steps:

- [ ] **Step 1: Replace inline drawer with MobileSidebar component**

```tsx
"use client"

import { useState, useRef } from "react"
import { AdminSidebar } from "../components/sidebar/AdminSidebar"
import { MobileSidebar } from "../components/sidebar/MobileSidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const mockAdmin = {
    username: "admin",
    name: "Admin",
  }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <AdminSidebar adminName={mockAdmin.name} />
      </div>

      {/* Mobile Sidebar with scroll lock and animations */}
      <MobileSidebar
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hamburgerRef={hamburgerRef}
      >
        <AdminSidebar adminName={mockAdmin.name} />
      </MobileSidebar>

      {/* Hamburger button - changes icon based on state */}
      <button
        ref={hamburgerRef}
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className={`md:hidden fixed top-4 left-4 z-[55] w-11 h-11 rounded-xl bg-surface-container-low shadow-md border border-hairline flex items-center justify-center transition-all duration-200 ${
          isDrawerOpen ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{ pointerEvents: isDrawerOpen ? 'none' : 'auto' }}
        aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
      >
        <span className="material-symbols-outlined">
          {isDrawerOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Main Content - offset for desktop sidebar */}
      <main className="md:ml-[260px] min-h-dvh">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "refactor: use MobileSidebar component in admin layout"
```

---

## Task 4: Fix Admin Dashboard Responsive

**Files:**
- Modify: `app/admin/dashboard/page.tsx`

### Steps:

- [ ] **Step 1: Read current file to find stats grid**

- [ ] **Step 2: Change stats grid from `grid-cols-3` to `grid-cols-1 sm:grid-cols-3`**

Find the stats cards grid and update the class:
```tsx
// Change from:
className="grid grid-cols-3 gap-4"
// To:
className="grid grid-cols-1 sm:grid-cols-3 gap-4"
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/dashboard/page.tsx
git commit -m "fix: add responsive breakpoint for stats grid on mobile"
```

---

## Task 5: Fix Admin Employees Table Responsive

**Files:**
- Modify: `app/admin/employees/page.tsx`

### Steps:

- [ ] **Step 1: Read current file to find table wrapper**

- [ ] **Step 2: Add `overflow-x-auto` to table wrapper div**

Find the table container and update:
```tsx
// Wrap the table with a div that has overflow-x-auto
<div className="overflow-x-auto">
  <table>...</table>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/employees/page.tsx
git commit -m "fix: add horizontal scroll for table on mobile"
```

---

## Task 6: Fix Admin Reports Responsive

**Files:**
- Modify: `app/admin/reports/page.tsx`

### Steps:

- [ ] **Step 1: Read current file to find report type buttons grid**

- [ ] **Step 2: Change buttons grid from `grid-cols-3` to `grid-cols-1 sm:grid-cols-3`**

Find the button container and update:
```tsx
// Change from:
className="grid grid-cols-3 gap-3"
// To:
className="grid grid-cols-1 sm:grid-cols-3 gap-3"
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/reports/page.tsx
git commit -m "fix: add responsive breakpoint for report type buttons on mobile"
```

---

## Task 7: Fix Employee Dashboard Responsive

**Files:**
- Modify: `app/(employee)/dashboard/page.tsx`

### Steps:

- [ ] **Step 1: Read current file to find stats cards grid**

- [ ] **Step 2: Change stats grid to be responsive**

Find the stats cards grid and update:
```tsx
// Change from:
className="grid grid-cols-2"
// To:
className="grid grid-cols-1 sm:grid-cols-2"
```

- [ ] **Step 3: Also make main dish image height responsive**

```tsx
// Change from:
className="h-56 w-full object-cover rounded-xl"
// To:
className="h-40 sm:h-56 w-full object-cover rounded-xl"
```

- [ ] **Step 4: Commit**

```bash
git add app/\(employee\)/dashboard/page.tsx
git commit -m "fix: add responsive breakpoints for dashboard stats and images"
```

---

## Task 8: Fix Employee Book Page Responsive

**Files:**
- Modify: `app/(employee)/book/page.tsx`

### Steps:

- [ ] **Step 1: Read current file to find week strip grid**

- [ ] **Step 2: Change week strip grid to be more mobile-friendly**

Find the week days grid and update:
```tsx
// Change from:
className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"
// To:
className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7"
// Or if 7 days, consider scrolling container instead
```

- [ ] **Step 3: Fix toast position for mobile**

Find the toast component and ensure it doesn't overlap with hamburger:
```tsx
// Add left padding on mobile to account for hamburger
className="top-6 left-4 right-4 sm:left-auto sm:right-6"
```

- [ ] **Step 4: Commit**

```bash
git add app/\(employee\)/book/page.tsx
git commit -m "fix: add responsive breakpoints for book page week strip"
```

---

## Task 9: Fix Employee My History Responsive

**Files:**
- Modify: `app/(employee)/my-history/page.tsx`

### Steps:

- [ ] **Step 1: Read current file to find stats row and table**

- [ ] **Step 2: Change stats grid from `grid-cols-3` to responsive**

```tsx
// Change from:
className="grid grid-cols-3"
// To:
className="grid grid-cols-1 sm:grid-cols-3"
```

- [ ] **Step 3: Add horizontal scroll to table wrapper**

```tsx
// Wrap table container with overflow-x-auto
<div className="overflow-x-auto">
  <table>...</table>
</div>
```

- [ ] **Step 4: Make filter container scrollable on mobile**

```tsx
// Add overflow-x-auto to filter container
<div className="flex items-center gap-3 overflow-x-auto py-2">
```

- [ ] **Step 5: Commit**

```bash
git add app/\(employee\)/my-history/page.tsx
git commit -m "fix: add responsive breakpoints and horizontal scroll for my-history page"
```

---

## Task 10: Delete Dead Code (Optional)

**Files:**
- Delete: `app/components/sidebar/MobileDrawer.tsx`

### Steps:

- [ ] **Step 1: Verify MobileDrawer is no longer imported anywhere**

Run: `grep -r "MobileDrawer" app/`
Expected: No imports found

- [ ] **Step 2: Delete the file**

```bash
rm app/components/sidebar/MobileDrawer.tsx
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove unused MobileDrawer component"
```

---

## Task 11: Update Sidebar Index Exports

**Files:**
- Modify: `app/components/sidebar/index.ts`

### Steps:

- [ ] **Step 1: Update exports to include MobileSidebar**

```ts
export { EmployeeSidebar } from "./EmployeeSidebar"
export { AdminSidebar } from "./AdminSidebar"
export { MobileSidebar } from "./MobileSidebar"
```

- [ ] **Step 2: Commit**

```bash
git add app/components/sidebar/index.ts
git commit -m "chore: export MobileSidebar from sidebar index"
```

---

## Self-Review Checklist

- [ ] All 10 tasks have complete code blocks
- [ ] All file paths are exact
- [ ] All commands include expected output
- [ ] No "TODO", "TBD", or placeholder content
- [ ] Type consistency verified (Props interfaces match usage)
- [ ] Mobile scroll lock implemented in MobileSidebar
- [ ] Hamburger icon toggles between menu/close
- [ ] Overlay has opacity transition
- [ ] Sidebar visibility fixed with proper pointerEvents
- [ ] All responsive breakpoints added to pages
- [ ] All tables have overflow-x-auto

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-05-11-mobile-drawer-fixes.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**