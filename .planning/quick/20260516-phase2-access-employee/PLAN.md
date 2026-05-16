# Phase 2: Access & Employee Lifecycle

## Description
Phase 2 success criteria were already fully implemented. Minor fixes needed.

## Success Criteria
1. Admin/HR can log in with pre-created account — ✅ already works
2. Employee can log in with Admin/HR-created account — ✅ already works
3. Admin/HR can create, edit, and deactivate employees — ✅ already works
4. Inactive employees cannot create new absence changes — ✅ already works via `isActive` check in login

## Tasks
- [x] **A. Add isActive to UsersController.getAll response** — UI needs real status
- [x] **B. Update api.ts usersApi.getAll type** — include isActive
- [x] **C. Update employees page** — use real isActive from API
- [x] **D. Fix app/api/holidays/[id]/route.ts** — pre-existing params pattern bug