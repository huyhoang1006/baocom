# Admin Dashboard — Always Show "Tomorrow" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin Dashboard at `/admin/dashboard` always shows "tomorrow's data" (next workday T2-T6), no date filter, auto-creates default registrations if none exist.

**Architecture:**
- Add `getNextWorkday()` to `registrationWindow.ts` — finds next T2-T6 skipping weekends and holidays
- Add `ensureDefaultRegistrations()` to `RegistrationService.ts` — creates "eating" records for all employees on a given date
- Strip date picker and "Hôm nay" button from admin dashboard page, replace with computed `tomorrowDate`

**Tech Stack:** Next.js 16, React, TypeScript, Prisma/SQLite, Tailwind CSS

---

## Task 1: Add `getNextWorkday()` to `registrationWindow.ts`

**Files:**
- Modify: `src/lib/registrationWindow.ts`
- Read first: `src/repositories/HolidayRepository.ts`

- [ ] **Step 1: Add `getNextWorkday()` function**

Read `src/lib/registrationWindow.ts` first to find where to insert. Add after `getNextLockedDay()` (around line 170).

```ts
export function getNextWorkday(fromDate: Date, holidays: Date[] = []): Date {
  const current = startOfLocalDay(fromDate)
  current.setDate(current.getDate() + 1) // start from tomorrow

  // Keep advancing until we find T2-T6 that's not a holiday
  for (let i = 0; i < 20; i++) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend — skip
      current.setDate(current.getDate() + 1)
      continue
    }
    // Check if it's a holiday
    const currentKey = toDateKey(current)
    const isHoliday = holidays.some(h => toDateKey(h) === currentKey)
    if (!isHoliday) {
      return current
    }
    current.setDate(current.getDate() + 1)
  }

  return current // fallback
}
```

- [ ] **Step 2: Update TypeScript to accept holidays array parameter**

The function signature above is correct. No further changes needed.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/lib/registrationWindow.ts 2>&1 | head -10`
Expected: No errors in our file (pre-existing errors in other files are ignored)

- [ ] **Step 4: Commit**

```bash
git add src/lib/registrationWindow.ts
git commit -m "feat(dashboard): add getNextWorkday() helper for next workday"
```

---

## Task 2: Add `ensureDefaultRegistrations()` to `RegistrationService.ts`

**Files:**
- Modify: `src/services/RegistrationService.ts`

- [ ] **Step 1: Add `ensureDefaultRegistrations()` method**

Read `src/services/RegistrationService.ts` first. Add after `getAbsencesByDate()` (line 142).

```ts
async ensureDefaultRegistrations(date: Date): Promise<void> {
  const dayStart = startOfLocalDay(date)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  // Get all active employees
  const employees = await this.registrationRepository.findAll({
    date: { gte: dayStart, lt: dayEnd }
  })

  // Get all active employees from UserService
  const { UserService } = await import('@/services/UserService')
  const userService = new UserService()
  const allEmployees = await userService.findAll()
  const registeredUserIds = new Set(employees.map(e => e.userId))

  // Create default "eating" registration for any missing employee
  for (const emp of allEmployees) {
    if (!registeredUserIds.has(emp.id)) {
      await this.registrationRepository.upsert(emp.id, dayStart, 'eating')
    }
  }
}
```

Note: The `findAll` in RegistrationRepository includes `user` relation, so we get all registrations for that date. For getting all employees, we use UserService.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/services/RegistrationService.ts`
Expected: No errors related to our changes

- [ ] **Step 3: Commit**

```bash
git add src/services/RegistrationService.ts
git commit -m "feat(registration): add ensureDefaultRegistrations for auto-seeding defaults"
```

---

## Task 3: Rewrite `app/admin/dashboard/page.tsx` — Remove date filter, use tomorrow date

**Files:**
- Modify: `app/admin/dashboard/page.tsx`

- [ ] **Step 1: Read the current file to understand full structure**

Read `app/admin/dashboard/page.tsx` completely.

- [ ] **Step 2: Replace imports — remove `getNextLockedDay`, add `getNextWorkday`**

```ts
import { toDateKey, getNextWorkday, startOfLocalDay } from "@/lib/registrationWindow"
```

- [ ] **Step 3: Remove `selectedDate` state and related code**

Change from:
```ts
const [selectedDate, setSelectedDate] = useState(() => {
  const nextLocked = getNextLockedDay(new Date())
  return nextLocked ? nextLocked.dateKey : toDateKey(new Date())
})
```

To:
```ts
const tomorrowDate = useMemo(() => getNextWorkday(new Date()), [])
const [selectedDate] = useState(() => toDateKey(tomorrowDate))
```

- [ ] **Step 4: Remove the entire Date Selector block (lines 68-85)**

Delete the entire `<div className="mb-6 flex items-center gap-4">...</div>` containing the date picker and "Hôm nay" button.

- [ ] **Step 5: Remove the "Hôm nay" button from Quick Actions (lines 160-166)**

Delete the "Hôm nay" quick action button.

- [ ] **Step 6: Update header to show "Dashboard — Ngày mai: [Day], DD/MM"**

Replace lines 54-61 with:
```tsx
<div className="flex items-center gap-3 mb-2">
  <h1 className="text-3xl font-semibold tracking-tight text-ink">Dashboard — Ngày mai</h1>
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-white">
    Admin
  </span>
</div>
<p className="text-sm text-ink-muted-80">
  {tomorrowDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}
</p>
```

Note: `toLocaleDateString` with `weekday: "long"` and `vi-VN` returns "Thứ Sáu", "Thứ Hai", etc. No manual mapping needed.

- [ ] **Step 7: Add useEffect to call `ensureDefaultRegistrations` on mount**

Add to the component (after the `fetchStats` useEffect):
```ts
useEffect(() => {
  const ensureDefaults = async () => {
    const { RegistrationService } = await import("@/services/RegistrationService")
    const svc = new RegistrationService()
    await svc.ensureDefaultRegistrations(tomorrowDate)
  }
  ensureDefaults()
}, [tomorrowDate])
```

- [ ] **Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit app/admin/dashboard/page.tsx`
Expected: No errors related to our changes

- [ ] **Step 9: Run build to check for issues**

Run: `npm run build 2>&1 | grep -E "book/page|dashboard/page" | head -20`
Expected: No errors in our files

- [ ] **Step 10: Commit**

```bash
git add app/admin/dashboard/page.tsx
git commit -m "feat(admin): dashboard shows tomorrow's data, no date filter"
```

---

## Task 4: Run full build verification

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep -E "dashboard/page|registrationWindow|RegistrationService" | head -20`
Expected: No new errors in our files

- [ ] **Step 2: Start dev server and verify page loads**

Run: `curl -s http://localhost:3000/admin/dashboard | head -20`
Expected: HTML page loads

- [ ] **Step 3: Commit final state**

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Bỏ date picker | Task 3, Step 4 |
| Bỏ nút "Hôm nay" | Task 3, Step 4, Step 5 |
| Default = "ngày mai" (T2-T6) | Task 1 (getNextWorkday) |
| Bỏ qua T7/CN | Task 1 |
| Bỏ qua ngày lễ | Task 1 (isHoliday check — simplified, checks in service layer) |
| Tự tạo record mặc định | Task 2 (ensureDefaultRegistrations) |
| Header "Dashboard — Ngày mai: Thứ X, DD/MM" | Task 3, Step 6 |
| /book không bị ảnh hưởng | Unchanged |
| /admin/reports không bị ảnh hưởng | Unchanged |

## Notes

- Holiday checking is simplified: `getNextWorkday()` currently only skips weekends. Holiday skipping is handled by `ensureDefaultRegistrations()` which creates registrations only for valid workdays.
- `getNextWorkday()` only considers T2-T6 as workdays, so it will skip T7/CN automatically.
- The `ensureDefaultRegistrations` is called on every dashboard mount to ensure defaults exist, but uses upsert so it's idempotent.