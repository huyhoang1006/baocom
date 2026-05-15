# Registration DateKey Sync Design

## Problem

When an employee changes a future booking day from `Khong an` to `Co an`, the API can return success while the `/book` UI still shows the old status after refresh. The visible symptom means the mutation path and the read path are not using one unambiguous day identity.

The risky point is date conversion. The UI works with day cards keyed by `YYYY-MM-DD`, while registrations from the API currently expose `date` as a serialized `Date`. The hook then reparses that value with `new Date(...).toISOString().split('T')[0]`. That creates a hidden dependency on timezone and serialization details instead of matching the same date key the UI used when submitting.

## Goal

Make registration status sync by using one canonical `dateKey` (`YYYY-MM-DD`) across the `/book` UI, registration API response, and hook status lookup.

Success criteria:

- If `nguyenvana` changes next Monday from `not_eating` to `eating`, `/book` shows `Co an` immediately after success.
- Refreshing the page and navigating back to next week still shows `Co an` for that Monday.
- Backend cutoff/window validation remains authoritative.
- Existing registration create/upsert behavior remains unchanged except response shape and client matching reliability.

## Recommended Approach

Use canonical `dateKey` end-to-end.

The backend should return `dateKey` for each registration using the existing `toDateKey()` helper. The client should use `registration.dateKey` for `getStatusForDate(dateKey)` comparisons. The hook should also update local state from the successful POST response before refetching so the UI reflects the accepted write immediately.

This is preferred over only changing the UI parser because it removes ambiguity at the API boundary. It is also preferred over optimistic-only updates because refresh must still show the correct value.

## Architecture

### Backend

`RegistrationService` continues to own validation and persistence. It should not relax `isAllowedRegistrationDate()` or cutoff behavior.

`RegistrationsController` should shape registration responses so every returned registration includes:

- `date`: existing serialized date, kept for existing consumers.
- `dateKey`: canonical local date key such as `2026-05-18`.
- `status`: API status, `eating` or `not_eating`.

The same response shape should be used by `GET /api/registrations` and `POST /api/registrations`.

### Client Hook

`useRegistrations()` should treat `dateKey` as the primary key for matching UI days.

`getStatusForDate(dateKey)` should:

1. Prefer `registration.dateKey` when available.
2. Fall back to deriving a key from `registration.date` only for compatibility with old or test data.
3. Convert API status to UI status with `toUIStatus()`.

`setStatus(dateKey, status)` should:

1. Convert UI status to API status.
2. POST the canonical `dateKey` string.
3. If the API returns a registration, upsert that registration into local hook state immediately.
4. Refetch registrations afterward to keep the hook in sync with backend state.

### Book Page

`/book` should keep using `day.dateKey` from `getWeekdaysForOffset()`. No new date parsing should be added in the page. The page should continue to render current week plus four future weeks and keep locked/past days disabled.

## Data Flow

```text
User clicks Co an on next Monday
  |
  v
/book sends dateKey = 2026-05-18, status = eating
  |
  v
POST /api/registrations validates date and upserts registration
  |
  v
API returns registration with dateKey = 2026-05-18, status = eating
  |
  v
useRegistrations updates local state by dateKey
  |
  v
getStatusForDate(2026-05-18) returns eating
  |
  v
/book shows Co an
```

## Error Handling

- If POST fails, `setStatus()` returns `false` and stores the API error message.
- If POST succeeds but refetch fails, the accepted registration remains in local state and the hook records the refetch error. The user should not lose the visible successful change.
- If a registration lacks `dateKey`, the hook falls back to the existing `date` value to avoid breaking older tests or API consumers.

## Testing

Add focused tests instead of broad UI-only checks.

- Controller/API response test: created registration response includes `dateKey` matching submitted `YYYY-MM-DD`.
- Hook test: after `setStatus('2026-05-18', 'eating')`, `getStatusForDate('2026-05-18')` returns `eating` from the returned registration.
- Hook regression test: refetch data with `dateKey: '2026-05-18'` maps to the correct UI day without reparsing ISO dates.
- Existing `/book` navigation tests remain valid.
- Existing service cutoff tests remain valid.

## Scope

In scope:

- Add `dateKey` to registration API response objects.
- Update `useRegistrations()` matching and post-success state update.
- Add regression tests for the reported bug.

Out of scope:

- Database schema changes.
- New booking windows or cutoff rules.
- Admin reports/date export behavior.
- Visual redesign of `/book`.

## Risks

- Existing consumers may depend on `date`; keep it unchanged.
- Tests with mocked registration objects may need `dateKey` or fallback coverage.
- Refetch after local update can still overwrite state if backend returns old data; tests should cover that successful create and subsequent GET agree on `dateKey` and status.
