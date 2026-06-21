# BUG-013: Reports export query params naming không nhất quán

**Severity**: Low
**Category**: API Contract, Documentation
**Module**: reports, api
**Test case ID**: API-18
**Reported by**: dogfood agent
**Date**: 2026-06-21
**Status**: Open

## URL / Endpoint
- API: `GET /api/admin/reports`, `/api/admin/reports/export`

## Environment
- Browser: HTTP curl
- NODE_ENV: test
- Time reproduced: 2026-06-21 17:00 ICT

## Steps to Reproduce
Thử các param khác nhau:

| Query params | Status |
|--------------|--------|
| `?type=day&startDate=2026-06-20&endDate=2026-06-22` | 200 ✓ |
| `?from=2026-06-20&to=2026-06-22` | 400 "Missing date range" |
| `?start=2026-06-20&end=2026-06-22` | 400 "Missing date range" |
| `?date=2026-06-22` | 400 "Missing date range" |
| `?type=day&date=2026-06-22` | 400 "Missing date range" |

## Expected Behavior
- Either: consistent naming (e.g., always `from/to` hoặc `startDate/endDate`)
- Hoặc: support cả hai với backward compat
- Documented in OpenAPI/Swagger

## Actual Behavior
- Chỉ chấp nhận `startDate/endDate` (không phải `from/to` như REST convention)
- Các param khác đều 400 với message generic "Missing date range" — không nói rõ phải dùng param nào

## Evidence
```
GET /api/admin/reports?from=2026-06-20&to=2026-06-22:
{"error":"Missing date range"}

GET /api/admin/reports?start=2026-06-20&end=2026-06-22:
{"error":"Missing date range"}

GET /api/admin/reports?type=day&startDate=2026-06-22&endDate=2026-06-22:
{"reportData":[...]}
```

## Impact
- Developer confusion khi integrate.
- Error message không giúp debug.

## Suggested Fix
1. Document params rõ ràng trong API docs
2. Error message cụ thể hơn: "Missing required query params: startDate, endDate"
3. Hoặc support alias `from`/`to` cho backward compat.

## File reference
- `src/controllers/AdminReportsController.ts`
- `app/api/admin/reports/route.ts`
- `app/api/admin/reports/export/route.ts`