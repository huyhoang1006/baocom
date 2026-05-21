# Fix báo cơm không hiển thị đầy đủ các ngày trong tuần

## Status

- **Date:** 2026-05-21
- **Issue:** baocom-pdw
- **Type:** Bug fix
- **Author:** h004888

## Mục tiêu

Fix bug khiến trang /book không hiển thị đầy đủ 7 ngày trong tuần (T2-CN). Hiện tại chỉ hiển thị 5 ngày T2-T6.

## Tình trạng hiện tại

- **Hành vi hiện tại:** Khi hôm nay là T5 (thứ 5), trang /book chỉ hiển thị T2, T3, T4, T5 - thiếu T6 (thứ 6)
- **Hành vi mong muốn:** Hiển thị đầy đủ T2, T3, T4, T5, T6, T7, CN với T7 và CN ở trạng thái disabled

## Thiết kế

### 1. Cập nhật `getWeekdaysForOffset`

**File:** `src/lib/registrationWindow.ts`

**Thay đổi:**
- Mở rộng mảng từ `[0,1,2,3,4]` (5 ngày) thành `[0,1,2,3,4,5,6]` (7 ngày)
- Thứ 7 (offset=5) và CN (offset=6) sẽ có `disabled: true`

**Code hiện tại (dòng 95-103):**
```typescript
export function getWeekdaysForOffset(now = new Date(), weekOffset = 0): RegistrationDayState[] {
  const monday = getWeekStart(now, weekOffset)

  return [0, 1, 2, 3, 4].map((offset) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + offset)
    return getRegistrationDayState(date, now)
  })
}
```

**Code sau khi sửa:**
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

### 2. Cập nhật `getRegistrationDayState`

**Thay đổi:**
- Thêm field `isWorkday: boolean` để phân biệt ngày làm việc và ngày nghỉ
- T2-T6: `isWorkday: true`
- T7 (Thứ 7) và CN (Chủ nhật): `isWorkday: false`

**Interface mới:**
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

**Logic xác định isWorkday:**
```typescript
const isWorkday = day !== 0 && day !== 6  // không phải CN(0) hay T7(6)
```

### 3. Cập nhật UI (Frontend)

**Component hiển thị ngày:**
- T2-T6: Hiển thị bình thường, cho phép tương tác
- T7, CN: Hiển thị với style disabled (opacity thấp hơn, cursor not-allowed)

## Kiểm thử

1. Khi là T5 (thứ 5), trang /book phải hiển thị đủ T2,T3,T4,T5,T6,T7,CN
2. T7 và CN phải hiển thị ở trạng thái disabled
3. Ngày T6 (thứ 6) phải cho phép đăng ký (không bị disabled)
4. Timezone Việt Nam (UTC+7) phải được xử lý đúng

## Files cần sửa

- `src/lib/registrationWindow.ts` - Logic ngày
- Frontend component hiển thị ngày (cần xác định file cụ thể)