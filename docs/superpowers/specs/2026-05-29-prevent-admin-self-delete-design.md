# Prevent Admin Self-Delete - Design Spec

> **Date:** 2026-05-29

## Goal

Ngăn admin tự xóa chính mình hoặc xóa tài khoản admin khác trong trang Nhân Sự bằng cách:
1. Ẩn tài khoản admin khỏi danh sách hiển thị
2. Thêm validation tại API để ngăn xóa chính mình

## Problem

Trang /admin/employees hiện tại hiển thị tất cả users bao gồm cả admin. Admin có thể:
- Nhìn thấy tài khoản admin khác
- Xóa chính mình (vô tình hoặc cố ý)
- Xóa admin khác nếu có

Điều này có thể dẫn đến mất quyền truy cập hệ thống.

## Solution

### 1. Frontend - Ẩn Admin Khỏi Danh Sách

**File:** `app/admin/employees/page.tsx`

**Change:** Filter out admin users khi load danh sách

```typescript
// Line 61-67: filter out admin before setting state
const data = await usersApi.getAll()
setEmployees(data.users
  .filter(u => u.role !== 'admin')  // ← Ẩn tài khoản admin
  .map(u => ({...})))
```

**Result:** Admin chỉ thấy danh sách employee, không thấy bất kỳ admin nào.

### 2. Backend - Ngăn Xóa Chính Mình

**File:** `app/api/users/[id]/route.ts`

**Change:** Thêm validation tại DELETE handler

```typescript
export const DELETE = withAdmin(async (req, userId, role, context) => {
  const { id } = await context.params

  // Ngăn admin tự xóa chính mình
  if (id === userId) {
    return NextResponse.json(
      { error: 'Không thể xóa tài khoản của chính bạn' },
      { status: 400 }
    )
  }

  // ... existing code
})
```

**Result:** Nếu có bug hay request bypass frontend filter, API vẫn reject.

## Files to Modify

| File | Change |
|------|--------|
| `app/admin/employees/page.tsx` | Filter `role !== 'admin'` khi load users |
| `app/api/users/[id]/route.ts` | Add `id === userId` validation |

## Testing Checklist

- [ ] Truy cập /admin/employees → không thấy tài khoản admin nào
- [ ] Gọi API DELETE /api/users/[current-admin-id] → return 400
- [ ] Gọi API DELETE /api/users/[employee-id] → return 200 (employee vẫn xóa được)