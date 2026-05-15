# Book Weekly Cards Design

Date: 2026-05-15
Status: Draft for user review

## Goal

Update `/book` so employees always see the full current work week as mobile-first day cards, even when the current day is Friday or weekend.

## Scope

This design updates the employee `/book` display and the supporting date-window rules.

In scope:

- Show Monday through Friday for the current week.
- Keep all current-week workdays visible, including past and locked days.
- Use mobile-first cards, one day per card on small screens.
- Preserve existing `Co an` / `Khong an` editing for open future days.
- Preserve the previous cutoff rule: date `D` locks at `23:00` on `D - 1 day`.
- Keep backend validation strict: writes are allowed only for current-week weekdays that are future and not locked.

Out of scope:

- Week navigation.
- Viewing past weeks.
- Editing future weeks.
- Saturday and Sunday cards.
- Holiday filtering.
- Admin reporting changes.

## Business Rules

- `/book` always renders exactly the current week's Monday through Friday.
- There is no next-week or previous-week navigation.
- Today is visible but not editable.
- Past days are visible but not editable.
- Locked days are visible but not editable.
- Future weekdays are editable only when `now < cutoffAt`.
- For target date `D`, `cutoffAt = 23:00` on `D - 1 day`.
- Each date locks independently; locking Tuesday does not lock Wednesday through Friday.
- Saturday and Sunday are not rendered.
- If current day is Friday, Saturday, or Sunday, `/book` still shows Monday through Friday of the same week.

## UI Design

Use Option A from visual brainstorming: weekly cards, mobile-first.

Mobile layout:

- One vertical card per weekday.
- Cards appear in order: `T2`, `T3`, `T4`, `T5`, `T6`.
- Each card shows date, weekday, current status, cutoff text, and lock/edit state.
- Locked cards show `Da khoa` and disabled controls.
- Open cards show two controls: `Co an` and `Khong an`.

Desktop layout:

- Reuse the same cards.
- Cards may flow into a responsive grid.
- No horizontal-only layout is required; mobile behavior is the priority.

Card state rules:

- `Co an`: green success styling.
- `Khong an`: red/error styling.
- Locked/past/today: lower opacity, disabled controls, `Da khoa` label.
- Open future day: active controls.

## Data Flow

1. Employee opens `/book`.
2. UI builds current-week weekdays `T2` through `T6` locally.
3. UI fetches registrations for the current user.
4. For each weekday card, UI derives:
   - date key
   - weekday label
   - current status, defaulting to `Co an`
   - cutoff time
   - locked boolean
   - editable boolean
5. User edits an open future day.
6. UI sends the selected status to the registrations API.
7. Backend revalidates date range and cutoff before saving.
8. UI refetches registrations and updates card state.

## Backend Validation

The backend remains authoritative.

Reject writes when:

- Target date is today or in the past.
- Target date is Saturday or Sunday.
- Target date is outside the current week.
- `now >= cutoffAt` for the target date.
- User attempts to write another user's registration.

Locked-date error remains:

```text
Ngay nay da khoa bao com
```

Invalid-date error remains:

```text
Ngay nay khong nam trong lich bao com
```

## Helper Changes

Current helper behavior only returns future weekdays remaining in the current week. New behavior needs two separate helper concepts:

- `getCurrentWeekWeekdays(now)`: returns all Monday-Friday dates for the current week.
- `isAllowedRegistrationDate(targetDate, now)`: keeps strict write validation for future, current-week, non-weekend, non-locked dates.

This keeps display rules separate from write rules.

## Testing

Unit tests:

- `getCurrentWeekWeekdays` returns Monday-Friday when `now` is Monday.
- `getCurrentWeekWeekdays` returns the same Monday-Friday when `now` is Friday.
- `getCurrentWeekWeekdays` returns the same Monday-Friday when `now` is Saturday or Sunday.
- `isAllowedRegistrationDate` still rejects today.
- `isAllowedRegistrationDate` still rejects past days.
- `isAllowedRegistrationDate` still rejects weekend dates.
- `isAllowedRegistrationDate` still rejects outside-current-week dates.
- Cutoff still locks each date independently.

UI/integration tests:

- `/book` renders five weekday cards.
- On Friday or weekend, cards still render instead of an empty state.
- Past/today/locked cards are visible and disabled.
- Open future cards can switch between `Co an` and `Khong an`.

## Acceptance Criteria

- `/book` always displays Monday through Friday for the current week.
- `/book` does not show Saturday or Sunday.
- `/book` does not include previous/next week navigation.
- If current day is Friday, Saturday, or Sunday, the weekly cards still show.
- Past days, today, and locked days are visible but disabled.
- Future days before cutoff remain editable.
- Backend still blocks invalid writes even if UI is bypassed.
- Tests cover full-week display, weekend current-day display, cutoff behavior, and editable/disabled states.
