# Admin Dashboard Default Date Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khi admin vào dashboard, mặc định hiển thị stats cho ngày bị khóa (locked) tiếp theo thay vì hôm nay.

**Architecture:** Thêm helper function `getNextLockedDay()` trong `registrationWindow.ts` để tìm ngày bị khóa tiếp theo trong tuần hiện tại. Dashboard sẽ dùng function này để set default date thay vì hardcode `new Date()`.

**Tech Stack:** Next.js, TypeScript, React

---

## File Structure

- **Modify:** `src/lib/registrationWindow.ts` - thêm helper function
- **Modify:** `app/admin/dashboard/page.tsx` - đổi initial state

---

## Task 1: Add getNextLockedDay() to registrationWindow.ts

**Files:**
- Modify: `src/lib/registrationWindow.ts` - thêm function mới

- [ ] **Step 1: Thêm getNextLockedDay() vào file**

Mở `src/lib/registrationWindow.ts`, tìm đến dòng cuối cùng của file (sau function `getCurrentWeekFutureWeekdays`) và thêm:

```typescript
/**
 * Returns the next date (from today) that is locked due to cutoff having passed.
 * Returns null if no such date found within booking window.
 */
export function getNextLockedDay(now: Date): RegistrationDayState | null {
  const weekdays = getCurrentWeekFutureWeekdays(now)
  return weekdays.find(day => day.locked) ?? null
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit src/lib/registrationWindow.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/registrationWindow.ts
git commit -m "feat: add getNextLockedDay helper for dashboard default date"
```

---

## Task 2: Update Dashboard Default Date

**Files:**
- Modify: `app/admin/dashboard/page.tsx:19` - thay đổi initial state

- [ ] **Step 1: Thay đổi initial state của selectedDate**

Trong `app/admin/dashboard/page.tsx`, dòng 19:

**Before:**
```typescript
const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
```

**After:**
```typescript
const [selectedDate, setSelectedDate] = useState(() => {
  const nextLocked = getNextLockedDay(new Date())
  return nextLocked ? nextLocked.dateKey : toDateKey(new Date())
})
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit app/admin/dashboard/page.tsx`
Expected: No errors

- [ ] **Step 3: Test manually**

Start dev server: `npm run dev`
Navigate to `/admin/dashboard` on a Thursday → verify default date shows Friday

- [ ] **Step 4: Commit**

```bash
git add app/admin/dashboard/page.tsx
git commit -m "feat: dashboard defaults to next locked day instead of today"
```

---

## Verification Checklist

- [ ] Function `getNextLockedDay()` returns `null` when no day is locked
- [ ] Function `getNextLockedDay()` returns correct locked day on Thursday (Friday)
- [ ] Dashboard defaults to locked day when available
- [ ] Dashboard defaults to today when no day is locked
- [ ] TypeScript compiles without errors
- [ ] Existing tests still pass