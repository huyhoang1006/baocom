═══════════════════════════════════════════════════════════════════════════════
4. LOGIN FLOW — Sequence diagram (NF + AF + EF)
═══════════════════════════════════════════════════════════════════════════════

  User                Browser             /api/auth/login         Prisma
   │                    │                       │                     │
   │  1. Nhập form      │                       │                     │
   │──click "Đăng nhập"►│                       │                     │
   │                    │──2. POST /login──────►│                     │
   │                    │   {username, password} │                     │
   │                    │                       │──3. findUnique──────►│
   │                    │                       │                     │
   │                    │                       │◄──4. user record────│
   │                    │                       │                     │
   │                    │                       │──5. bcrypt.compare() │
   │                    │                       │                     │
   │                    │                       │──6. Check isActive──│
   │                    │                       │                     │
   │                    │                       │──7. signToken(jose) │
   │                    │                       │                     │
   │                    │◄──8. 200 OK────────────│                     │
   │                    │   + Set-Cookie: token  │                     │
   │                    │   + body: {user}       │                     │
   │                    │                       │                     │
   │◄──9. redirect──────│                       │                     │
   │   /admin/dashboard │                       │                     │
   │   hoặc /dashboard  │                       │                     │
   │                    │                       │                     │

  ─────────────────────────
  Alternative Flow (AF-1.2): Click "Quên mật khẩu?" link
  ─────────────────────────

  User              Browser          /forgot-password
   │                  │                     │
   │  click link      │                     │
   │─────────────────►│                     │
   │                  │──navigate───────────►│
   │                  │                     │

  ─────────────────────────
  Exception Flow (EF-1.1): Wrong password
  ─────────────────────────

  User              Browser            API
   │                  │                 │
   │                  │──POST /login───►│
   │                  │                 │
   │                  │◄──401────────────│
   │                  │   "Invalid      │
   │                  │    credentials" │
   │                  │                 │
   │◄──show error─────│                 │

  ─────────────────────────
  Exception Flow (EF-1.2): Empty body / malformed JSON
  ─────────────────────────

  User              Browser            API
   │                  │                 │
   │                  │──POST {}───────►│
   │                  │                 │
   │                  │◄──400────────────│
   │                  │   "Missing     │
   │                  │    username or  │
   │                  │    password"    │
   │                  │                 │
   │                  │──POST INVALID──►│
   │                  │                 │
   │                  │◄──400────────────│
   │                  │   "Invalid JSON │
   │                  │    body"        │

  ─────────────────────────
  Exception Flow (EF-1.3): Account disabled (isActive=false)
  ─────────────────────────

  User              Browser            API             DB
   │                  │                 │               │
   │                  │──POST /login───►│               │
   │                  │                 │──findUnique──►│
   │                  │                 │◄──user.isActive=false──
   │                  │                 │               │
   │                  │◄──401────────────│
   │                  │   "Invalid      │
   │                  │    credentials" │ (timing-safe)

  ─────────────────────────
  Exception Flow (EF-1.4): Rate limit exceeded
  ─────────────────────────

  User              Browser            API
   │  11 attempts    │                 │
   │───in 60s───────►│                 │
   │                  │──POST /login───►│
   │                  │                 │
   │                  │◄──429────────────│
   │                  │   "Too many     │
   │                  │    attempts"    │
   │                  │   Retry-After:60│
   │                  │                 │
   │◄──show error─────│                 │

═══════════════════════════════════════════════════════════════════════════════
5. AUTH BOUNDARY FLOW — Middleware protection
═══════════════════════════════════════════════════════════════════════════════

  Employee           Browser           middleware.ts            /admin/*
   │                  │                     │                       │
   │───navigate──────►│                     │                       │
   │  /admin/dashboard│                     │                       │
   │                  │──request───────────►│                       │
   │                  │                     │──1. Check path───────►│
   │                  │                     │   startsWith /admin   │
   │                  │                     │                       │
   │                  │                     │──2. Get token cookie─►│
   │                  │                     │                       │
   │                  │                     │──3. verifyToken()─────│
   │                  │                     │                       │
   │                  │                     │──4. Check role───────►│
   │                  │                     │   !== "admin"         │
   │                  │                     │                       │
   │                  │◄──307 redirect─────│                       │
   │                  │   Location: /       │                       │
   │                  │                     │                       │
   │◄──GET /──────────│                     │                       │
   │  (employee       │                     │                       │
   │   dashboard)     │                     │                       │
