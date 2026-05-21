# Design: Admin Dashboard Default Date + Cutoff Logic Fix

**Date:** 2026-05-21
**Topic:** Dashboard Default Date Selection + Weekend Cutoff Rule
**Status:** Draft

## Problem Statement

### Part A: Dashboard Default Date
Khi admin vào dashboard vào ngày **Thursday**, mặc định nó hiển thị stats cho Thursday. Tuy nhiên, theo business rule, hôm nay Thursday → admin đặt cutoff 23h Thursday → **Friday bị khóa** không cho đổi. Yêu cầu: khi admin vào dashboard vào Thursday, mặc định nên hiển thị stats cho **Friday**.

### Part B: Cutoff Logic cho Monday
- Khi hôm nay **Friday**, muốn đăng ký **Monday** tuần sau → cutoff phải là **23h Sunday** (để người quên có thời gian cuối tuần nhớ lại)
- Logic hiện tại: `getCutoffAt()` cắt ngày -1 ngày, cho Monday ra Sunday 23h → **đã đúng**
- Cần verify: với Saturday (non-workday), không cho đăng ký

## Cutoff Rule Summary

| Registration Date | Cutoff Time | Example (when booking) |
|------------------|------------|------------------------|
| Monday | 23:00 Sunday | Fri booking Mon → cutoff Sun 23:00 |
| Tuesday | 23:00 Monday | Mon booking Tue → cutoff Mon 23:00 |
| Wednesday | 23:00 Tuesday | Tue booking Wed → cutoff Tue 23:00 |
| Thursday | 23:00 Wednesday | Wed booking Thu → cutoff Wed 23:00 |
| Friday | 23:00 Thursday | Thu booking Fri → cutoff Thu 23:00 |

**Note:** Thứ 7 và Chủ nhật là non-workday, không báo cơm.

## Part B: Cutoff Logic - Already Correct

Đã verify: `getCutoffAt()` hiện tại đã đúng rule mới:

```typescript
export function getCutoffAt(targetDate: Date, config?: CutoffTimeConfig): Date {
  const cutoffAt = startOfLocalDay(targetDate)
  cutoffAt.setDate(cutoffAt.getDate() - 1)  // -1 ngày
  cutoffAt.setHours(config?.hour ?? 23, config?.minute ?? 0, 0, 0)
  return cutoffAt
}
```

- Monday → cutoff Sunday 23:00 ✓
- Tuesday → cutoff Monday 23:00 ✓
- ... (các ngày khác tương tự)

**Không cần thay đổi code cho Part B.**

## Design

### 1. Logic Change

**File:** `src/lib/registrationWindow.ts`

Thêm helper function `getNextLockedDay`:

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

### 2. Dashboard Change

**File:** `app/admin/dashboard/page.tsx`

Thay đổi initial state của `selectedDate`:

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

### 3. Behavior Summary

| Hôm nay | Mặc định hiển thị | Lý do |
|--------|-------------------|-------|
| Thursday | Friday | Friday đã past cutoff (23h Thursday) |
| Friday | Monday (tuần sau) | Friday past cutoff rồi |
| Monday-Tuesday | Ngày đầu tiên chưa bị khóa | Không có ngày nào bị khóa trong tuần |

### 4. Edge Cases

- Nếu không có ngày nào bị khóa → fallback về today như hiện tại
- Nếu today là Friday/Saturday/Sunday (weekend) → vẫn fallback về today
- Nút "Hôm nay" vẫn hoạt động như cũ

## Files to Modify

1. `src/lib/registrationWindow.ts` - thêm `getNextLockedDay()`
2. `app/admin/dashboard/page.tsx` - đổi initial state của `selectedDate`