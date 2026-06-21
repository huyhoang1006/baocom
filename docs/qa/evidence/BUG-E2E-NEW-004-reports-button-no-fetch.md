# BUG-E2E-NEW-004: Reports "Tra cứu" button doesn't fetch data

**Severity**: High
**Category**: Functional
**Module**: admin/reports
**Test case ID**: Phase 10 AF-10.1
**Reported by**: dogfood agent (Chrome DevTools MCP)
**Date**: 2026-06-21
**Status**: Open

## URL
- Page: `http://127.0.0.1:3000/admin/reports` (after admin login)

## Steps to Reproduce
1. Login as admin (admin/admin123)
2. Navigate to /admin/reports
3. Verify page renders with date picker
4. Click "Tra cứu" button

## Expected Behavior
- API call to `/api/admin/reports` is triggered
- Loading state shown
- Report table renders with data

## Actual Behavior
- Page renders correctly (heading, tabs, date picker)
- "Tra cứu" button is clickable
- Click has no visible effect — page stays in empty state "Chưa có dữ liệu báo cáo"
- Similar to BUG-E2E-NEW-003 — possible React state sync issue

## Evidence

```javascript
// body.innerText after click:
"restaurant\nBÁO CÁO\nXuất Báo Cáo\nTạo báo cáo suất ăn cho bếp nấu theo ngày, tuần hoặc tháng\ntoday\nNgày\ndate_range\nTuần\ncalendar_month\nTháng\nschedule\nPhạm vi:\nsearch\nTra cứu\nassignment\nChưa có dữ liệu báo cáo\nChọn phạm vi thời gian và nhấn \"Tra cứu\" để xem"
```

## Impact
- Main admin feature (generating reports) unusable via UI
- Admins must use API directly or other workaround

## Suggested Fix
1. Open `app/admin/reports/page.tsx`
2. Check button onClick handler
3. Verify API call trigger and state update
