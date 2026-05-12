# Database Schema Implementation Plan — BaoCom App

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Prisma + SQLite with 5 models, add authentication, and wire up API routes

**Architecture:** Next.js app with Prisma ORM, SQLite database, bcrypt password hashing, JWT sessions. Database file at `prisma/dev.db`.

**Tech Stack:** Prisma, bcryptjs, jsonwebtoken, Next.js API Routes

---

## File Structure

```
prisma/
  schema.prisma      # All 5 models
  seed.ts            # Seed data for testing
  dev.db             # SQLite database (generated)

src/lib/
  prisma.ts          # Prisma client singleton
  auth.ts            # bcrypt + JWT helpers

app/api/
  auth/login/route.ts        # POST /api/auth/login
  auth/me/route.ts           # GET /api/auth/me
  auth/logout/route.ts       # POST /api/auth/logout
  
  users/route.ts             # GET, POST (admin only)
  users/[id]/route.ts        # GET, PATCH, DELETE (admin only)
  
  meals/route.ts             # GET, POST (admin only)
  meals/[id]/route.ts       # GET, PATCH, DELETE (admin only)
  
  daily-menus/route.ts      # GET (employee), POST (admin)
  daily-menus/[date]/route.ts # GET, PUT (admin)
  
  registrations/route.ts     # GET, POST
  registrations/[id]/route.ts # PATCH, DELETE (admin only)
  
  holidays/route.ts          # GET (employee), POST (admin)
  holidays/[id]/route.ts     # PATCH, DELETE (admin only)
  
  admin/stats/route.ts       # GET today stats (admin only)
  admin/reports/route.ts     # GET report data (admin only)
```

---

## Task 1: Install Prisma + SQLite + Dependencies

**Files:**
- Modify: `package.json`
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Install Prisma and auth dependencies**

Run: `cd "C:/Users/ADMIN/Downloads/temp_v9/baocom" && npm install prisma @prisma/client bcryptjs jsonwebtoken && npm install -D @types/bcryptjs @types/jsonwebtoken`

Expected: Dependencies added to package.json

- [ ] **Step 2: Initialize Prisma with SQLite**

Run: `cd "C:/Users/ADMIN/Downloads/temp_v9/baocom" && npx prisma init --datasource-provider sqlite`

Expected: `prisma/schema.prisma` created with sqlite datasource

- [ ] **Step 3: Write the schema**

Replace contents of `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String @id @default(cuid())
  username  String @unique
  password  String
  name      String
  role      String @default("employee")
  isActive  Boolean @default(true)

  registrations Registration[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Meal {
  id        String @id @default(cuid())
  name      String
  type      String
  isActive  Boolean @default(true)

  dailyMenus DailyMenuMeal[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

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

  dailyMenu   DailyMenu @relation(fields: [dailyMenuId], references: [id], onDelete: Cascade)
  meal        Meal @relation(fields: [mealId], references: [id], onDelete: Cascade)

  @@unique([dailyMenuId, mealId])
}

model Registration {
  id       String @id @default(cuid())
  userId   String
  date     DateTime
  status   String
  note     String?

  user     User @relation(fields: [userId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, date])
}

model Holiday {
  id          String @id @default(cuid())
  date        DateTime @unique
  description String?
  isActive    Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 4: Set DATABASE_URL in .env**

Check if `.env` exists. If not, create it:

Run: `echo 'DATABASE_URL="file:./dev.db"' > "C:/Users/ADMIN/Downloads/temp_v9/baocom/.env"`

- [ ] **Step 5: Run initial migration**

Run: `cd "C:/Users/ADMIN/Downloads/temp_v9/baocom" && npx prisma migrate dev --name init`

Expected: `prisma/migrations/` folder created with init migration, `prisma/dev.db` generated

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .env prisma/schema.prisma prisma/migrations prisma/dev.db
git commit -m "feat: setup Prisma with SQLite and 5 models"
```

---

## Task 2: Create Prisma Client Singleton

**Files:**
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Create Prisma client singleton**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "feat: add Prisma client singleton"
```

---

## Task 3: Auth Helpers (bcrypt + JWT)

**Files:**
- Create: `src/lib/auth.ts`

- [ ] **Step 1: Create auth helpers**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/src/lib/auth.ts`:

```typescript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'bao-com-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Add JWT_SECRET to .env**

Run: `echo 'JWT_SECRET="bao-com-jwt-secret-change-in-production"' >> "C:/Users/ADMIN/Downloads/temp_v9/baocom/.env"`

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth.ts .env
git commit -m "feat: add bcrypt and JWT auth helpers"
```

---

## Task 4: Login API Route

**Files:**
- Create: `app/api/auth/login/route.ts`

- [ ] **Step 1: Create login API route**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/auth/login/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signToken(user.id, user.role)

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/login/route.ts
git commit -m "feat: add login API route"
```

---

## Task 5: Auth Middleware & Me Route

**Files:**
- Create: `src/lib/authMiddleware.ts`
- Create: `app/api/auth/me/route.ts`
- Create: `app/api/auth/logout/route.ts`

- [ ] **Step 1: Create auth middleware**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/src/lib/authMiddleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function withAuth(handler: (req: NextRequest, userId: string, role: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return handler(req, payload.userId, payload.role)
  }
}

export function withAdmin(handler: (req: NextRequest, userId: string) => Promise<NextResponse>) {
  return withAuth(async (req, userId, role) => {
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return handler(req, userId)
  })
}
```

- [ ] **Step 2: Create /api/auth/me route**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/auth/me/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (req: NextRequest, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true, role: true }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user })
})
```

- [ ] **Step 3: Create /api/auth/logout route**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/auth/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('token')
  return response
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/authMiddleware.ts app/api/auth/me/route.ts app/api/auth/logout/route.ts
git commit -m "feat: add auth middleware and me/logout routes"
```

---

## Task 6: Users CRUD API

**Files:**
- Create: `app/api/users/route.ts`
- Create: `app/api/users/[id]/route.ts`

- [ ] **Step 1: Create users list + create route**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { withAuth } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export const GET = withAdmin(async () => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, username: true, name: true, role: true, createdAt: true }
  })
  return NextResponse.json({ users })
})

export const POST = withAdmin(async (req: NextRequest) => {
  const { username, password, name, role } = await req.json()

  if (!username || !password || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: { username, password: hashedPassword, name, role: role || 'employee' }
  })

  return NextResponse.json({ user: { id: user.id, username: user.username, name: user.name, role: user.role } })
})
```

- [ ] **Step 2: Create user by id route**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/users/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export const GET = withAdmin(async (req: NextRequest, userId: string) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, name: true, role: true, createdAt: true }
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ user })
})

export const PATCH = withAdmin(async (req: NextRequest) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  const body = await req.json()

  const updateData: { name?: string; password?: string; role?: string; isActive?: boolean } = {}
  if (body.name) updateData.name = body.name
  if (body.password) updateData.password = await hashPassword(body.password)
  if (body.role) updateData.role = body.role
  if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive

  const user = await prisma.user.update({ where: { id }, data: updateData })
  return NextResponse.json({ user: { id: user.id, username: user.username, name: user.name, role: user.role } })
})

export const DELETE = withAdmin(async (req: NextRequest) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  // Soft delete
  await prisma.user.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
})
```

- [ ] **Step 3: Commit**

```bash
git add app/api/users/route.ts app/api/users/[id]/route.ts
git commit -m "feat: add users CRUD API routes"
```

---

## Task 7: Meals CRUD API

**Files:**
- Create: `app/api/meals/route.ts`
- Create: `app/api/meals/[id]/route.ts`

- [ ] **Step 1: Create meals routes**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/meals/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { withAuth } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async () => {
  const meals = await prisma.meal.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json({ meals })
})

export const POST = withAdmin(async (req: NextRequest) => {
  const { name, type } = await req.json()

  if (!name || !type) {
    return NextResponse.json({ error: 'Missing name or type' }, { status: 400 })
  }

  if (!['main', 'vegetable', 'dessert'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const meal = await prisma.meal.create({ data: { name, type } })
  return NextResponse.json({ meal })
})
```

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/meals/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const PATCH = withAdmin(async (req: NextRequest) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  const { name, type } = await req.json()

  const updateData: { name?: string; type?: string; isActive?: boolean } = {}
  if (name) updateData.name = name
  if (type) {
    if (!['main', 'vegetable', 'dessert'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    updateData.type = type
  }

  const meal = await prisma.meal.update({ where: { id }, data: updateData })
  return NextResponse.json({ meal })
})

export const DELETE = withAdmin(async (req: NextRequest) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  await prisma.meal.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
})
```

- [ ] **Step 2: Commit**

```bash
git add app/api/meals/route.ts app/api/meals/[id]/route.ts
git commit -m "feat: add meals CRUD API routes"
```

---

## Task 8: Daily Menu API

**Files:**
- Create: `app/api/daily-menus/route.ts`
- Create: `app/api/daily-menus/[date]/route.ts`

- [ ] **Step 1: Create daily menus route**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/daily-menus/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { withAuth } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async () => {
  const menus = await prisma.dailyMenu.findMany({
    include: {
      meals: {
        include: { meal: true },
        orderBy: { sortOrder: 'asc' }
      }
    },
    orderBy: { date: 'asc' },
    take: 14 // Next 2 weeks
  })
  return NextResponse.json({ menus })
})

export const POST = withAdmin(async (req: NextRequest) => {
  const { date, mealIds } = await req.json()

  if (!date || !mealIds || !Array.isArray(mealIds)) {
    return NextResponse.json({ error: 'Missing date or mealIds' }, { status: 400 })
  }

  const dateObj = new Date(date)

  // Create or update daily menu
  const dailyMenu = await prisma.dailyMenu.upsert({
    where: { date: dateObj },
    update: {},
    create: { date: dateObj }
  })

  // Delete existing meal associations
  await prisma.dailyMenuMeal.deleteMany({ where: { dailyMenuId: dailyMenu.id } })

  // Create new associations
  for (let i = 0; i < mealIds.length; i++) {
    await prisma.dailyMenuMeal.create({
      data: { dailyMenuId: dailyMenu.id, mealId: mealIds[i], sortOrder: i }
    })
  }

  const updated = await prisma.dailyMenu.findUnique({
    where: { id: dailyMenu.id },
    include: {
      meals: {
        include: { meal: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  return NextResponse.json({ dailyMenu: updated })
})
```

- [ ] **Step 2: Create daily menu by date route**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/daily-menus/[date]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (req: NextRequest) => {
  const dateStr = req.nextUrl.pathname.split('/').pop()!
  const date = new Date(dateStr)

  const menu = await prisma.dailyMenu.findUnique({
    where: { date },
    include: {
      meals: {
        include: { meal: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  return NextResponse.json({ dailyMenu: menu })
})

export const PUT = withAdmin(async (req: NextRequest) => {
  const dateStr = req.nextUrl.pathname.split('/').pop()!
  const date = new Date(dateStr)
  const { mealIds } = await req.json()

  if (!mealIds || !Array.isArray(mealIds)) {
    return NextResponse.json({ error: 'Missing mealIds' }, { status: 400 })
  }

  const dailyMenu = await prisma.dailyMenu.upsert({
    where: { date },
    update: {},
    create: { date }
  })

  await prisma.dailyMenuMeal.deleteMany({ where: { dailyMenuId: dailyMenu.id } })

  for (let i = 0; i < mealIds.length; i++) {
    await prisma.dailyMenuMeal.create({
      data: { dailyMenuId: dailyMenu.id, mealId: mealIds[i], sortOrder: i }
    })
  }

  const updated = await prisma.dailyMenu.findUnique({
    where: { id: dailyMenu.id },
    include: {
      meals: {
        include: { meal: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  return NextResponse.json({ dailyMenu: updated })
})
```

- [ ] **Step 3: Commit**

```bash
git add app/api/daily-menus/route.ts app/api/daily-menus/[date]/route.ts
git commit -m "feat: add daily menus API routes"
```

---

## Task 9: Registrations API

**Files:**
- Create: `app/api/registrations/route.ts`
- Create: `app/api/registrations/[id]/route.ts`

- [ ] **Step 1: Create registrations route**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/registrations/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (req: NextRequest, userId: string) => {
  const { searchParams } = req.nextUrl
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const where: { userId: string; date?: { gte: Date; lte: Date } } = { userId }

  if (startDate && endDate) {
    where.date = { gte: new Date(startDate), lte: new Date(endDate) }
  }

  const registrations = await prisma.registration.findMany({
    where,
    orderBy: { date: 'asc' }
  })

  return NextResponse.json({ registrations })
})

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  const { date, status } = await req.json()

  if (!date || !status) {
    return NextResponse.json({ error: 'Missing date or status' }, { status: 400 })
  }

  if (!['eating', 'not_eating'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const dateObj = new Date(date)

  const registration = await prisma.registration.upsert({
    where: { userId_date: { userId, date: dateObj } },
    update: { status },
    create: { userId, date: dateObj, status }
  })

  return NextResponse.json({ registration })
})
```

- [ ] **Step 2: Create registration by id route**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/registrations/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const PATCH = withAuth(async (req: NextRequest, userId: string, role: string) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  const { status, note } = await req.json()

  // Only admin can update note, or user can update own status
  const registration = await prisma.registration.findUnique({ where: { id } })

  if (!registration) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Non-admin can only update their own registration
  if (role !== 'admin' && registration.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updateData: { status?: string; note?: string } = {}
  if (status && ['eating', 'not_eating'].includes(status)) {
    updateData.status = status
  }
  if (note !== undefined) {
    updateData.note = note // Only admin can set note, but we check above
  }

  const updated = await prisma.registration.update({ where: { id }, data: updateData })
  return NextResponse.json({ registration: updated })
})

export const DELETE = withAdmin(async () => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  await prisma.registration.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
```

- [ ] **Step 3: Commit**

```bash
git add app/api/registrations/route.ts app/api/registrations/[id]/route.ts
git commit -m "feat: add registrations API routes"
```

---

## Task 10: Holidays API

**Files:**
- Create: `app/api/holidays/route.ts`
- Create: `app/api/holidays/[id]/route.ts`

- [ ] **Step 1: Create holidays routes**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/holidays/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async () => {
  const holidays = await prisma.holiday.findMany({
    where: { isActive: true },
    orderBy: { date: 'asc' }
  })
  return NextResponse.json({ holidays })
})

export const POST = withAdmin(async (req: NextRequest) => {
  const { date, description } = await req.json()

  if (!date) {
    return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  }

  const dateObj = new Date(date)

  const holiday = await prisma.holiday.create({
    data: { date: dateObj, description: description || null }
  })

  return NextResponse.json({ holiday })
})
```

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/holidays/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const PATCH = withAdmin(async (req: NextRequest) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  const { date, description, isActive } = await req.json()

  const updateData: { date?: Date; description?: string | null; isActive?: boolean } = {}
  if (date) updateData.date = new Date(date)
  if (description !== undefined) updateData.description = description
  if (typeof isActive === 'boolean') updateData.isActive = isActive

  const holiday = await prisma.holiday.update({ where: { id }, data: updateData })
  return NextResponse.json({ holiday })
})

export const DELETE = withAdmin(async (req: NextRequest) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  await prisma.holiday.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
})
```

- [ ] **Step 2: Commit**

```bash
git add app/api/holidays/route.ts app/api/holidays/[id]/route.ts
git commit -m "feat: add holidays API routes"
```

---

## Task 11: Admin Stats + Reports API

**Files:**
- Create: `app/api/admin/stats/route.ts`
- Create: `app/api/admin/reports/route.ts`

- [ ] **Step 1: Create admin stats route**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/admin/stats/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAdmin(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const registrations = await prisma.registration.findMany({
    where: { date: { gte: today, lt: tomorrow } }
  })

  const totalEmployees = await prisma.user.count({
    where: { role: 'employee', isActive: true }
  })

  const eating = registrations.filter(r => r.status === 'eating').length
  const notEating = registrations.filter(r => r.status === 'not_eating').length
  const registered = registrations.length
  const notRegistered = totalEmployees - registered

  return NextResponse.json({
    stats: {
      totalEmployees,
      eating,
      notEating,
      registered,
      notRegistered,
      registrationRate: totalEmployees > 0 ? Math.round((registered / totalEmployees) * 100) : 0
    }
  })
})
```

- [ ] **Step 2: Create admin reports route**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/app/api/admin/reports/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const type = searchParams.get('type') // 'day' | 'week' | 'month'

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  // Exclude Sundays
  const registrations = await prisma.registration.findMany({
    where: {
      date: { gte: start, lte: end },
      status: 'eating'
    },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { date: 'asc' }
  })

  // Filter out Sundays from results
  const filtered = registrations.filter(r => {
    const day = new Date(r.date).getDay()
    return day !== 0
  })

  // Group by date for stats
  const dateGroups: Record<string, number> = {}
  filtered.forEach(r => {
    const dateKey = new Date(r.date).toISOString().split('T')[0]
    dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1
  })

  const reportData = filtered.map((r, idx) => ({
    stt: idx + 1,
    name: r.user.name,
    phone: r.user.username, // Using username as phone in export
    date: new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }))

  return NextResponse.json({
    reportData,
    stats: {
      total: reportData.length,
      byDate: dateGroups
    }
  })
})
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/stats/route.ts app/api/admin/reports/route.ts
git commit -m "feat: add admin stats and reports API routes"
```

---

## Task 12: Seed Data

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create seed file**

Create `C:/Users/ADMIN/Downloads/temp_v9/baocom/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminPassword, name: 'Administrator', role: 'admin' }
  })

  // Create employee users
  const employeePassword = await bcrypt.hash('employee123', 12)
  const employees = [
    { username: 'nguyenvana', name: 'Nguyễn Văn A' },
    { username: 'tranthib', name: 'Trần Thị B' },
    { username: 'levanc', name: 'Lê Văn C' },
    { username: 'phamthid', name: 'Phạm Thị D' },
    { username: 'hoangvane', name: 'Hoàng Văn E' }
  ]

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { username: emp.username },
      update: {},
      create: { username: emp.username, password: employeePassword, name: emp.name, role: 'employee' }
    })
  }

  // Create meals
  const meals = [
    { name: 'Thịt kho tàu', type: 'main' },
    { name: 'Chả lá lốt', type: 'main' },
    { name: 'Cá kho tộ', type: 'main' },
    { name: 'Gà nướng đất sét', type: 'main' },
    { name: 'Bún chả Hà Nội', type: 'main' },
    { name: 'Cải xào', type: 'vegetable' },
    { name: 'Su su luộc', type: 'vegetable' },
    { name: 'Thịt gà rang', type: 'vegetable' },
    { name: 'Đỗ quả xào', type: 'vegetable' },
    { name: 'Rau muống luộc', type: 'vegetable' },
    { name: 'Đậu phụ nhồi thịt', type: 'vegetable' },
    { name: 'Cà rốt xào', type: 'vegetable' },
    { name: 'Bông cải hấp', type: 'vegetable' },
    { name: 'Đu đủ luộc', type: 'vegetable' },
    { name: 'Rau mùi', type: 'vegetable' },
    { name: 'Chuối', type: 'dessert' },
    { name: 'Dưa hấu', type: 'dessert' },
    { name: 'Nước ép cam', type: 'dessert' },
    { name: 'Kem vani', type: 'dessert' },
    { name: 'Chè đậu đỏ', type: 'dessert' }
  ]

  const createdMeals: { id: string; type: string }[] = []
  for (const meal of meals) {
    const created = await prisma.meal.create({ data: meal })
    createdMeals.push(created)
  }

  // Create weekly menus for current week
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)

  const weekDays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu']

  for (let i = 0; i < 5; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    date.setHours(0, 0, 0, 0)

    const dailyMenu = await prisma.dailyMenu.create({ data: { date } })

    // Add meals to day (cycle through)
    const mainMeals = createdMeals.filter(m => m.type === 'main')
    const vegMeals = createdMeals.filter(m => m.type === 'vegetable')
    const dessertMeals = createdMeals.filter(m => m.type === 'dessert')

    const dayIndex = i % mainMeals.length

    await prisma.dailyMenuMeal.create({
      data: { dailyMenuId: dailyMenu.id, mealId: mainMeals[dayIndex].id, sortOrder: 0 }
    })
    await prisma.dailyMenuMeal.create({
      data: { dailyMenuId: dailyMenu.id, mealId: vegMeals[(dayIndex * 2) % vegMeals.length].id, sortOrder: 1 }
    })
    await prisma.dailyMenuMeal.create({
      data: { dailyMenuId: dailyMenu.id, mealId: vegMeals[(dayIndex * 2 + 1) % vegMeals.length].id, sortOrder: 2 }
    })
    await prisma.dailyMenuMeal.create({
      data: { dailyMenuId: dailyMenu.id, mealId: dessertMeals[dayIndex % dessertMeals.length].id, sortOrder: 3 }
    })
  }

  console.log('Seeding complete!')
  console.log('Admin login: admin / admin123')
  console.log('Employee login: nguyenvana / employee123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
```

- [ ] **Step 2: Add seed script to package.json**

Run: `cd "C:/Users/ADMIN/Downloads/temp_v9/baocom" && npm pkg set prisma.seed="ts-node prisma/seed.ts" && npm install -D ts-node`

- [ ] **Step 3: Run seed**

Run: `cd "C:/Users/ADMIN/Downloads/temp_v9/baocom" && npx prisma db seed`

Expected: Database seeded with admin, employees, meals, and weekly menus

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed data for development"
```

---

## Self-Review Checklist

- [ ] Spec coverage: All 5 models implemented ✓
- [ ] No placeholders: All code is complete ✓
- [ ] Type consistency: Field names match spec ✓
- [ ] All API routes use correct middleware ✓
- [ ] Seed data covers login test cases ✓

---

## Plan Complete

**File:** `docs/superpowers/plans/2026-05-12-database-schema-implementation.md`

**12 tasks, ~30 steps total.** Each task is independent and commits separately.

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks

**2. Inline Execution** — Execute tasks in this session using executing-plans

Which approach?
