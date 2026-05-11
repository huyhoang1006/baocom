# Mobile UI/UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical mobile UI/UX issues across all routes - primarily touch target sizes, table responsiveness, and layout improvements.

**Architecture:** Focus on high-impact, minimal-change fixes. Add responsive utility classes where needed, modify existing components to have proper touch targets (44x44px minimum per WCAG), and ensure tables have horizontal scroll on mobile.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, TypeScript

---

## File Structure

| File | Issues to Fix |
|------|---------------|
| `app/admin/employees/page.tsx` | Touch targets (checkboxes, buttons), table overflow |
| `app/admin/dashboard/page.tsx` | Stat cards, pagination buttons, table overflow |
| `app/(employee)/book/page.tsx` | Day button spacing, "Hôm nay" badge |
| `app/(employee)/my-history/page.tsx` | Filter buttons sizing |
| `app/admin/reports/page.tsx` | Report type buttons stacked |
| `app/globals.css` | Add mobile utility classes if needed |

---

## Task 1: Fix Admin Employees Table - Touch Targets & Overflow

**Files:**
- Modify: `app/admin/employees/page.tsx`

### Steps:

- [ ] **Step 1: Read current page to understand table structure**

- [ ] **Step 2: Wrap table in horizontal scroll container**

Find the table and wrap it:
```tsx
<div className="overflow-x-auto">
  <table>...</table>
</div>
```

- [ ] **Step 3: Increase checkbox size**

Change checkbox container from minimal size to 44x44px tap target:
```tsx
// Change inline styles or add wrapper div with padding
<div className="w-11 h-11 flex items-center justify-center">
  <input type="checkbox" ... />
</div>
```

- [ ] **Step 4: Increase edit/delete button sizes**

Change from 36x42px to at least 44x44px:
```tsx
// In action column buttons
<button className="w-11 h-11 ..." // instead of w-9 h-10
```

- [ ] **Step 5: Add gap between edit/delete buttons**

Ensure 8px gap minimum between action buttons.

- [ ] **Step 6: Commit**

```bash
git add app/admin/employees/page.tsx
git commit -m "fix: increase touch targets and add horizontal scroll for mobile table"
```

---

## Task 2: Fix Admin Dashboard - Stats & Pagination

**Files:**
- Modify: `app/admin/dashboard/page.tsx`

### Steps:

- [ ] **Step 1: Read current page to find stats section**

- [ ] **Step 2: Make stat cards responsive (2-column grid on mobile)**

Change stats grid from full-width stacked to 2-column:
```tsx
// Change from grid-cols-1 (or whatever) to:
className="grid grid-cols-1 sm:grid-cols-3 gap-4"
// Or for mobile-first:
className="grid grid-cols-2 sm:grid-cols-3 gap-3"
```

- [ ] **Step 3: Increase pagination button size**

Change pagination buttons to at least 36x36px:
```tsx
<button className="min-w-9 min-h-9 ..." // instead of w-7 h-7
```

- [ ] **Step 4: Add horizontal scroll to table wrapper**

Same pattern as Task 1 - wrap table in `overflow-x-auto`.

- [ ] **Step 5: Commit**

```bash
git add app/admin/dashboard/page.tsx
git commit -m "fix: responsive stat cards and larger pagination buttons for mobile"
```

---

## Task 3: Fix Employee Book Page - Day Buttons

**Files:**
- Modify: `app/(employee)/book/page.tsx`

### Steps:

- [ ] **Step 1: Read current page to find day buttons**

- [ ] **Step 2: Fix "Hôm nay" badge position**

Adjust the "Hôm nay" badge positioning - ensure it's within button bounds:
```tsx
// If using absolute positioning, adjust top value
className="absolute -top-1 right-1" // instead of causing overflow
```

- [ ] **Step 3: Increase day button height or reduce content**

Option A: Increase button height:
```tsx
className="h-24 sm:h-20" // taller on mobile
```

Option B: Reduce text lines:
```tsx
// Show "T5" on mobile, full "Thứ 5" on desktop
className="text-base sm:text-lg"
```

- [ ] **Step 4: Add section gap**

Increase gap between sections from 24px to 32-40px:
```tsx
className="mt-8 sm:mt-6" // increased from mt-6
```

- [ ] **Step 5: Center update button**

Use flexbox centering instead of fixed position:
```tsx
className="flex justify-center mt-6"
```

- [ ] **Step 6: Commit**

```bash
git add app/\(employee\)/book/page.tsx
git commit -m "fix: improve day button layout and section spacing for mobile"
```

---

## Task 4: Fix Employee My History - Filter Buttons

**Files:**
- Modify: `app/(employee)/my-history/page.tsx`

### Steps:

- [ ] **Step 1: Read current page to find filter buttons**

- [ ] **Step 2: Equalize filter button widths**

Make all filter buttons same minimum width:
```tsx
className="min-w-[80px] px-3 py-2" // uniform sizing
```

- [ ] **Step 3: Increase empty state icon size**

Increase empty state icon from 24px to 48px:
```tsx
className="w-12 h-12" // instead of w-6 h-6
```

- [ ] **Step 4: Center empty state content**

```tsx
className="flex flex-col items-center justify-center"
```

- [ ] **Step 5: Commit**

```bash
git add app/\(employee\)/my-history/page.tsx
git commit -m "fix: equalize filter button widths and increase empty state icon for mobile"
```

---

## Task 5: Fix Admin Reports - Report Type Buttons

**Files:**
- Modify: `app/admin/reports/page.tsx`

### Steps:

- [ ] **Step 1: Read current page to find report type buttons**

- [ ] **Step 2: Change stacked buttons to segmented control on mobile**

Replace 3 full-width stacked buttons with tab/segment style:
```tsx
// On mobile: horizontal tabs
<div className="flex overflow-x-auto border-b border-hairline">
  <button className="flex-shrink-0 px-4 py-3 border-b-2 border-primary">...</button>
  <button className="flex-shrink-0 px-4 py-3">...</button>
  <button className="flex-shrink-0 px-4 py-3">...</button>
</div>
```

Or reduce button height:
```tsx
className="h-12 text-sm" // instead of h-[68px]
```

- [ ] **Step 3: Fix date placeholder locale**

```tsx
<input placeholder="dd/mm/yyyy" ... />
```

- [ ] **Step 4: Center preview button**

```tsx
className="w-full max-w-xs mx-auto" // or full width on mobile
```

- [ ] **Step 5: Commit**

```bash
git add app/admin/reports/page.tsx
git commit -m "fix: segmented report type buttons and locale date placeholder for mobile"
```

---

## Self-Review Checklist

- [ ] Task 1: Table has overflow-x-auto, checkboxes 44x44px, buttons 44x44px
- [ ] Task 2: Stats use grid-cols-2 on mobile, pagination 36x36px+
- [ ] Task 3: "Hôm nay" badge within button bounds, button height adequate
- [ ] Task 4: Filter buttons equal width, empty state icon 48px
- [ ] Task 5: Report buttons use horizontal tabs or reduced height
- [ ] All touch targets minimum 44x44px on mobile
- [ ] No horizontal overflow on 375px viewport

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-05-11-mobile-ui-fixes.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**