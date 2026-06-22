═══════════════════════════════════════════════════════════════════════════════
20. SECURITY FLOWS — Attack scenarios
═══════════════════════════════════════════════════════════════════════════════

  ══════════════════════════════════════════
  Attack 1: SQL Injection on date field
  ══════════════════════════════════════════

  Attacker        API              Service           Prisma
     │              │                 │                 │
     │  date=        │                 │                 │
     │  "2026-06-01' │                 │                 │
     │  OR '1'='1"   │                 │                 │
     │─────────────►│                 │                 │
     │              │──parseDate()───►│                 │
     │              │                 │──regex test─────│
     │              │                 │  YYYY-MM-DD     │
     │              │                 │  → FAIL         │
     │              │                 │                 │
     │◄──400─────────│                 │                 │
     │  "Invalid     │                 │                 │
     │   date       │                 │                 │
     │   format"    │                 │                 │
     │              │                 │                 │
     │  (BEFORE fix: 400 with Vietnamese            │
     │   "Ngay nay khong nam trong lich bao com"    │
     │   → suggests SQL was queried and returned     │
     │   0 results. AFTER fix: clear validation     │
     │   error message)                              │

  ══════════════════════════════════════════
  Attack 2: Password brute-force
  ══════════════════════════════════════════

  Attacker       API             middleware.ts
     │             │                  │
     │  Attempt 1: │                  │
     │  "admin"    │                  │
     │             │──POST /login───►│
     │             │                  │──isRateLimited()──┐
     │             │                  │  count=1 OK       │
     │             │◄──401────────────│                    │
     │             │                  │                    │
     │  Attempt 2-10:                 │                    │
     │  ... (all 401)                 │                    │
     │                                │                    │
     │  Attempt 11:                   │                    │
     │             │──POST /login───►│                    │
     │             │                  │──isRateLimited()──│
     │             │                  │  count=10 > max   │
     │             │                  │  → return 429     │
     │             │◄──429────────────│                    │
     │             │  "Too many      │                    │
     │             │   attempts"     │                    │
     │             │  Retry-After:60 │                    │
     │                                │                    │
     │  (After 60s, can try again    │                    │
     │   but only 10 at a time)       │                    │
     │                                │                    │

  ══════════════════════════════════════════
  Attack 3: Session hijacking after logout
  ══════════════════════════════════════════

  Victim          Browser          API               DB
     │               │                │                │
     │  Login        │                │                │
     │──────────────►│                │                │
     │               │──POST /login──►│                │
     │               │◄──token A─────│                │
     │               │                │                │
     │  Attacker     │                │                │
     │  steals token │                │                │
     │  A            │                │                │
     │               │                │                │
     │  Victim       │                │                │
     │  Logout      │                │                │
     │──────────────►│                │                │
     │               │──POST /logout►│                │
     │               │                │──UPDATE────────►│
     │               │                │  tokenVersion   │
     │               │                │  0 → 1         │
     │               │                │                │
     │  Attacker     │                │                │
     │  uses token A │                │                │
     │──────────────►│                │                │
     │               │──GET /me──────►│                │
     │               │                │──verifyToken()─│
     │               │                │  payload.tokenV=0│
     │               │                │                │
     │               │                │──DB check───────►│
     │               │                │  user.tokenV=1  │
     │               │                │  MISMATCH!      │
     │               │                │                │
     │               │◄──401──────────│                │
     │               │  "Session      │                │
     │               │   expired"     │                │
     │               │                │                │

  ══════════════════════════════════════════
  Attack 4: XSS stored in user name
  ══════════════════════════════════════════

  Attacker       /api/users (POST)        Prisma         Browser (victim)
     │                  │                     │                  │
     │  POST {          │                     │                  │
     │   name: "<img   │                     │                  │
     │   src=x         │                     │                  │
     │   onerror=      │                     │                  │
     │   alert(1)>"   │                     │                  │
     │─────────────────►│                     │                  │
     │                  │──create()─────────►│                  │
     │                  │  (raw string OK)    │                  │
     │                  │                     │                  │
     │◄──201 OK─────────│                     │                  │
     │                  │                     │                  │
     │                  │                     │                  │
     │  Victim opens admin/employees        │                  │
     │                  │                     │                  │
     │                  │  <td>              │                  │
     │                  │   {user.name}      │                  │
     │                  │  </td>             │                  │
     │                  │                     │                  │
     │                  │  React escapes:     │                  │
     │                  │  <td>&lt;img        │                  │
     │                  │  src=x...&gt;</td>  │                  │
     │                  │                     │                  │
     │                  │  Browser displays literal text         │
     │                  │  (NO script execution — SAFE)           │

═══════════════════════════════════════════════════════════════════════════════
21. COMPLETE USER JOURNEY — End-to-end workflow
═══════════════════════════════════════════════════════════════════════════════

  Day 1 (Sunday 22:00)          Day 2 (Monday 08:00)
  ┌──────────────┐              ┌──────────────┐
  │ Employee H.  │              │ Employee H.  │
  │ wants to book│              │ arrives at   │
  │ Monday lunch │              │ office       │
  └──────┬───────┘              └──────┬───────┘
         │                             │
         ▼                             ▼
  ┌──────────────┐              ┌──────────────┐
  │ 22:00 — After│              │ 08:00 — Too  │
  │ 23:00 cutoff │              │ late, system │
  │ → LOCKED     │              │ already shows│
  │ (BEFORE fix: │              │ "Đã khóa"    │
  │ could book)  │              │ (Monday      │
  └──────────────┘              │ already       │
                                │ happened)     │
                                └──────────────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ Looks at     │
                                │ kitchen count │
                                │ in dashboard  │
                                └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ Sees 8       │
                                │ "Có ăn"      │
                                │ today, 2     │
                                │ "Không ăn"    │
                                └──────────────┘

  ─────────────────────────
  Admin weekly flow
  ─────────────────────────

  ┌──────────────┐
  │  Monday AM   │
  │  Admin login │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐    ┌──────────────┐
  │ Review Sun   │───►│ Check menu   │
  │ registrations│    │ for next week │
  └──────────────┘    └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                      │ Update menu  │
                      │ (add/remove  │
                      │  meals)      │
                      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                      │ Click "Lưu   │
                      │ thay đổi"     │
                      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                      │ Notify       │
                      │ employees via │
                      │ Zalo/Telegram │
                      └──────────────┘
                             │
                             ▼
  ┌──────────────┐    ┌──────────────┐
  │  Friday PM   │    │ Saturday     │
  │  Print report│───►│ Export to    │
  │  for kitchen │    │ Excel for    │
  │  (tomorrow)  │    │ catering co. │
  └──────────────┘    └──────────────┘

═══════════════════════════════════════════════════════════════════════════════
22. ERROR HANDLING PATTERNS — Cross-flow reference
═══════════════════════════════════════════════════════════════════════════════

  ┌──────────────┐
  │  Client API  │
  │  call        │
  └──────┬───────┘
         │
         ▼
  ┌──────────────────────────────────────┐
  │  Server-side controller             │
  │  try {                                │
  │    const result = await service.X()  │
  │    return 200/201 + {result}         │
  │  } catch (error) {                   │
  │    switch (error.message) {          │
  │      case "Invalid status":         │
  │        → 400 "Invalid status"        │
  │      case "Registration not found": │
  │        → 404 "Not found"             │
  │      case "Forbidden":              │
  │        → 403 "Forbidden"             │
  │      case "Username already exists":│
  │        → 409 "Username already..."   │
  │      case "Ngày này đã khóa báo cơm":│
  │        → 400 + code:DATE_LOCKED      │
  │      case "Ngày này không nằm...":   │
  │        → 400 + code:DATE_OUTSIDE_WIN │
  │      default:                         │
  │        throw error (→ 500)           │
  │    }                                 │
  │  }                                   │
  └──────────────────────────────────────┘

  ══════════════════════════════════════════
  Auth errors (from withAuth/withAdmin)
  ══════════════════════════════════════════

  ┌──────────────────────┐
  │ 401 Unauthorized     │ ◄── No cookie / Invalid JWT
  ├──────────────────────┤
  │ 401 Invalid token    │ ◄── Tampered JWT
  ├──────────────────────┤
  │ 401 Session expired  │ ◄── tokenVersion mismatch
  ├──────────────────────┤
  │ 403 Forbidden        │ ◄── Non-admin access to admin route
  ├──────────────────────┤
  │ 403 Account disabled │ ◄── isActive=false
  └──────────────────────┘
