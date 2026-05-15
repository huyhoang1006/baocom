# Book Four Week Navigation Design

Date: 2026-05-15
Status: Draft for user review

## Goal

Update `/book` so employees can view and edit meal registrations by week from the current week through four future weeks.

## Scope

This design updates the employee `/book` weekly navigation, display rules, and backend write validation window.

In scope:

- Show one work week at a time.
- Default to the current week.
- Let employees navigate forward up to four weeks after the current week.
- Do not let employees navigate to previous weeks.
- Render Monday through Friday for the selected week.
- Keep Saturday and Sunday hidden.
- Preserve mobile-first day cards.
- Preserve cutoff rule: date `D` locks at `23:00` on `D - 1 day`.
- Allow writes only for future weekdays within the current week plus four future weeks and before cutoff.

Out of scope:

- Month calendar UI.
- Viewing historical weeks in `/book`.
- Unlimited future navigation.
- Holiday filtering.
- Admin reporting changes.

## Business Rules

- `/book` opens on the current week.
- User can navigate to week offsets `0`, `1`, `2`, `3`, and `4`.
- Week offset `0` is the current week.
- Week offset `4` is the fourth future week after the current week.
- Previous week navigation is disabled at week offset `0`.
- Next week navigation is disabled at week offset `4`.
- Each selected week renders exactly Monday through Friday.
- Today is visible but not editable when selected week is current week.
- Past days are visible but not editable when selected week is current week.
- Future weekdays are editable only when `now < cutoffAt`.
- For target date `D`, `cutoffAt = 23:00` on `D - 1 day`.
- Each date locks independently.
- If today is Friday, Saturday, or Sunday, user can navigate to next week and edit Monday through Friday if those dates have not passed cutoff.
- For next week's Monday, cutoff is `23:00` on Sunday.

## UI Design

Use the existing mobile-first card layout.

Header area:

- Show selected week range, for example `Tuần 12/05 - 16/05`.
- Show `Tuần hiện tại` badge when offset is `0`.
- Show navigation controls:
  - `← Tuần trước`
  - `Tuần sau →`
- Disable `Tuần trước` at offset `0`.
- Disable `Tuần sau` at offset `4`.

Cards:

- Render cards in order: `T2`, `T3`, `T4`, `T5`, `T6`.
- Each card shows date, weekday, current status, cutoff text, and lock/edit state.
- Locked cards show `Da khoa` and disabled controls.
- Open cards show two controls: `Co an` and `Khong an`.

Mobile behavior:

- One vertical card per weekday.
- Navigation buttons stack or fit on one row depending on width.

Desktop behavior:

- Cards may flow into a responsive grid.
- No calendar grid is required.

## Data Flow

1. Employee opens `/book`.
2. UI sets selected week offset to `0`.
3. UI builds Monday-Friday dates for selected week offset.
4. UI fetches registrations for the current user.
5. For each day card, UI derives:
   - date key
   - weekday label
   - current status, defaulting to `Co an`
   - cutoff time
   - locked boolean
   - editable boolean
6. User navigates next/previous week within allowed offsets.
7. UI rebuilds displayed dates and reuses registration data by date key.
8. User edits an open day.
9. UI sends selected status to registrations API.
10. Backend revalidates date window and cutoff before saving.
11. UI refetches registrations and updates card state.

## Backend Validation

Backend remains authoritative and must not trust UI navigation.

Reject writes when:

- Target date is today or in the past.
- Target date is Saturday or Sunday.
- Target date is before the current week.
- Target date is after the end of week offset `4`.
- `now >= cutoffAt` for target date.
- User attempts to write another user's registration.

Locked-date error remains:

```text
Ngay nay da khoa bao com
```

Invalid-date-window error remains:

```text
Ngay nay khong nam trong lich bao com
```

## Helper Changes

Current helper supports only the current week display. New behavior needs week-offset helpers:

- `getWeekStart(now, weekOffset)`: returns Monday for current week plus offset.
- `getWeekdaysForOffset(now, weekOffset)`: returns Monday-Friday for selected week offset.
- `isAllowedRegistrationDate(targetDate, now)`: allows only future weekdays from the current week through week offset `4`, still applying cutoff.

The UI uses `getWeekdaysForOffset`. The service uses `isAllowedRegistrationDate`.

## Edge Cases

- Today is Monday: current week shows Monday disabled, Tuesday-Friday open if before cutoff.
- Today is Friday: current week shows Monday-Friday disabled; next week shows editable future weekdays if before each cutoff.
- Today is Saturday: current week shows Monday-Friday disabled; next week Monday-Friday may be editable until their cutoffs.
- Today is Sunday before 23:00: next week Monday is editable.
- Today is Sunday at or after 23:00: next week Monday is locked, Tuesday-Friday remain editable if before their cutoffs.
- Current week crosses month boundary: selected week still shows Monday-Friday together.
- Week offset `4` crosses into next month: allowed because rule is week-based, not month-based.
- Week offset `5` or later: not visible in UI and rejected by backend.

## Testing

Unit tests:

- `getWeekdaysForOffset(now, 0)` returns current week Monday-Friday.
- `getWeekdaysForOffset(now, 1)` returns next week Monday-Friday.
- `getWeekdaysForOffset(now, 4)` returns fourth future week Monday-Friday.
- `isAllowedRegistrationDate` rejects today.
- `isAllowedRegistrationDate` rejects past days.
- `isAllowedRegistrationDate` rejects weekends.
- `isAllowedRegistrationDate` rejects dates before current week.
- `isAllowedRegistrationDate` rejects dates after week offset `4`.
- Cutoff locks Monday of next week at Sunday 23:00.

UI tests:

- `/book` opens on current week.
- `/book` renders five weekday cards for selected week.
- Next button advances to week offset `1`.
- Previous button returns to week offset `0`.
- Previous button disabled at offset `0`.
- Next button disabled at offset `4`.
- On Friday/Saturday/Sunday, next week cards remain accessible.
- Open future day can switch between `Co an` and `Khong an`.

Service/controller tests:

- Creating registration for a future weekday in week offset `4` succeeds.
- Creating registration for week offset `5` fails.
- Creating registration for next Monday after Sunday 23:00 fails with locked error.

## Acceptance Criteria

- `/book` defaults to current week.
- `/book` can navigate forward through four future weeks.
- `/book` cannot navigate to previous weeks.
- `/book` cannot navigate beyond four future weeks.
- Each selected week displays Monday through Friday only.
- Past days, today, and cutoff-locked days remain visible but disabled.
- Future days before cutoff remain editable.
- Backend permits valid future weekdays up to week offset `4`.
- Backend rejects dates beyond week offset `4`.
- Tests cover navigation, date-window validation, cutoff behavior, and edit behavior.
