# Personnel CRUD with Department Assignment - Implementation Plan

> **For agentian workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all CRUD operations for personnel to support department assignment. Frontend already sends departmentId but backend doesn't process it.

**Architecture:** Add departmentId to DTOs, update Service layer to handle departmentId, update Repository to include department relation, update Controller to return department info.

**Tech Stack:** TypeScript, Prisma ORM, Next.js API Routes

---

## Files to Modify

| File | Responsibility |
|------|---------------|
| `src/dto/UserDTO.ts` | Add departmentId to CreateUserDTO, UpdateUserDTO, UserResponseDTO |
| `src/services/UserService.ts` | Handle departmentId in create() and update() |
| `src/repositories/UserRepository.ts` | Include department relation in queries |
| `src/controllers/UsersController.ts` | Return departmentId in API responses |
| `src/lib/api.ts` | Update types to include departmentId |

---

## Task 1: Update DTOs to Include departmentId

**Files:**
- Modify: `src/dto/UserDTO.ts:1-22`

- [ ] **Step 1: Read current DTO file**

```typescript
// src/dto/UserDTO.ts
export interface CreateUserDTO {
  username?: string
  password?: string
  name: string
  role?: 'admin' | 'employee'
}

export interface UpdateUserDTO {
  name?: string
  password?: string
  role?: 'admin' | 'employee'
  isActive?: boolean
}

export interface UserResponseDTO {
  id: string
  username: string
  name: string
  role: string
  isActive: boolean
  createdAt: Date
}
```

- [ ] **Step 2: Edit UserDTO.ts - Add departmentId to CreateUserDTO**

```typescript
export interface CreateUserDTO {
  username?: string
  password?: string
  name: string
  role?: 'admin' | 'employee'
  departmentId?: string  // ADD THIS
}
```

- [ ] **Step 3: Edit UserDTO.ts - Add departmentId to UpdateUserDTO**

```typescript
export interface UpdateUserDTO {
  name?: string
  password?: string
  role?: 'admin' | 'employee'
  isActive?: boolean
  departmentId?: string | null  // ADD THIS (null to remove assignment)
}
```

- [ ] **Step 4: Edit UserDTO.ts - Add departmentId to UserResponseDTO**

```typescript
export interface UserResponseDTO {
  id: string
  username: string
  name: string
  role: string
  isActive: boolean
  createdAt: Date
  departmentId: string | null  // ADD THIS
}
```

- [ ] **Step 5: Commit**

```bash
git add src/dto/UserDTO.ts
git commit -m "feat: add departmentId to User DTOs"
```

---

## Task 2: Update UserRepository to Include Department Relation

**Files:**
- Modify: `src/repositories/UserRepository.ts:14-20`

- [ ] **Step 1: Read current Repository file**

```typescript
// src/repositories/UserRepository.ts
async findAll(where?: Prisma.UserWhereInput): Promise<User[]> {
  return this.prisma.user.findMany({ where })
}

async findOne(id: string): Promise<User | null> {
  return this.prisma.user.findUnique({ where: { id } })
}
```

- [ ] **Step 2: Edit UserRepository.ts - Update findAll to include department**

```typescript
async findAll(where?: Prisma.UserWhereInput): Promise<User[]> {
  return this.prisma.user.findMany({
    where,
    include: {
      department: true  // ADD THIS - include department relation
    }
  })
}
```

- [ ] **Step 3: Edit UserRepository.ts - Update findOne to include department**

```typescript
async findOne(id: string): Promise<User | null> {
  return this.prisma.user.findUnique({
    where: { id },
    include: {
      department: true  // ADD THIS
    }
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/repositories/UserRepository.ts
git commit -m "feat: include department relation in UserRepository queries"
```

---

## Task 3: Update UserService to Handle departmentId

**Files:**
- Modify: `src/services/UserService.ts:49-54` (create) and `src/services/UserService.ts:72-85` (update)

- [ ] **Step 1: Read current Service file**

```typescript
// UserService.create() - lines 49-54
const user = await this.userRepository.create({
  username,
  password: hashedPassword,
  name: data.name,
  role: data.role || 'employee'
})
```

- [ ] **Step 2: Edit UserService.ts - Update create() to handle departmentId**

```typescript
const user = await this.userRepository.create({
  username,
  password: hashedPassword,
  name: data.name,
  role: data.role || 'employee',
  departmentId: data.departmentId  // ADD THIS
})
```

- [ ] **Step 3: Edit UserService.ts - Update create() result mapping to include departmentId**

```typescript
return {
  user: {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    departmentId: user.departmentId  // ADD THIS
  },
  credentials: {
    username: user.username,
    password
  }
}
```

- [ ] **Step 4: Read update() method**

```typescript
// UserService.update() - lines 72-85
async update(id: string, data: UpdateUserDTO) {
  if (data.role && !['admin', 'employee'].includes(data.role)) {
    throw new Error('Invalid role: must be "admin" or "employee"')
  }

  const updateData: Record<string, unknown> = {}
  if (data.name) updateData.name = data.name
  if (data.role) updateData.role = data.role
  if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
  if (data.password) updateData.password = await hashPassword(data.password)

  return this.userRepository.update(id, updateData)
}
```

- [ ] **Step 5: Edit UserService.ts - Update update() to handle departmentId**

```typescript
async update(id: string, data: UpdateUserDTO) {
  if (data.role && !['admin', 'employee'].includes(data.role)) {
    throw new Error('Invalid role: must be "admin" or "employee"')
  }

  const updateData: Record<string, unknown> = {}
  if (data.name) updateData.name = data.name
  if (data.role) updateData.role = data.role
  if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
  if (data.password) updateData.password = await hashPassword(data.password)
  if (data.departmentId !== undefined) updateData.departmentId = data.departmentId  // ADD THIS (null allowed)

  return this.userRepository.update(id, updateData)
}
```

- [ ] **Step 6: Commit**

```bash
git add src/services/UserService.ts
git commit -m "feat: handle departmentId in UserService create and update"
```

---

## Task 4: Update UsersController to Return departmentId

**Files:**
- Modify: `src/controllers/UsersController.ts:12-23` (getAll) and `:26-40` (getOne) and `:77-90` (update)

- [ ] **Step 1: Read current Controller getAll()**

```typescript
// UsersController.getAll() - lines 12-23
async getAll() {
  const users = await this.userService.findAll()
  return NextResponse.json({
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt
    }))
  })
}
```

- [ ] **Step 2: Edit UsersController.ts - Update getAll() to return departmentId**

```typescript
async getAll() {
  const users = await this.userService.findAll()
  return NextResponse.json({
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      departmentId: u.departmentId  // ADD THIS
    }))
  })
}
```

- [ ] **Step 3: Edit UsersController.ts - Update getOne() to return departmentId**

```typescript
async getOne(id: string) {
  const user = await this.userService.findOne(id)
  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      departmentId: user.departmentId  // ADD THIS
    }
  })
}
```

- [ ] **Step 4: Read update() method**

```typescript
// UsersController.update() - lines 77-90
async update(id: string, body: UpdateUserDTO) {
  try {
    const user = await this.userService.update(id, body)
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
```

- [ ] **Step 5: Edit UsersController.ts - Update update() to return departmentId**

```typescript
async update(id: string, body: UpdateUserDTO) {
  try {
    const user = await this.userService.update(id, body)
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId  // ADD THIS
      }
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/controllers/UsersController.ts
git commit -m "feat: return departmentId in UsersController responses"
```

---

## Task 5: Update API Client Types

**Files:**
- Modify: `src/lib/api.ts:112-148`

- [ ] **Step 1: Read current usersApi definitions**

```typescript
// src/lib/api.ts - usersApi
export const usersApi = {
  getAll: () => apiFetch<{ users: Array<{
    id: string;
    username: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }> }>('/users'),

  getOne: (id: string) => apiFetch<{ user: {
    id: string;
    username: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  } }>(`/users/${id}`),

  create: (data: { name: string }) =>
    apiFetch<{
      user: { id: string; username: string; name: string; role: string };
      credentials: { username: string; password: string }
    }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; password?: string }) =>
    apiFetch<{ user: { id: string; username: string; name: string; role: string } }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
```

- [ ] **Step 2: Edit api.ts - Update getAll response type**

```typescript
getAll: () => apiFetch<{ users: Array<{
    id: string;
    username: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    departmentId: string | null;  // ADD THIS
  }> }>('/users'),
```

- [ ] **Step 3: Edit api.ts - Update getOne response type**

```typescript
getOne: (id: string) => apiFetch<{ user: {
    id: string;
    username: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    departmentId: string | null;  // ADD THIS
  } }>(`/users/${id}`),
```

- [ ] **Step 4: Edit api.ts - Update create request and response types**

```typescript
create: (data: { name: string; departmentId?: string }) =>
    apiFetch<{
      user: { id: string; username: string; name: string; role: string; departmentId: string | null };
      credentials: { username: string; password: string }
    }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
```

- [ ] **Step 5: Edit api.ts - Update update request and response types**

```typescript
update: (id: string, data: { name?: string; password?: string; departmentId?: string | null }) =>
    apiFetch<{ user: { id: string; username: string; name: string; role: string; departmentId: string | null } }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: update usersApi types to include departmentId"
```

---

## Verification

After all tasks complete, verify the fix by testing:

1. **Create with department**: POST /api/users with `{ name: "Test", departmentId: "dept_id" }` should create user with department
2. **Read shows department**: GET /api/users should return `departmentId` in each user object
3. **Update department**: PATCH /api/users/:id with `{ departmentId: "new_dept_id" }` should update department
4. **Frontend works**: Employees page should show department names and allow changing departments

---

## Summary

| Task | File | Change |
|------|------|--------|
| 1 | UserDTO.ts | Add departmentId to CreateUserDTO, UpdateUserDTO, UserResponseDTO |
| 2 | UserRepository.ts | Include department in findAll and findOne |
| 3 | UserService.ts | Handle departmentId in create() and update() |
| 4 | UsersController.ts | Return departmentId in getAll, getOne, update |
| 5 | api.ts | Update types to include departmentId |
