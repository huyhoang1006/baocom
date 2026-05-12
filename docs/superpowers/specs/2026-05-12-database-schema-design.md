# Database Schema Design — BaoCom Meal Booking App

**Date:** 2026-05-12  
**Status:** Approved  
**Stack:** Prisma ORM + SQLite

---

## Overview

A meal booking application where employees register for daily lunch and admins manage the system. Key flows:

- Employee: view weekly menu, register eat/not eat by day
- Admin: manage employees, manage menu, view daily stats, export reports
- Admin adds notes when employee reports long-term absence directly

---

## Schema

### 1. User

Authentication and user management.

```prisma
model User {
  id        String @id @default(cuid())
  username  String @unique
  password  String // bcrypt hash
  name      String
  role      String @default("employee") // "admin" | "employee"
  isActive  Boolean @default(true)
  
  registrations Registration[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

| Field | Type | Notes |
|-------|------|-------|
| username | String | Unique, used for login |
| password | String | bcrypt hashed |
| name | String | Display name |
| role | String | "admin" or "employee" |
| isActive | Boolean | Soft delete (inactive = deleted employee) |

---

### 2. Meal

Single dish items that compose daily menus.

```prisma
model Meal {
  id        String @id @default(cuid())
  name      String
  type      String // "main" | "vegetable" | "dessert"
  isActive  Boolean @default(true)
  
  dailyMenus DailyMenuMeal[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

| Field | Type | Notes |
|-------|------|-------|
| name | String | "Thịt kho tàu", "Cải xào" |
| type | String | "main" \| "vegetable" \| "dessert" |
| isActive | Boolean | Soft delete |

---

### 3. DailyMenu + DailyMenuMeal

Weekly menu per date. A daily menu contains multiple meals.

```prisma
model DailyMenu {
  id      String @id @default(cuid())
  date    DateTime @unique
  
  meals   DailyMenuMeal[]
  
  createdAt DateTime @default(now())
}

model DailyMenuMeal {
  id          String @id @default(cuid())
  dailyMenuId String
  mealId      String
  sortOrder   Int @default(0)
  
  dailyMenu   DailyMenu @relation(fields: [dailyMenuId], references: [id])
  meal        Meal @relation(fields: [mealId], references: [id])
  
  @@unique([dailyMenuId, mealId])
}
```

| Field | Type | Notes |
|-------|------|-------|
| DailyMenu.date | DateTime | Unique per day |
| DailyMenuMeal.sortOrder | Int | Order of meals in daily menu |

---

### 4. Registration

Employee's daily eat/not-eat registration.

```prisma
model Registration {
  id       String @id @default(cuid())
  userId   String
  date     DateTime
  status   String // "eating" | "not_eating"
  note     String? // admin writes when employee reports directly
  
  user     User @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, date])
}
```

| Field | Type | Notes |
|-------|------|-------|
| userId | String | FK to User |
| date | DateTime | Date of registration |
| status | String | "eating" \| "not_eating" |
| note | String? | Admin records when employee reports long-term absence |

**Business Rules:**
- One registration per user per date (`@@unique([userId, date])`)
- Default status is "not_eating" (employee must actively register to eat)
- `note` field is set by admin, not employee

---

### 5. Holiday

Company holidays when no meals are served.

```prisma
model Holiday {
  id          String @id @default(cuid())
  date        DateTime @unique
  description String?
  isActive    Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

| Field | Type | Notes |
|-------|------|-------|
| date | DateTime | Unique holiday date |
| description | String? | "Tết Nguyên Đán", "Ngày nghỉ bù" |

---

## ER Diagram

```
User (1) ─────── (N) Registration
                      │
                      └── date, status, note

Meal (1) ─────── (N) DailyMenuMeal ─────── (1) DailyMenu
      │                                        │
      └── type: main/vegetable/dessert         └── date

Holiday ─── company-wide no-cooking days
```

---

## Screen-to-Table Mapping

| Screen | Tables Used |
|--------|-------------|
| Login | `User(username, password)` |
| Employee Dashboard | `DailyMenu → DailyMenuMeal → Meal` |
| Employee Book | `Registration`, `Holiday` (holidays show as "not_eating") |
| Employee My History | `Registration` |
| Admin Dashboard | `Registration` (aggregate today), `User` (count) |
| Admin Employees | `User` (CRUD) |
| Admin Reports | `Registration` + `User` → Excel export |

---

## Implementation Notes

### Password Hashing
```typescript
import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash(password, 12)
```

### Query: Today's Stats
```prisma
const today = new Date()
today.setHours(0, 0, 0, 0)

const registrations = await prisma.registration.findMany({
  where: { date: today }
})
const eating = registrations.filter(r => r.status === 'eating').length
const notEating = registrations.filter(r => r.status === 'not_eating').length
```

### Query: Employee's Calendar Month
```prisma
const startOfMonth = new Date(year, month, 1)
const endOfMonth = new Date(year, month + 1, 0)

const registrations = await prisma.registration.findMany({
  where: {
    userId: userId,
    date: { gte: startOfMonth, lte: endOfMonth }
  }
})
```

### Query: Weekly Menu
```prisma
const startOfWeek = new Date()
startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)

const menus = await prisma.dailyMenu.findMany({
  where: { date: { gte: startOfWeek } },
  include: {
    meals: {
      include: { meal: true },
      orderBy: { sortOrder: 'asc' }
    }
  },
  orderBy: { date: 'asc' },
  take: 5
})
```

### Query: Report Data (for Excel)
```prisma
const registrations = await prisma.registration.findMany({
  where: {
    date: { gte: startDate, lte: endDate },
    status: 'eating'
  },
  include: { user: true },
  orderBy: { date: 'asc' }
})
// Transform to: STT, Name, Phone, Date
```

---

## Open Questions — Resolved

| Question | Decision |
|----------|----------|
| Auth type | Real auth with bcrypt + JWT |
| Meals management | Admin CRUD, employee view-only |
| Payment | Not needed (registration only) |
| Department | Not needed |
| Holiday management | Admin CRUD, affects employee view |
| Note field | Admin writes, not employee (for long-term absence reports) |

---

## Next Step

Create Prisma schema file (`prisma/schema.prisma`) and run migration.
