# Fix: Admin Cutoff Config Not Applied to Employee UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Employee book page reads actual cutoff config from DB instead of hardcoded 23:00, so lock time display matches server validation.

**Architecture:**
1. Create employee-facing API endpoint to fetch cutoff config
2. Update book page to fetch config and pass to `getWeekdaysForOffset`
3. Modify `getWeekdaysForOffset` and `getRegistrationDayState` to accept optional config

**Tech Stack:** Next.js App Router, Prisma

---

## File Structure

| File | Responsibility |
|------|----------------|
| `app/api/settings/cutoff/route.ts` | **Create** - Employee endpoint to GET cutoff config |
| `src/lib/registrationWindow.ts` | **Modify** - Accept optional config in public functions |
| `app/(employee)/book/page.tsx` | **Modify** - Fetch config on load, pass to `getWeekdaysForOffset` |

---

## Task 1: Create Employee Cutoff Config API Endpoint

**Files:**
- Create: `app/api/settings/cutoff/route.ts`

- [ ] **Step 1: Write the API route**

```typescript
import { NextResponse } from 'next/server'
import { getCutoffConfig } from '@/lib/cutoffConfig'

export const GET = async () => {
  try {
    const config = await getCutoffConfig()
    return NextResponse.json({
      cutoffHour: config.cutoffHour,
      cutoffMinute: config.cutoffMinute,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cutoff config' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify file creation**

Run: `ls app/api/settings/cutoff/route.ts`
Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add app/api/settings/cutoff/route.ts
git commit -m "feat: add employee-facing cutoff config API endpoint"
```

---

## Task 2: Update RegistrationWindow Functions to Accept Config

**Files:**
- Modify: `src/lib/registrationWindow.ts:94-103`, `src/lib/registrationWindow.ts:131-145`

- [ ] **Step 1: Update getWeekdaysForOffset to accept config**

```typescript
// Line 94 - modify function signature and body
export function getWeekdaysForOffset(
  now = new Date(),
  weekOffset = 0,
  config?: CutoffTimeConfig
): RegistrationDayState[] {
  const monday = getWeekStart(now, weekOffset)

  return [0, 1, 2, 3, 4].map((offset) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + offset)
    return getRegistrationDayState(date, now, config)
  })
}
```

- [ ] **Step 2: Update getRegistrationDayState to accept and pass config**

```typescript
// Line 131 - modify function signature
export function getRegistrationDayState(
  targetDate: Date,
  now = new Date(),
  config?: CutoffTimeConfig
): RegistrationDayState {
  const date = startOfLocalDay(targetDate)
  const cutoffAt = getCutoffAt(date, config)  // ◄── pass config now
  const dayOfWeek = date.getDay()
  const isWorkday = dayOfWeek !== 0 && dayOfWeek !== 6

  return {
    date,
    dateKey: toDateKey(date),
    dayName: WEEKDAY_NAMES[date.getDay()],
    cutoffAt,
    locked: now >= cutoffAt,
    isWorkday,
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/registrationWindow.ts
git commit -m "feat: allow optional cutoff config in registration day functions"
```

---

## Task 3: Update Employee Book Page to Fetch and Use Config

**Files:**
- Modify: `app/(employee)/book/page.tsx:13-32`

- [ ] **Step 1: Add useEffect to fetch cutoff config**

After imports, add:

```typescript
import { useEffect, useState } from "react"
import { CutoffTimeConfig } from "@/lib/registrationWindow"
```

Inside BookPage component, add state and effect:

```typescript
const [cutoffConfig, setCutoffConfig] = useState<CutoffTimeConfig | null>(null)

useEffect(() => {
  fetch('/api/settings/cutoff')
    .then((r) => r.json())
    .then((data) => setCutoffConfig({ hour: data.cutoffHour, minute: data.cutoffMinute }))
    .catch(console.error)
}, [])
```

- [ ] **Step 2: Pass config to getWeekdaysForOffset**

```typescript
// Around line 21, change:
return getWeekdaysForOffset(today, weekOffset, cutoffConfig ?? undefined).map((day) => {
```

- [ ] **Step 3: Add cutoffConfig to dependency array**

```typescript
}, [today, weekOffset, getStatusForDate, cutoffConfig])
```

- [ ] **Step 4: Run build**

Run: `npm run build 2>&1 | head -60`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add app/\(employee\)/book/page.tsx
git commit -m "feat: fetch and use admin cutoff config on employee book page"
```

---

## Task 4: End-to-End Verification

- [ ] **Step 1: Admin sets custom cutoff time**
  Go to `/admin/settings`, set cutoff to e.g. 22:30, save

- [ ] **Step 2: Employee sees correct lock time**
  Go to `/book`, verify DayCard shows "Khóa lúc 22:30" (not 23:00)

- [ ] **Step 3: Verify server validation aligns**
  After cutoff time passes, verify registration is blocked on server

---

## Gaps Check

1. Admin sets cutoff → saved to DB ✓
2. Employee book page → fetches from API endpoint ✓
3. Functions accept config → passing config through ✓
4. UI shows correct lock time → verified manually ✓

No gaps found.
