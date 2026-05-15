# Employee Dashboard Sidebar Item Design

## Context

Employee routes already include a dashboard page at `app/(employee)/dashboard/page.tsx`. The employee sidebar in `app/components/sidebar/EmployeeSidebar.tsx` currently exposes `Báo cơm` and `Lịch sử`, so users have no sidebar option for returning to `/dashboard`.

## Goal

Add a `Dashboard` navigation option to the employee sidebar so employee users can open `/dashboard` from both desktop sidebar and mobile drawer.

## Scope

In scope:

- Add one employee sidebar navigation item.
- Place it first in the employee sidebar navigation list.
- Use href `/dashboard`.
- Use Material Symbols icon `dashboard`.
- Preserve existing active state behavior and styling.
- Preserve existing `Báo cơm` and `Lịch sử` items.

Out of scope:

- Admin sidebar changes.
- Route changes.
- Dashboard page content changes.
- Authentication or authorization changes.
- Sidebar layout redesign.

## Design

Update `navItems` in `app/components/sidebar/EmployeeSidebar.tsx` to include:

```ts
{ label: "Dashboard", href: "/dashboard", icon: "dashboard" }
```

The item should be first so dashboard is the primary employee destination. Because desktop and mobile both render `EmployeeSidebar`, the change applies to both surfaces without changing `app/(employee)/layout.tsx`.

Active state remains `pathname === item.href`, matching existing behavior. No new component, helper, or route mapping is needed.

## Data Flow

No data flow changes. Sidebar item is static config consumed by `navItems.map(...)` inside `EmployeeSidebar`.

## Error Handling

No new runtime error paths. If `/dashboard` is unavailable, existing Next.js routing behavior applies. Current route exists, so link should resolve.

## Testing

Verify with available project checks after implementation:

- Run relevant unit or e2e tests if existing sidebar coverage exists.
- Run build or typecheck command from project scripts if available.
- Manually inspect employee sidebar behavior if automated coverage is absent.

## Acceptance Criteria

- Employee sidebar shows `Dashboard` before `Báo cơm`.
- Clicking `Dashboard` navigates to `/dashboard`.
- Dashboard item uses `dashboard` icon.
- Active styling appears when current path is `/dashboard`.
- Existing employee sidebar items still work.
