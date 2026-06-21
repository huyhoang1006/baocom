# BUG-E2E-NEW-001: Employee Dashboard missing sidebar/navigation

**Severity**: High
**Category**: Visual / UX
**Module**: employee/dashboard
**Test case ID**: Phase 2 NF-2.1
**Reported by**: dogfood agent (Chrome DevTools MCP)
**Date**: 2026-06-21
**Status**: Open

## URL
- Page: `http://127.0.0.1:3000/dashboard` (after employee login)

## Steps to Reproduce
1. Login as employee (nguyenvana / employee123)
2. Browser navigates to /dashboard automatically
3. Observe page DOM

## Expected Behavior
- Sidebar with navigation: Dashboard, Báo cơm (Book), Lịch sử (History)
- Each link navigates to corresponding page
- Active page highlighted in sidebar

## Actual Behavior
- Page renders only heading "Thực Đơn Tuần này" and label "Tuần này"
- **0 `<a>` or `[role=link]` elements**
- **0 `<nav>` or `<aside>` elements**
- Sidebar component (EmployeeSidebar) is not rendered

## Evidence

```javascript
// MCP take_snapshot output:
uid=4_0 RootWebArea "Báo Cơm | Đăng ký suất ăn công ty" url="http://127.0.0.1:3000/dashboard"
  uid=4_1 main
    uid=4_2 StaticText "Tuần này"
    uid=4_3 heading "Thực Đơn Tuần này" level="1"
    uid=4_4 main
```

```javascript
// evaluate_script:
{ links_count: 0, nav_count: 0 }
```

## Impact
- Employee cannot navigate between Dashboard / Book / History pages from UI
- Major UX issue — main navigation missing
- Likely cause: `app/(employee)/layout.tsx` not including `EmployeeSidebar` component

## Suggested Fix
Check `app/(employee)/layout.tsx` — verify `<EmployeeSidebar />` is rendered for authenticated routes.
