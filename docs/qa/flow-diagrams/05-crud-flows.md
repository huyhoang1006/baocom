═══════════════════════════════════════════════════════════════════════════════
14. EMPLOYEE MANAGEMENT — CRUD flows (NF + AF + EF)
═══════════════════════════════════════════════════════════════════════════════

  ══════════════════════════════════════════
  Normal Flow: Create employee
  ══════════════════════════════════════════

  Admin         Modal         /api/users (POST)      UserService       Prisma
   │            │                  │                     │                │
   │  Click     │                  │                     │                │
   │  "Thêm NV" │                  │                     │                │
   │───────────►│                  │                     │                │
   │            │                  │                     │                │
   │  Fill form │                  │                     │                │
   │  Submit    │                  │                     │                │
   │───────────►│                  │                     │                │
   │            │──POST────────────►│                     │                │
   │            │ {username,       │                     │                │
   │            │  password,       │                     │                │
   │            │  name, role}     │                     │                │
   │            │                  │──create()───────────►│                │
   │            │                  │                     │──hashPassword──│
   │            │                  │                     │──findByUsername│
   │            │                  │                     │  (dup check)  │
   │            │                  │                     │                │
   │            │                  │                     │──prisma.create►│
   │            │                  │                     │                │
   │            │                  │◄──user + credentials│                │
   │            │                  │   (raw pwd to       │                │
   │            │                  │    display 1 lần)   │                │
   │            │◄──201 OK─────────│                     │                │
   │            │  {user,          │                     │                │
   │            │   credentials}   │                     │                │
   │            │                  │                     │                │
   │◄──show─────│                  │                     │                │
   │ password 1 │                  │                     │                │
   │ lần + close│                  │                     │                │

  ══════════════════════════════════════════
  AF: Update employee role
  ══════════════════════════════════════════

  Admin          /api/users/[id] (PATCH)    UserService       Prisma
   │                     │                       │                │
   │  Change role:        │                       │                │
   │  employee → admin    │                       │                │
   │─────────────────────►│                       │                │
   │                     │──update(id, {role})──►│                │
   │                     │                       │──prisma.update──►│
   │                     │◄──updated user────────│                │
   │◄──200 OK─────────────│                       │                │
   │                     │                       │                │
   │  (⚠️ No audit log    │                       │                │
   │   for role change)   │                       │                │

  ══════════════════════════════════════════
  AF: Disable employee (soft delete)
  ══════════════════════════════════════════

  Admin          /api/users/[id] (PATCH)    UserService       Prisma
   │                     │                       │                │
   │  Set isActive=false  │                       │                │
   │─────────────────────►│                       │                │
   │                     │──update({isActive:false})              │
   │                     │                       │──prisma.update──►│
   │                     │◄──updated user────────│                │
   │                     │                       │                │
   │  Verify: login with this account           │                │
   │  → 401 "Invalid credentials"               │                │
   │  (timing-safe: same message for invalid pwd)               │

  ══════════════════════════════════════════
  EF: Create with duplicate username
  ══════════════════════════════════════════

  Admin          /api/users (POST)       UserService
   │                    │                      │
   │  POST {username: "admin"}                │
   │───────────────────►│                      │
   │                    │──create()───────────►│
   │                    │──findByUsername────►│
   │                    │◄──existing user─────│
   │                    │                      │
   │                    │──throw "Username     │
   │                    │   already exists"────│
   │                    │                      │
   │◄──409 Conflict─────│                      │
   │  "Username already  │                      │
   │   exists"           │                      │

  ══════════════════════════════════════════
  EF: Create with weak password (< 4 chars)
  ══════════════════════════════════════════

  Admin          /api/users (POST)
   │                    │
   │  POST {password: "ab"}  (2 chars)
   │───────────────────►│
   │                    │
   │◄──400 Bad Request──│
   │  "Missing required │
   │   field"           │
   │  (or validation    │
   │   error from DTO)  │

  ══════════════════════════════════════════
  EF: Create with XSS in name
  ══════════════════════════════════════════

  Admin          /api/users (POST)       Prisma
   │                    │                  │
   │  POST {name: "<img onerror=...>"}     │
   │───────────────────►│                  │
   │                    │──prisma.create───►│
   │                    │  (raw string OK)  │
   │                    │◄──user────────────│
   │                    │                  │
   │◄──201 OK────────────│                  │
   │                    │                  │
   │  Display in UI: React escapes HTML     │
   │  → shows literal "<img onerror=...>"  │
   │  (NO script execution — SAFE)          │

═══════════════════════════════════════════════════════════════════════════════
15. DEPARTMENT MANAGEMENT — NF + AF + EF
═══════════════════════════════════════════════════════════════════════════════

  NF: Create department
  ─────────────────────
  Admin         /api/departments (POST)
   │                    │
   │  POST {name: "QA"} │
   │───────────────────►│
   │                    │──create()─────────►│
   │                    │──name unique check─│
   │                    │──prisma.create────►│
   │                    │◄──department──────│
   │◄──201 OK────────────│
   │  {department}      │

  EF: Duplicate department name
  ────────────────────────────
   │                    │
   │  POST {name: "QA"} (again)
   │───────────────────►│
   │                    │──findUnique───────►│
   │                    │◄──existing─────────│
   │                    │──throw─────────────│
   │                    │  "Department name  │
   │                    │   already exists"──│
   │◄──409──────────────│

  EF: Delete department with employees
  ──────────────────────────────────────
   │                    │
   │  DELETE /api/departments/[id]
   │───────────────────►│
   │                    │──count users in dept───►│
   │                    │◄──has users──────────│
   │                    │──throw──────────────│
   │                    │  "Cannot delete    │
   │                    │   department with  │
   │                    │   employees"────────│
   │◄──400──────────────│

═══════════════════════════════════════════════════════════════════════════════
16. HOLIDAY MANAGEMENT — NF + AF + EF
═══════════════════════════════════════════════════════════════════════════════

  NF: Add holiday
  ──────────────
  Admin         /api/holidays (POST)
   │                    │
   │  POST {date: "2026-09-02", description: "QK"}
   │───────────────────►│
   │                    │──create()───────►│
   │                    │──date unique check│
   │                    │──prisma.create──►│
   │◄──201 OK────────────│
   │  {holiday}        │

  EF: Duplicate date
  ──────────────────
   │                    │
   │  POST {date: "2026-09-02"} again
   │───────────────────►│
   │                    │──findUnique──────►│
   │                    │◄──exists──────────│
   │                    │──throw───────────│
   │                    │  "Date already   │
   │                    │   exists"─────────│
   │◄──409──────────────│

  AF: Set isActive=false (soft disable)
  ────────────────────────────────────
   │                    │
   │  PATCH {isActive: false}            │
   │───────────────────►│                 │
   │                    │──prisma.update──►│
   │                    │                  │
   │  Effect: holiday still exists in DB │
   │  but doesn't show in booking UI      │

═══════════════════════════════════════════════════════════════════════════════
17. ADMIN OVERRIDE REGISTRATION — NF + EF
═══════════════════════════════════════════════════════════════════════════════

  NF: Admin override locked registration
  ───────────────────────────────────────
  Admin          /api/registrations/[id] (PATCH)   Service
   │                       │                          │
   │  PATCH {status: "not_eating",                 │
   │         overrideNote: "Sick, admin override"}  │
   │───────────────────────►                          │
   │                       │──update(admin, ...)─────►│
   │                       │                          │
   │                       │──1. findOne─────────────►│
   │                       │                          │
   │                       │──2. Permission check─────│
   │                       │   role === "admin" ✓     │
   │                       │                          │
   │                       │──3. wasLocked check──────│
   │                       │   (validateEditableDate  │
   │                       │    throws → wasLocked)   │
   │                       │                          │
   │                       │──4. SKIP date validation │
   │                       │   (admin bypass)         │
   │                       │                          │
   │                       │──5. prisma.update────────►│
   │                       │                          │
   │                       │──6. createOverride()─────►│
   │                       │   (audit trail)          │
   │                       │                          │
   │                       │──7. audit log────────────►│
   │                       │   "REGISTRATION_OVERRIDE"│
   │                       │                          │
   │◄──200 OK───────────────│                          │
   │  {registration,        │                          │
   │   override}            │                          │

  EF: Employee tries to PATCH
  ──────────────────────────
   │                       │
   │  PATCH with employee cookie                  │
   │───────────────────────►                          │
   │                       │──update(emp, role="employee")──►│
   │                       │                          │
   │                       │──1. findOne─────────────►│
   │                       │                          │
   │                       │──2. Permission check─────│
   │                       │   role !== "admin" &&   │
   │                       │   userId !== owner ────►│
   │                       │   → throw "Forbidden"  │
   │                       │                          │
   │◄──403 Forbidden───────│                          │
   │  "Forbidden"          │                          │
   │                       │                          │
   │  (BEFORE fix: 400 with Vietnamese error     │
   │   "Ngay nay khong nam trong lich bao com"  │
   │   — info disclosure + wrong status)         │

═══════════════════════════════════════════════════════════════════════════════
18. SETTINGS (CUTOFF) MANAGEMENT
═══════════════════════════════════════════════════════════════════════════════

  Admin         /api/admin/settings/cutoff (PUT)
   │                       │
   │  PUT {cutoffHour: 20, cutoffMinute: 30}        │
   │───────────────────────►                          │
   │                       │                          │
   │                       │──1. withAdmin()─────────►│
   │                       │   require admin role   │
   │                       │                          │
   │                       │──2. validate (0-23, 0-59)──│
   │                       │                          │
   │                       │──3. upsertCutoffConfig()──►│
   │                       │   audit log: "CUTOFF_  │
   │                       │   UPDATED"               │
   │                       │                          │
   │◄──200 OK───────────────│                          │
   │  {cutoffHour: 20,      │                          │
   │   cutoffMinute: 30}    │                          │
   │                       │                          │
   │  Effect: Booking UI re-fetches via             │
   │  GET /api/admin/settings/cutoff (admin) or     │
   │  GET /api/settings/cutoff (auth)                │
   │  → new cutoff applied to all future validations│

  EF: Invalid cutoff values
  ───────────────────────────
   │                       │
   │  PUT {cutoffHour: 25, cutoffMinute: 70}        │
   │───────────────────────►                          │
   │                       │                          │
   │                       │──validate hour > 23─────│
   │                       │   OR minute > 59 ────►│
   │                       │   throw validation err │
   │                       │                          │
   │◄──400 Bad Request─────│                          │
   │  "Invalid cutoff time:│                          │
   │   hour must be 0-23,  │                          │
   │   minute must be 0-59"│                          │

═══════════════════════════════════════════════════════════════════════════════
19. CUTOFF EFFECT ON BOOKING — Workflow diagram
═══════════════════════════════════════════════════════════════════════════════

  ┌─────────────┐
  │  Employee   │
  │  opens /book│
  └──────┬──────┘
         │
         ▼
  ┌─────────────────────┐
  │ GET /api/daily-menus │
  │ (or /registrations)  │
  └──────┬──────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │ Frontend calls                    │
  │ isAllowedRegistrationDate()      │
  │ for each day in current week     │
  └──────┬───────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │ Check: now >= cutoffAt(target)?  │
  │   cutoffAt = target - 1 day 23:00│
  └──────┬───────────────────────────┘
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ▼         ▼
  ┌────────┐ ┌────────┐
  │ LOCKED │ │ ALLOW  │
  │ (button│ │(button │
  │disabled│ │enabled)│
  └────────┘ └────────┘

  Example: target = 2026-06-22 (Mon), cutoff hour = 23
  → cutoffAt = 2026-06-21 (Sun) 23:00

  At 2026-06-21 22:59 → ALLOW (1 min before cutoff)
  At 2026-06-21 23:00 → LOCKED (cutoff reached)
  At 2026-06-22 09:00 → LOCKED (after cutoff, but it's the target day)
