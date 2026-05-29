# Department & Employee Department Assignment Design Spec

> **Date:** 2026-05-29

## Goal

Thêm tính năng CRUD phòng ban và gắn nhân viên vào phòng ban trong hệ thống BaoCom.

## Problem

Hiện tại hệ thống không có khái niệm phòng ban. Tất cả nhân viên được quản lý chung mà không phân biệt bộ phận.

## Solution

### 1. Database Schema

**New Department Model:**
```prisma
model Department {
  id          String @id @default(cuid())
  name        String
  description String?
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Updated User Model:**
```prisma
model User {
  // ... existing fields
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
}
```

Relationship: User belongsTo Department (1:1, optional)

### 2. API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/departments | List all departments |
| POST | /api/departments | Create department |
| PATCH | /api/departments/[id] | Update department |
| DELETE | /api/departments/[id] | Delete department |

### 3. Frontend Pages

**Admin Departments Page:** `/admin/departments/page.tsx`
- List all departments with search
- Add/Edit/Delete department modals
- Show employee count per department

**Employee Management Enhancement:**
- Employee list shows department name
- Employee edit modal has department dropdown

### 4. Architecture

```
app/admin/departments/page.tsx
  └── DepartmentController (src/controllers/DepartmentController.ts)
        └── DepartmentService (src/services/DepartmentService.ts)
              └── DepartmentRepository (src/repositories/DepartmentRepository.ts)
                    └── Prisma (SQLite)

app/admin/employees/page.tsx (enhanced)
  └── Added departmentId to employee form
```

### 5. Components

| Component | Responsibility |
|-----------|----------------|
| `app/admin/departments/page.tsx` | Department list + CRUD modals |
| `src/controllers/DepartmentController.ts` | Handle API requests |
| `src/services/DepartmentService.ts` | Business logic |
| `src/repositories/DepartmentRepository.ts` | Data access |
| `src/dto/DepartmentDTO.ts` | Data transfer objects |

### 6. Data Flow

```
Admin → /admin/departments → list departments
Admin → Add/Edit/Delete → API /departments → DB
Admin → View employee → sees department
Admin → Edit employee → can change department
```

### 7. Validation Rules

- Department name: required, max 100 chars
- Delete department: blocked if employees exist in that department
- Delete department: blocked if is sole admin

## Files to Create/Modify

### New Files
- `prisma/migrations/[timestamp]_add_department_model/migration.sql`
- `src/repositories/DepartmentRepository.ts`
- `src/services/DepartmentService.ts`
- `src/controllers/DepartmentController.ts`
- `src/dto/DepartmentDTO.ts`
- `app/api/departments/route.ts`
- `app/api/departments/[id]/route.ts`
- `app/admin/departments/page.tsx`

### Modified Files
- `prisma/schema.prisma` - Add Department model, add departmentId to User
- `app/admin/employees/page.tsx` - Add department column and filter

## Testing Checklist

- [ ] Create department → appears in list
- [ ] Edit department → name updated
- [ ] Delete department → removed from list (if no employees)
- [ ] Delete department → error if employees exist
- [ ] View employee → sees department name
- [ ] Edit employee → can change department
- [ ] Filter employees by department

## Status: Approved