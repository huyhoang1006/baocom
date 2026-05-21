# Fix báo cơm không hiển thị đầy đủ các ngày trong tuần

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix trang /book để hiển thị đầy đủ 7 ngày (T2-CN), với T7 và CN ở trạng thái disabled.

**Architecture:** Sửa logic ngày trong `registrationWindow.ts` để trả về 7 ngày thay vì 5, thêm field `isWorkday` để UI biết ngày nào được phép đăng ký.

**Tech Stack:** TypeScript, Next.js, React

---

## Task 1: Cập nhật `RegistrationDayState` interface

**Files:**
- Modify: `src/lib/registrationWindow.ts:11-17`

- [ ] **Step 1: Thêm field `isWorkday` vào interface**

```typescript
export interface RegistrationDayState {
  date: Date
  dateKey: string
  dayName: string
  cutoffAt: Date
  locked: boolean
  isWorkday: boolean  // true cho T2-T6, false cho T7, CN
}
```

---

## Task 2: Cập nhật `getRegistrationDayState` để tính `isWorkday`

**Files:**
- Modify: `src/lib/registrationWindow.ts:131-142`

- [ ] **Step 1: Cập nhật function để thêm isWorkday**

```typescript
export function getRegistrationDayState(targetDate: Date, now = new Date()): RegistrationDayState {
  const date = startOfLocalDay(targetDate)
  const cutoffAt = getCutoffAt(date)
  const dayOfWeek = date.getDay()
  const isWorkday = dayOfWeek !== 0 && dayOfWeek !== 6  // true cho T2-T6, false cho T7(6) và CN(0)

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

---

## Task 3: Mở rộng `getWeekdaysForOffset` trả về 7 ngày

**Files:**
- Modify: `src/lib/registrationWindow.ts:95-103`

- [ ] **Step 1: Thay đổi mảng từ [0,1,2,3,4] thành [0,1,2,3,4,5,6]**

```typescript
export function getWeekdaysForOffset(now = new Date(), weekOffset = 0): RegistrationDayState[] {
  const monday = getWeekStart(now, weekOffset)

  return [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + offset)
    return getRegistrationDayState(date, now)
  })
}
```

---

## Task 4: Cập nhật UI trong `book/page.tsx` để xử lý `isWorkday`

**Files:**
- Modify: `app\(employee)\book\page.tsx:125-203`

- [ ] **Step 1: Thêm disabled style cho ngày không phải workday**

Tìm đoạn code map days trong JSX (dòng 125):
```tsx
<div
  key={day.dateKey}
  data-testid={`book-day-${day.dateKey}`}
  className={`
    relative p-4 rounded-[18px] border-2 transition-all duration-200
    ${day.locked ? "opacity-60" : ""}
    ${!day.isWorkday && !day.locked ? "opacity-50" : ""}
    ${isEating ? "border-success bg-success-bg" : ""}
    ${isNotEating ? "border-error bg-error-bg" : ""}
  `}
>
```

- [ ] **Step 2: Disable buttons cho ngày không phải workday**

Sửa button "Có ăn" (dòng 180-189):
```tsx
<button
  type="button"
  disabled={day.locked || !day.isWorkday || isEating}
  onClick={() => handleStatusChange(day.dateKey, "eating")}
  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
    isEating ? "border-success bg-success text-on-primary" : "border-hairline bg-canvas text-ink"
  } ${day.locked || !day.isWorkday ? "cursor-not-allowed opacity-50" : "active:scale-95"}`}
>
  Có ăn
</button>
```

Sửa button "Không ăn" (dòng 190-199):
```tsx
<button
  type="button"
  disabled={day.locked || !day.isWorkday || isNotEating}
  onClick={() => handleStatusChange(day.dateKey, "not-eating")}
  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
    isNotEating ? "border-error bg-error text-on-primary" : "border-hairline bg-canvas text-ink"
  } ${day.locked || !day.isWorkday ? "cursor-not-allowed opacity-50" : "active:scale-95"}`}
>
  Không ăn
</button>
```

---

## Task 5: Kiểm thử

**Files:**
- Test: Manual test tại http://localhost:3000/book

- [ ] **Step 1: Verify hiển thị 7 ngày**
   - Khi hôm nay là T5 (thứ 5), trang /book phải hiển thị đủ T2,T3,T4,T5,T6,T7,CN

- [ ] **Step 2: Verify T7 và CN disabled**
   - T7 và CN phải hiển thị ở trạng thái disabled (opacity thấp hơn, buttons không cho click)

- [ ] **Step 3: Verify T6 cho phép đăng ký**
   - Ngày T6 (thứ 6) phải cho phép đăng ký (không bị disabled do isWorkday)

---

## Task 6: Commit changes

- [ ] **Step 1: Commit**

```bash
git add src/lib/registrationWindow.ts "app/(employee)/book/page.tsx"
git commit -m "fix(baocom-pdw): hiển thị đủ 7 ngày T2-CN trên trang báo cơm

- Mở rộng getWeekdaysForOffset trả về 7 ngày thay vì 5
- Thêm isWorkday field để phân biệt ngày làm việc và ngày nghỉ
- Cập nhật UI disable T7 và CN trên trang /book"
```