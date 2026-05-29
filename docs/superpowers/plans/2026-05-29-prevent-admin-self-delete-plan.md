# Prevent Admin Self-Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ngăn admin tự xóa chính mình bằng cách: (1) Ẩn admin khỏi danh sách, (2) thêm API validation

**Architecture:** Thêm filter frontend + validation API tại DELETE endpoint

**Tech Stack:** Next.js, React, TypeScript

---

## Task 1: Ẩn Tài Khoản Admin Khỏi Danh Sách (Frontend)

**Files:**
- Modify: `app/admin/employees/page.tsx:61-67`

- [ ] **Step 1: Đọc context around line 61**

```typescript
// Tìm đoạn code:
const data = await usersApi.getAll()
setEmployees(data.users.map(u => ({...})))
```

- [ ] **Step 2: Thêm filter role !== 'admin'**

Thay đổi:
```typescript
setEmployees(data.users
  .filter(u => u.role !== 'admin')  // ← Ẩn tài khoản admin
  .map(u => ({
    id: u.id,
    name: u.name,
    username: u.username,
    status: u.isActive ? "active" as const : "inactive" as const,
    createdAt: u.createdAt,
  })))
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/employees/page.tsx
git commit -m "fix: hide admin accounts from employees list"
```

---

## Task 2: Ngăn Xóa Chính Mình (Backend API)

**Files:**
- Modify: `app/api/users/[id]/route.ts:40-54`

- [ ] **Step 1: Đọc DELETE handler hiện tại**

```typescript
export const DELETE = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  // Get user info before deletion for audit log
  const targetUser = await userService.findOne(id)
  const result = await controller.delete(id)
  // ... audit log
})
```

- [ ] **Step 2: Thêm validation ngăn xóa chính mình**

```typescript
export const DELETE = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params

  // Ngăn admin tự xóa chính mình
  if (id === userId) {
    return NextResponse.json(
      { error: 'Không thể xóa tài khoản của chính bạn' },
      { status: 400 }
    )
  }

  // Get user info before deletion for audit log
  const targetUser = await userService.findOne(id)
  const result = await controller.delete(id)

  await auditService.log({
    action: 'USER_DELETED',
    entityType: 'user',
    entityId: id,
    performedBy: userId,
    details: `User deleted: ${targetUser?.name || id}`
  })

  return result
})
```

- [ ] **Step 3: Commit**

```bash
git add app/api/users/[id]/route.ts
git commit -m "fix: prevent admin from deleting own account"
```

---

## Execution Options

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**