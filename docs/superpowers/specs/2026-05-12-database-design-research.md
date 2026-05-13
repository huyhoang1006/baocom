# Database Design Research — Meal Booking/Holiday Planning App

**Date:** 2026-05-12  
**Status:** Completed

---

## Executive Summary

This document consolidates research from 5 parallel agents covering all aspects of database design for a Next.js meal booking and holiday planning application.

**Recommended Stack:**
| Component | Choice |
|-----------|--------|
| Database | PostgreSQL |
| ORM | Drizzle |
| Auth | NextAuth.js v5 |
| Password | bcryptjs |
| Validation | Zod |

---

## 1. Authentication & User Management

### Approach
**JWT + Database session hybrid** with NextAuth.js v5.

- JWT for stateless API authorization
- Database sessions for revocation and refresh token rotation
- OAuth providers (Google, GitHub) for social login

### Key Tables

```sql
-- users
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
email         VARCHAR(255) UNIQUE NOT NULL
name          VARCHAR(255)
password_hash VARCHAR(255)  -- NULL if OAuth-only
image         VARCHAR(500)
email_verified BOOLEAN DEFAULT FALSE
created_at    TIMESTAMP DEFAULT NOW()
updated_at    TIMESTAMP DEFAULT NOW()

-- accounts (OAuth)
id, user_id, type, provider, provider_account_id, refresh_token, access_token, access_token_expires

-- sessions
id, user_id, expires, session_token

-- user_roles
id, name  -- 'admin', 'host', 'guest'

-- user_user_roles (junction)
user_id, role_id
```

### Security
- **bcrypt** cost factor 12 or **Argon2id**
- HTTP-only cookies, SameSite=Strict/Lax
- Rate limiting on `/api/auth/signin`
- RBAC on protected routes

---

## 2. Meal Management

### Approach
Relational with JSONB extensions. UUIDs for all primary keys. Soft deletes via `deletedAt`.

### Key Tables

```sql
-- meals
id, name, description, price INTEGER (cents), currency, image_url, is_active, deleted_at, created_at, updated_at

-- categories (hierarchical with parent_id)

-- dietary_tags (vegetarian, halal, gluten_free)
code, name, icon

-- meal_dietary_tags (junction)

-- allergens (peanuts, dairy, shellfish)
code, name

-- meal_allergens (junction)

-- meal_availability (day_of_week, start_time, end_time, max_orders)

-- meal_inventory (date-based slots: meal_id, date, total_slots, booked_slots, price_override)

-- pricing_tiers (weekday special, weekend premium)
name, price, currency, start_date, end_date, is_active

-- meal_reviews
meal_id, user_id, rating (1-5), comment, created_at
```

### Key Decisions
| Decision | Choice |
|----------|--------|
| Price storage | Integer (cents) — avoids floating point |
| Dietary tags | Many-to-many + JSONB snapshot on booking |
| Inventory | Date-based slots with bookedSlots counter |
| Soft delete | `deletedAt` on meals |
| Category hierarchy | Self-referential `parentId` |

### Indexes
```sql
CREATE INDEX idx_meals_is_active ON meals(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_meal_inventory_meal_date ON meal_inventory(meal_id, date);
CREATE INDEX idx_meal_dietary_tags_tag ON meal_dietary_tags(dietary_tag_id);
```

---

## 3. Booking/Reservation

### Status Workflow
```
pending → confirmed → completed
          ↓
       cancelled
```

### Key Tables

```sql
-- bookings
id, user_id, meal_id, status ('pending'|'confirmed'|'cancelled'|'completed'),
guest_count, special_requests, holiday_id (nullable),
applied_pricing JSONB (snapshot), booking_date, event_date,
deleted_at, version (for optimistic locking), created_at, updated_at

-- booking_items
id, booking_id, meal_id, quantity, unit_price, currency,
dietary_tags JSONB (snapshot), notes
```

### Key Patterns
- **Optimistic locking** with `version` column
- **Snapshot pricing** at booking time for audit
- **Cursor-based pagination** for booking history

### Queries
```sql
-- Available slots
SELECT * FROM meal_inventory WHERE date = $1 AND booked_slots < total_slots;

-- User booking history
SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC;
```

---

## 4. Holiday/Special Occasion

### Approach
Decouple holidays from pricing rules. Holidays define "what occasion", pricing rules define "what it costs".

### Key Tables

```sql
-- holidays
id, name, description, recurrence ('ONE_TIME'|'ANNUAL'|'RECURRING'),
date (for one-time), recurrence_rule, month, day_of_month, week_of_month, day_of_week,
is_active, region, priority, created_at

-- seasonal_menus
id, name, season ('SPRING'|'SUMMER'|'AUTUMN'|'WINTER'|'ALL_YEAR'),
start_date, end_date, description, is_active

-- holiday_meal_packages
id, holiday_id, meal_package_id, name, description,
min_advance_hours, max_bookings, current_bookings,
base_price, is_price_override

-- pricing_rules
id, name, rule_type ('HOLIDAY'|'SEASONAL'|'WEEKEND'|'PEAK_HOURS'|'ADVANCE_BOOKING'|'LAST_MINUTE'),
adjustment_type ('PERCENTAGE'|'FIXED'|'MULTIPLIER'), adjustment_value,
start_date, end_date, holiday_id, season_id,
day_of_week INT[], time_start, time_end,
min_days_advance, max_days_advance, priority, is_active

-- blocked_dates
id, date, reason, is_recurring
```

### Recurring Holiday Computation
Holidays stored as rules, computed at runtime:
- Thanksgiving: `weekOfMonth: 4, dayOfWeek: 4, month: 11`
- Memorial Day: `weekOfMonth: -1, dayOfWeek: 1, month: 5` (last Monday)

---

## 5. General Architecture

### PostgreSQL over MySQL/SQLite
- Better JSONB support
- Array types for day-of-week filtering
- Window functions for scheduling
- Strong ACID compliance

### Drizzle over Prisma
- Smaller bundle (~40kb vs ~2MB)
- SQL-like syntax, easier to debug
- Faster cold starts
- Better for read-heavy workloads

### Soft Deletes
Used for: bookings, users, venues, meals  
Hard deletes for: session tokens, OTP codes

### Multi-Tenancy
Row-level `tenant_id` foreign key (sufficient for &lt;10k tenants)

### Migration Workflow
1. `drizzle-kit generate` — author migration
2. Review SQL (never auto-apply in production)
3. Version control with git
4. Manual apply with backup

### Performance
- **Connection pooling**: PgBouncer
- **Caching**: Redis for availability slots (TTL: 30-60s)
- **Cursor pagination** for booking history
- **Optimistic locking** for concurrent slot updates

---

## 6. Combined Schema (Drizzle)

```typescript
// Users & Auth
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  image: varchar('image', { length: 500 }),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }),
  provider: varchar('provider', { length: 50 }),
  providerAccountId: varchar('provider_account_id', { length: 255 }),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  accessTokenExpires: timestamp('access_token_expires'),
});

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
  sessionToken: varchar('session_token', { length: 255 }).unique(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).unique().notNull(),
});

export const userUserRoles = pgTable('user_user_roles', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').references(() => userRoles.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

// Meals
export const meals = pgTable('meals', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  currency: text('currency').notNull().default('USD'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const dietaryTags = pgTable('dietary_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  icon: text('icon'),
});

export const mealDietaryTags = pgTable('meal_dietary_tags', {
  mealId: uuid('meal_id').references(() => meals.id, { onDelete: 'cascade' }),
  dietaryTagId: uuid('dietary_tag_id').references(() => dietaryTags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.mealId, table.dietaryTagId] }),
}));

export const mealInventory = pgTable('meal_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealId: uuid('meal_id').references(() => meals.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  totalSlots: integer('total_slots').notNull(),
  bookedSlots: integer('booked_slots').notNull().default(0),
  price: integer('price'),
}, (table) => ({
  unique: unique().on(table.mealId, table.date),
});

// Bookings
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  mealId: uuid('meal_id').references(() => meals.id),
  status: text('status').default('pending'),
  guestCount: integer('guest_count').notNull(),
  specialRequests: text('special_requests'),
  holidayId: uuid('holiday_id'),
  appliedPricing: jsonb('applied_pricing'),
  bookingDate: timestamp('booking_date').defaultNow(),
  eventDate: timestamp('event_date').notNull(),
  deletedAt: timestamp('deleted_at'),
  version: integer('version').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Holidays
export const holidays = pgTable('holidays', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  recurrence: text('recurrence').default('ONE_TIME'),
  date: date('date'),
  recurrenceRule: text('recurrence_rule'),
  month: integer('month'),
  dayOfMonth: integer('day_of_month'),
  weekOfMonth: integer('week_of_month'),
  dayOfWeek: integer('day_of_week'),
  isActive: boolean('is_active').default(true),
  region: text('region'),
  priority: integer('priority').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const seasonalMenus = pgTable('seasonal_menus', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  season: text('season').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const pricingRules = pgTable('pricing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ruleType: text('rule_type').notNull(),
  adjustmentType: text('adjustment_type').notNull(),
  adjustmentValue: integer('adjustment_value').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  holidayId: uuid('holiday_id'),
  seasonId: uuid('season_id'),
  dayOfWeek: jsonb('day_of_week'),
  timeStart: text('time_start'),
  timeEnd: text('time_end'),
  minDaysAdvance: integer('min_days_advance'),
  maxDaysAdvance: integer('max_days_advance'),
  priority: integer('priority').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 7. Open Questions

1. **ORM choice**: Prisma vs Drizzle — prefer Drizzle but confirm with team
2. **Multi-currency**: Is support for multiple currencies needed?
3. **Inventory granularity**: Per-time-slot or per-day?
4. **Multi-tenancy**: Is multi-tenant architecture required?
5. **OAuth providers**: Which providers (Google, GitHub, Apple)?

---

## 8. Next Steps

1. Review and approve this design document
2. Decide on ORM (Prisma vs Drizzle)
3. Create detailed implementation plan
4. Set up database migrations
5. Implement core entities first (users, meals, bookings)

---

## Research Sources

- Agent 1: Authentication & User Management DB Design
- Agent 2: Meal Management DB Design  
- Agent 3: Booking/Reservation DB Design
- Agent 4: Holiday/Special Occasion DB Design
- Agent 5: General DB Architecture Best Practices
