# Mobile Sidebar Fixes - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 2 mobile sidebar issues: (1) close button unclickable due to content overlay, (2) sidebar doesn't auto-close on navigation

**Architecture:**
- Task 1: Add padding-top to content div in MobileSidebar so close button isn't covered
- Task 2: Add usePathname hook in layout to auto-close drawer on route change

**Tech Stack:** Next.js App Router, React, Tailwind CSS

---

## File Structure

| File | Responsibility |
|------|----------------|
| `app/components/sidebar/MobileSidebar.tsx` | Add pt-16 to content div to prevent close button coverage |
| `app/(employee)/layout.tsx` | Add usePathname to auto-close drawer on navigation |

---

## Task 1: Fix Close Button Coverage in MobileSidebar

**Files:**
- Modify: `app/components/sidebar/MobileSidebar.tsx:109`

### Steps:

- [ ] **Step 1: Read current MobileSidebar.tsx**

Confirm current structure around line 109 content div.

- [ ] **Step 2: Add pt-16 to content div**

Change line 109 from:
```tsx
<div className="h-full overflow-y-auto">
```
To:
```tsx
<div className="h-full overflow-y-auto pt-16">
```

This creates 64px padding at top so close button (absolute positioned at top-4 right-4) won't be covered by scrollable content.

- [ ] **Step 3: Commit**

```bash
git add app/components/sidebar/MobileSidebar.tsx
git commit -m "fix: add pt-16 to content div so close button isn't covered"
```

---

## Task 2: Auto-Close Sidebar on Navigation

**Files:**
- Modify: `app/(employee)/layout.tsx`

### Steps:

- [ ] **Step 1: Read current layout.tsx**

- [ ] **Step 2: Add usePathname import and useEffect**

Change the imports from:
```tsx
"use client"

import { useState } from "react"
```

To:
```tsx
"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
```

- [ ] **Step 3: Add pathname constant and useEffect to auto-close**

After `const [isDrawerOpen, setIsDrawerOpen] = useState(false)` add:

```tsx
const pathname = usePathname()

useEffect(() => {
  setIsDrawerOpen(false)
}, [pathname])
```

This effect runs when pathname changes (route navigation), automatically closing the drawer before new page renders.

- [ ] **Step 4: Commit**

```bash
git add app/\(employee\)/layout.tsx
git commit -m "fix: auto-close sidebar on route change"
```

---

## Self-Review Checklist

- [ ] Task 1: Content div has pt-16 class added
- [ ] Task 2: usePathname imported and used
- [ ] Task 2: useEffect dependency array includes pathname
- [ ] Both commits are atomic and descriptive

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-05-11-mobile-sidebar-fix.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**