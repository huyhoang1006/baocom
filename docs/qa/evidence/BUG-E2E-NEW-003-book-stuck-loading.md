# BUG-E2E-NEW-003: Book page stuck loading

**Severity**: High
**Category**: Functional
**Module**: employee/book
**Test case ID**: Phase 3 NF-3.1
**Reported by**: dogfood agent (Chrome DevTools MCP)
**Date**: 2026-06-21
**Status**: Open

## URL
- Page: `http://127.0.0.1:3000/book` (after employee login)

## Steps to Reproduce
1. Login as employee (nguyenvana / employee123)
2. Navigate to /book
3. Wait for page to load (>10s)

## Expected Behavior
- Day cards (T2-T6) render with menu items
- Quick action buttons enabled
- Status badges (eating/not-eating) shown
- Loading spinner hidden after data loaded

## Actual Behavior
- Page renders heading "Báo Cơm" and week label
- **Stuck at "Đang tải lịch báo cơm..." forever**
- No day cards visible
- API verification: `/api/daily-menus` returns 200 OK with valid data

## Evidence

```javascript
// body.innerText after 8+ seconds:
"Báo Cơm\nXem tuần hiện tại và 4 tuần tới. Bạn chỉ chỉnh được các ngày tương lai chưa khóa.\nTuần 15/06 - 19/06\nTuần hiện tại\n1/5\n← Tuần trước\nTuần sau →\n5\nCó ăn\n0\nCòn sửa được\nĐang tải lịch báo cơm..."
```

```javascript
// API directly:
{
  status: 200,
  ct: "application/json",
  body: '{"menus":[{"id":"...","date":"2026-03-23T17:00:00.000Z",...}]}'
}
```

## Impact
- **Main feature of the app unusable** — cannot book meals
- Severe UX impact for all employees

## Root Cause Hypothesis
The `useRegistrations` hook (probably called in `app/(employee)/book/page.tsx`) calls API but does not set loading=false on success, or returns data in unexpected shape.

## Suggested Fix
1. Open `src/hooks/useRegistrations.ts`
2. Verify API response handling
3. Check if loading state properly transitions to false
4. Add error boundary
