# Bao Com Cutoff Flow Design

Date: 2026-05-15
Status: Draft for user review

## Goal

Update the employee meal registration flow so employees can edit lunch registration for future weekdays in the current week until each day's own cutoff time.

## Scope

This design covers the employee `/book` flow and the backend validation used when saving registrations.

In scope:

- Show future days remaining in the current week.
- Exclude today.
- Exclude Saturday and Sunday.
- Keep locked days visible as disabled rows/cards.
- Let employees change each open day between `Co an` and `Khong an`.
- Enforce cutoff on both UI and API.

Out of scope:

- Holiday exclusion.
- Multiple meal types.
- Admin reporting changes.
- Weekly or monthly registration outside the current week.

## Business Rules

- Meal registration is only for lunch.
- Each future weekday in the current week defaults to `Co an`.
- Employees can edit `Co an` / `Khong an` only while the target date is still open.
- Each target date has its own cutoff.
- For target date `D`, cutoff is `23:00` on `D - 1 day`.
- If `now >= cutoffAt`, target date `D` is locked.
- Locking target date `D` does not lock later target dates.
- Locked dates remain visible on `/book` with disabled controls and a `Da khoa` label.

Example for Monday:

| Current time | Tuesday | Wednesday | Thursday | Friday |
| --- | --- | --- | --- | --- |
| Monday 22:59 | Editable | Editable | Editable | Editable |
| Monday 23:00 | Locked | Editable | Editable | Editable |
| Tuesday 22:59 | Locked | Editable | Editable | Editable |
| Tuesday 23:00 | Locked | Locked | Editable | Editable |

## Architecture

Use existing Next.js App Router structure and service/controller pattern.

Expected responsibilities:

- `/book` page displays current-week future weekday registrations.
- A registration service owns date range and cutoff rules.
- API route validates requested changes before writing them.
- Shared date helper logic should stay small and testable, preferably close to `RegistrationService` unless existing utilities already fit.

No new subsystem is required. This is a targeted update to existing meal registration behavior.

## Data Flow

1. Employee opens `/book`.
2. UI requests current registration state for the employee.
3. Backend returns future weekdays from tomorrow through Friday of the current week.
4. For each day, response includes:
   - date
   - current status: `Co an` or `Khong an`
   - locked boolean
   - cutoff time
5. UI renders every returned day.
6. If `locked` is true, control is disabled and shows `Da khoa`.
7. If `locked` is false, employee can switch status.
8. On save, API re-checks cutoff and allowed date before persisting.

## UI Behavior

- Open days show editable `Co an` / `Khong an` controls.
- Locked days show current status but controls are disabled.
- Locked days use visible text `Da khoa` so users understand why editing is unavailable.
- The page should not hide locked future weekdays.
- If no editable day remains in the current week, the page still shows locked days and a short message that no days are open for editing.

## Persistence Behavior

The existing data model should be preserved.

- Selecting `Khong an` stores a registration state that represents not eating for that date.
- Selecting `Co an` stores or updates state according to the current project pattern.
- If the existing code treats missing registration as default `Co an`, changing from `Khong an` back to `Co an` may delete the explicit not-eating record instead of creating a new explicit eating record.
- The API response should normalize this detail and return `Co an` / `Khong an` consistently to the UI.

## Validation And Errors

Backend validation must reject writes when:

- Target date is today or in the past.
- Target date is Saturday or Sunday.
- Target date is outside the current week.
- `now >= cutoffAt` for the target date.
- Employee attempts to update another employee's registration.

Locked-date error message:

```text
Ngay nay da khoa bao com
```

The UI should show the API error if a race happens between rendering and saving, for example user opens page at 22:59 and saves at 23:00.

## Testing

Unit tests:

- Current-week future weekday generation excludes today.
- Saturday and Sunday are excluded.
- Monday before 23:00 keeps Tuesday-Friday editable.
- Monday at 23:00 locks Tuesday only and keeps Wednesday-Friday editable.
- Tuesday at 23:00 locks Wednesday only, while Thursday-Friday remain editable.
- API/service rejects locked dates.
- API/service rejects weekend dates.
- API/service rejects dates outside the current week.

UI or integration tests:

- Locked day remains visible.
- Locked day control is disabled and shows `Da khoa`.
- Open day can be changed between `Co an` and `Khong an`.

## Acceptance Criteria

- `/book` shows only future weekdays remaining in the current week.
- Locked future weekdays are visible, not hidden.
- Each day locks independently at `23:00` on the previous day.
- After Monday 23:00, Tuesday is locked while Wednesday-Friday remain editable.
- Employees can edit open future weekdays between `Co an` and `Khong an`.
- Backend prevents saving invalid or locked dates even if UI is bypassed.
- Tests cover cutoff, date filtering, locked visibility, and editable status changes.
