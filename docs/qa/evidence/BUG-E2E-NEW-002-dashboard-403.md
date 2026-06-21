# BUG-E2E-NEW-002: 403 Forbidden on Employee Dashboard

**Severity**: Medium
**Category**: Console
**Module**: employee/dashboard
**Test case ID**: Phase 2
**Reported by**: dogfood agent (Chrome DevTools MCP)
**Date**: 2026-06-21
**Status**: Open

## URL
- Page: `http://127.0.0.1:3000/dashboard`

## Steps to Reproduce
1. Login as employee (nguyenvana / employee123)
2. Navigate to /dashboard
3. Open DevTools Console

## Expected Behavior
- No errors in console
- Page loads cleanly

## Actual Behavior
```
[error] Failed to load resource: the server responded with a status of 403 (Forbidden)
```

The page also lacks visible content (only heading shows).

## Evidence

```
msgid=124 [error] WebSocket connection... (HMR issue)
msgid=125 [error] Failed to load resource: the server responded with a status of 403 (Forbidden)
```

## Impact
- One API call returns 403 — possible permission issue or missing token
- Affects data display on dashboard
- Console pollution

## Suggested Fix
1. Identify which API endpoint returns 403 (use Network tab)
2. Check if employee role is allowed to call it
3. Either fix permission check or hide the failing call
