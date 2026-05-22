# Admin Employee Credentials Management - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cải thiện trang Nhân Sự admin: tạo nhân viên chỉ cần nhập họ tên, xem danh sách dạng bảng, xem credentials

**Architecture:** Backend cung cấp API tạo user với auto-generate username/password. Frontend hiển thị table layout với modal chi tiết.

**Tech Stack:** Next.js (App Router), Prisma, TypeScript, React

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/dto/UserDTO.ts` | DTO types cho user creation |
| `src/lib/utils.ts` | Utility functions (generateUsername, generatePassword) |
| `src/repositories/UserRepository.ts` | Check trùng username, findByUsername pattern |
| `src/services/UserService.ts` | Business logic, gọi repo |
| `src/controllers/UsersController.ts` | HTTP handlers, API response |
| `app/api/users/route.ts` | POST /api/users endpoint |
| `app/api/users/[id]/route.ts` | GET /api/users/:id endpoint |
| `src/lib/api.ts` | Frontend API client |
| `app/admin/employees/page.tsx` | Main page với table layout |

---

## Backend Changes

### Task 1: Add Utility Functions

**Files:**
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Tạo file utils.ts với generateUsername và generatePassword**

```typescript
// src/lib/utils.ts

/**
 * Generate username từ họ tên
 * VD: "Phạm Xuân Hùng" → "hungpx"
 *     "Nguyễn Văn A" → "anv"
 */
export function generateUsername(name: string): string {
  const parts = name.trim().split(/\s+/)
  
  // Lấy tên (từ cuối cùng), bỏ dấu
  const lastName = parts[parts.length - 1]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
  
  // Lấy chữ cái đầu của các từ còn lại (họ + đệm), bỏ dấu
  const initials = parts.slice(0, -1)
    .map(p => p[0])
    .join('')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  
  return lastName + initials
}

/**
 * Generate random password
 * VD: "aB3xK9m2"
 */
export function generatePassword(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Tạo username với suffix nếu trùng
 * VD: "hungpx" → "hungpx2" → "hungpx3"
 */
export function generateUniqueUsername(baseUsername: string, existingUsernames: string[]): string {
  if (!existingUsernames.includes(baseUsername)) {
    return baseUsername
  }
  
  let counter = 2
  while (existingUsernames.includes(`${baseUsername}${counter}`)) {
    counter++
  }
  return `${baseUsername}${counter}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add username/password generation utilities"
```

---

### Task 2: Update UserDTO

**Files:**
- Modify: `src/dto/UserDTO.ts`

- [ ] **Step 1: Đọc file hiện tại**

```bash
cat src/dto/UserDTO.ts
```

- [ ] **Step 2: Update DTO thêm phone, email, department**

```typescript
// src/dto/UserDTO.ts

export interface CreateUserDTO {
  username?: string  // Optional - auto-generated if not provided
  password?: string  // Optional - auto-generated if not provided
  name: string
  role?: string
  phone?: string
  email?: string
  department?: string
}

export interface UpdateUserDTO {
  name?: string
  password?: string
  role?: string
  isActive?: boolean
  phone?: string
  email?: string
  department?: string
}

export interface UserResponseDTO {
  id: string
  username: string
  name: string
  role: string
  isActive: boolean
  createdAt: Date
  phone?: string
  email?: string
  department?: string
}
```

- [ ] **Step 3: Commit**

```bash
git add src/dto/UserDTO.ts
git commit -m "feat: add phone/email/department fields to UserDTO"
```

---

### Task 3: Update UserRepository

**Files:**
- Modify: `src/repositories/UserRepository.ts`

- [ ] **Step 1: Đọc file hiện tại**

```bash
cat src/repositories/UserRepository.ts
```

- [ ] **Step 2: Thêm method findByUsernamePattern (tìm tất cả username bắt đầu với pattern)**

```typescript
// Thêm vào class UserRepository

async findByUsernamePattern(pattern: string): Promise<string[]> {
  const users = await this.prisma.user.findMany({
    where: {
      username: {
        startsWith: pattern
      }
    },
    select: { username: true }
  })
  return users.map(u => u.username)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/repositories/UserRepository.ts
git commit -m "feat: add findByUsernamePattern to UserRepository"
```

---

### Task 4: Update UserService

**Files:**
- Modify: `src/services/UserService.ts`

- [ ] **Step 1: Đọc file hiện tại**

```bash
cat src/services/UserService.ts
```

- [ ] **Step 2: Update create method với auto-gen username/password**

```typescript
// src/services/UserService.ts

import { prisma } from '@/lib/prisma'
import { UserRepository } from '@/repositories/UserRepository'
import { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from '@/dto/UserDTO'
import { hashPassword } from '@/lib/auth'
import { generateUsername, generatePassword, generateUniqueUsername } from '@/lib/utils'

export interface CreateUserResult {
  user: UserResponseDTO
  credentials: {
    username: string
    password: string
  }
}

export class UserService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository(prisma)
  }

  async findAll() {
    return this.userRepository.findAll({ isActive: true })
  }

  async findOne(id: string) {
    return this.userRepository.findOne(id)
  }

  async create(data: CreateUserDTO): Promise<CreateUserResult> {
    // Generate username nếu không provided
    let username = data.username
    if (!username) {
      const baseUsername = generateUsername(data.name)
      const existingUsernames = await this.userRepository.findByUsernamePattern(baseUsername)
      username = generateUniqueUsername(baseUsername, existingUsernames)
    } else {
      // Check trùng nếu provided
      const existing = await this.userRepository.findByUsername(username)
      if (existing) {
        throw new Error('Username already exists')
      }
    }

    // Generate password nếu không provided
    const password = data.password || generatePassword()

    const hashedPassword = await hashPassword(password)
    
    const user = await this.userRepository.create({
      username,
      password: hashedPassword,
      name: data.name,
      role: data.role || 'employee',
      phone: data.phone,
      email: data.email,
      department: data.department
    })

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        phone: user.phone,
        email: user.email,
        department: user.department
      },
      credentials: {
        username: user.username,
        password // Plain text - chỉ trả về khi tạo
      }
    }
  }

  async update(id: string, data: UpdateUserDTO) {
    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name
    if (data.role) updateData.role = data.role
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
    if (data.password) updateData.password = await hashPassword(data.password)
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.email !== undefined) updateData.email = data.email
    if (data.department !== undefined) updateData.department = data.department

    return this.userRepository.update(id, updateData)
  }

  async delete(id: string) {
    return this.userRepository.delete(id)
  }

  async count() {
    return this.userRepository.count({ role: 'employee', isActive: true })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/UserService.ts
git commit -m "feat: implement auto-gen username/password in UserService"
```

---

### Task 5: Update UsersController

**Files:**
- Modify: `src/controllers/UsersController.ts`

- [ ] **Step 1: Đọc file hiện tại**

```bash
cat src/controllers/UsersController.ts
```

- [ ] **Step 2: Update create method return credentials**

```typescript
// src/controllers/UsersController.ts

import { NextRequest, NextResponse } from 'next/server'
import { UserService, CreateUserResult } from '@/services/UserService'
import { CreateUserDTO, UpdateUserDTO } from '@/dto/UserDTO'

export class UsersController {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

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
        phone: u.phone,
        email: u.email,
        department: u.department
      }))
    })
  }

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
        phone: user.phone,
        email: user.email,
        department: user.department
      }
    })
  }

  async create(req: NextRequest) {
    let body: CreateUserDTO
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
    }

    try {
      const result: CreateUserResult = await this.userService.create(body)
      return NextResponse.json(result, { status: 201 })
    } catch (error) {
      if (error instanceof Error && error.message === 'Username already exists') {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
      }
      throw error
    }
  }

  async update(id: string, req: NextRequest) {
    let body: UpdateUserDTO
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    try {
      const user = await this.userService.update(id, body)
      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          phone: user.phone,
          email: user.email,
          department: user.department
        }
      })
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  async delete(id: string) {
    await this.userService.delete(id)
    return NextResponse.json({ success: true })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/UsersController.ts
git commit -m "feat: return credentials when creating user"
```

---

### Task 6: Verify Backend Build

**Files:**
- None (verification only)

- [ ] **Step 1: Run build để verify**

```bash
cd C:/Users/ADMIN/Downloads/temp_v9/baocom && npm run build 2>&1 | tail -40
```

Expected: Build successful, không có TypeScript errors

- [ ] **Step 2: Commit nếu có changes**

```bash
git status
git add -A
git commit -m "chore: verify backend build passes"
```

---

## Frontend Changes

### Task 7: Update API Client

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Đọc phần usersApi hiện tại**

```bash
grep -A 15 "export const usersApi" src/lib/api.ts
```

- [ ] **Step 2: Update usersApi với credentials response**

```typescript
// Thay thế phần usersApi trong src/lib/api.ts

// Users API (Admin)
export const usersApi = {
  getAll: () => apiFetch<{ users: Array<{ 
    id: string; 
    username: string; 
    name: string; 
    role: string; 
    isActive: boolean; 
    createdAt: string;
    phone?: string;
    email?: string;
    department?: string;
  }> }>('/users'),
  
  getOne: (id: string) => apiFetch<{ user: { 
    id: string; 
    username: string; 
    name: string; 
    role: string; 
    isActive: boolean; 
    createdAt: string;
    phone?: string;
    email?: string;
    department?: string;
  } }>(`/users/${id}`),
  
  create: (data: { name: string; phone?: string; email?: string; department?: string }) =>
    apiFetch<{ 
      user: { id: string; username: string; name: string; role: string }; 
      credentials: { username: string; password: string }
    }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  update: (id: string, data: { name?: string; role?: string; isActive?: boolean; phone?: string; email?: string; department?: string }) =>
    apiFetch<{ user: { id: string; username: string; name: string; role: string } }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: update usersApi with full user fields"
```

---

### Task 8: Rewrite Employees Page with Table Layout

**Files:**
- Modify: `app/admin/employees/page.tsx`

- [ ] **Step 1: Tham khảo spec và viết lại page**

Cần implement:
1. Table layout thay vì card list
2. Modal thêm nhân viên với auto-gen username preview
3. Modal chi tiết nhân viên với credentials (toggle password)

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/employees/page.tsx
git commit -m "feat: rewrite employees page with table layout and credentials modal"
```

---

## Verification

### Task 9: Manual Testing

- [ ] **Step 1: Test tạo nhân viên mới**
  - URL: http://localhost:3000/admin/employees
  - Click "Thêm nhân viên"
  - Nhập "Phạm Xuân Hùng"
  - Xem preview username: "hungpx"
  - Submit → xem notification thành công

- [ ] **Step 2: Test xem credentials**
  - Click vào row nhân viên vừa tạo
  - Modal chi tiết hiện ra
  - Click toggle hiện password → xem password

- [ ] **Step 3: Test trùng username**
  - Tạo thêm "Phạm Xuân Hùng" lần nữa
  - Username phải là "hungpx2"

---

## Summary

| Task | Status |
|------|--------|
| 1. Add Utility Functions | ⬜ |
| 2. Update UserDTO | ⬜ |
| 3. Update UserRepository | ⬜ |
| 4. Update UserService | ⬜ |
| 5. Update UsersController | ⬜ |
| 6. Verify Backend Build | ⬜ |
| 7. Update API Client | ⬜ |
| 8. Rewrite Employees Page | ⬜ |
| 9. Manual Testing | ⬜ |