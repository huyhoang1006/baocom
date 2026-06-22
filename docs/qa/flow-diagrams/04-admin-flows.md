═══════════════════════════════════════════════════════════════════════════════
11. ADMIN MENU MANAGEMENT FLOW — Stage diagram
═══════════════════════════════════════════════════════════════════════════════

  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │ Chọn tuần    │───►│ Sửa món cho  │───►│ Click "Lưu   │───►│ Success      │
  │ (◀/Tuần này/▶)│    │ từng ngày T2-│    │ thay đổi"    │    │ toast + reload│
  └──────────────┘    │ T6            │    └──────────────┘    └──────────────┘
                     └──────┬───────┘             │
                            │                     ▼
                            │              ┌──────────────┐
                            │              │ /api/daily-   │
                            │              │ menus/[date]  │
                            │              │ PUT/PATCH     │
                            │              └──────┬───────┘
                            │                     │
                            │                     ▼
                            │              ┌──────────────┐
                            │              │ Prisma        │
                            │              │ DailyMenu.    │
                            │              │ upsert +      │
                            │              │ DailyMenuMeal │
                            │              └──────┬───────┘
                            │                     │
                            │                     ▼
                            │              ┌──────────────┐
                            └─────────────►│ Audit log    │
                              (cancel)      │ "MENU_UPDATED"│
                                           └──────────────┘

  ══════════════════════════════════════════
  Alternative Flow (AF-6.1): Thêm món mới vào ngày
  ══════════════════════════════════════════

  Admin             /admin/menu              /api/meals/find-or-create
    │                    │                              │
    │  Click "Tạo món"   │                              │
    │  trong dropdown     │                              │
    │───────────────────►│                              │
    │                    │──POST───────────────────────►│
    │                    │  {name, type}                 │
    │                    │                              │
    │                    │◄──200 OK {meal}───────────────│
    │                    │                              │
    │                    │──PUT /api/daily-menus/[date]──│
    │                    │  {add mealIds: [new_id]}      │
    │                    │                              │

  ══════════════════════════════════════════
  Exception Flow (EF-6.1): Conflict — món đã tồn tại
  ══════════════════════════════════════════

  Admin             /api/meals/find-or-create
    │                          │
    │  POST {name: existing}    │
    │─────────────────────────►│
    │                          │──prisma.findUnique──────►│
    │                          │◄──existing meal─────────│
    │                          │
    │                          │──return existing (no create)│
    │◄──200 OK {meal: existing}│
    │                          │
    │  (Idempotent: same name  │
    │   returns same meal)     │

═══════════════════════════════════════════════════════════════════════════════
12. ADMIN REPORTS FLOW — Data flow diagram
═══════════════════════════════════════════════════════════════════════════════

  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  Chọn    │     │  Chọn    │     │  Click   │     │  Click   │
  │  Date    │────►│  Tab     │────►│ "Tra     │────►│ "Xuất    │
  │  picker  │     │ Ngày/    │     │  cứu"    │     │  Excel"  │
  └──────────┘     │ Tuần/    │     └────┬─────┘     └────┬─────┘
                   │ Tháng    │          │                │
                   └──────────┘          ▼                ▼
                                     ┌──────────┐    ┌──────────┐
                                     │ /api/    │    │ /api/    │
                                     │ admin/   │    │ admin/   │
                                     │ reports  │    │ reports  │
                                     └────┬─────┘    │ /export  │
                                          │          └────┬─────┘
                                          ▼               ▼
                                     ┌──────────┐    ┌──────────┐
                                     │ JSON     │    │ XLSX     │
                                     │ response │    │ file     │
                                     │ (table)  │    │ download │
                                     └────┬─────┘    │ (CT:     │
                                          │          │ vnd.ms-  │
                                          ▼          │ excel)   │
                                     ┌──────────┐    └──────────┘
                                     │ Render in │
                                     │ browser   │
                                     │ table     │
                                     └──────────┘

  ══════════════════════════════════════════
  Alternative Flow (AF-10.1): Export CSV
  ══════════════════════════════════════════

  Admin             /api/admin/reports/export
    │                          │
    │  GET ?startDate=X&endDate=Y │
    │───────────────────────────►│
    │                          │
    │                          │──controller.exportCsv()──┐
    │                          │                          │
    │                          │──generate CSV string─────│
    │                          │  with BOM for UTF-8      │
    │                          │  Vietnamese diacritics    │
    │                          │◄─────────────────────────│
    │                          │
    │◄──200 OK──────────────────│
    │  Content-Type: text/csv   │
    │  Content-Disposition:     │
    │    attachment;            │
    │    filename=...csv        │
    │                          │
    │  Browser downloads file   │

  ══════════════════════════════════════════
  Exception Flow (EF-10.1): Missing date params
  ══════════════════════════════════════════

  Admin             /api/admin/reports
    │                          │
    │  GET ?type=day (no dates)│
    │───────────────────────────►│
    │                          │──parseDateRange()────────│
    │                          │  Missing startDate       │
    │                          │                          │
    │◄──400 Bad Request─────────│
    │  "Missing required query  │
    │   params: startDate,      │
    │   endDate (or aliases:    │
    │   from, to). Use          │
    │   YYYY-MM-DD format."     │

═══════════════════════════════════════════════════════════════════════════════
13. LOGOUT FLOW — Sequence + invalidation
═══════════════════════════════════════════════════════════════════════════════

  User             Browser              /api/auth/logout           Prisma
   │                │                       │                       │
   │  click Logout   │                       │                       │
   │───────────────►│                       │                       │
   │                │──POST /logout────────►│                       │
   │                │                       │                       │
   │                │                       │──1. withAuth()────────│
   │                │                       │  verifyToken()        │
   │                │                       │  (tokenVersion check) │
   │                │                       │                       │
   │                │                       │──2. UPDATE User──────►│
   │                │                       │  SET tokenVersion = N+1│
   │                │                       │                       │
   │                │                       │◄──3. updated─────────│
   │                │                       │                       │
   │                │◄──4. 200 OK────────────│                       │
   │                │   Set-Cookie: token=  │                       │
   │                │   Max-Age=0           │                       │
   │                │                       │                       │
   │  5. Old token now INVALID  (tokenVersion mismatch)         │
   │  6. Attacker cannot use stolen cookie                       │

  ══════════════════════════════════════════
  EF-12.1: Try to use old token after logout
  ══════════════════════════════════════════

  Attacker         API                 middleware
     │               │                     │
     │  GET /me with old token           │
     │──────────────►│                     │
     │               │──verifyToken()─────►│
     │               │  payload.tokenVersion=5
     │               │                     │
     │               │  DB user.tokenVersion=6
     │               │  → MISMATCH!         │
     │               │                     │
     │◄──401─────────│◄──Session expired──│
     │  "Session     │                     │
     │   expired"    │                     │
