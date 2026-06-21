┌─────────────────────────────────────────────────────────────────────────────────┐
│     🎬 SCENE-BY-SCENE CHO 8 BUGS CÒN LẠI (MEDIUM + LOW)                         │
│                         (Compact Bug Reproduction Format)                       │
└─────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════
🎬 BUG-001: GET /api/settings/cutoff KHÔNG CẦU AUTH (Medium, Security)
═══════════════════════════════════════════════════════════════════════════════════

  User (anonymous)        App code              Server                DB
       │                     │                    │                    │
       │   GET /api/settings/cutoff                │                    │
       │ ───────────────────────────────────────►  │                    │
       │                     │   getCutoffConfig() │                    │
       │                     │ ──────────────────► │                    │
       │                     │                    │   SELECT * FROM    │
       │                     │                    │  CutoffConfig      │
       │                     │                    │ ──────────────────►│
       │                     │                    │ ◄────── {23,0} ─────│
       │   HTTP 200          │ ◄────────────────  │                    │
       │   {cutoffHour:23}   │                    │                    │
       │ ◄────────────────   │                    │                    │

📌 TÓM LẠI: Anonymous xem được giờ chốt đăng ký.
💥 ROOT CAUSE: `app/api/settings/cutoff/route.ts:4-14` thiếu `withAuth` wrapper.
🔧 FIX: Wrap handler bằng `withAuth` (chỉ auth user mới xem được)
   hoặc xóa route public này (vì frontend dùng `/api/admin/settings/cutoff`).

═══════════════════════════════════════════════════════════════════════════════════
🎬 BUG-003: ERROR MESSAGE TIẾNG VIỆT BỊ MẤT DẤU (Medium, UX/Content)
═══════════════════════════════════════════════════════════════════════════════════

  Employee           Controller          Service              Response
       │                  │                  │                    │
       │ POST /registrations                  │                    │
       │ {date: yesterday} │                  │                    │
       │ ────────────────►│ validateEditableDate()                │
       │                  │ ─────────────────►│                    │
       │                  │                  │  isWeekend? No     │
       │                  │                  │  inWindow? No      │
       │                  │                  │  ↓ throw new Error │
       │                  │                  │  "Ngay nay khong   │
       │                  │                  │   nam trong lich    │
       │                  │                  │   bao com"  ← 💥   │
       │                  │ ◄──────────────── │  (no diacritics!)  │
       │  HTTP 400        │                  │                    │
       │  {error: "Ngay   │                  │                    │
       │   nay khong..."} │                  │                    │
       │ ◄──────────────── │                  │                    │

📌 TÓM LẠI: Vietnamese error messages thiếu dấu, gây khó hiểu.
💥 ROOT CAUSE: `src/services/RegistrationService.ts:30,33` hard-code
   error messages tiếng Việt không dấu:
   - `'Ngay nay da khoa bao com'`
   - `'Ngay nay khong nam trong lich bao com'`
🔧 FIX: Sửa thành `'Ngày này đã khóa báo cơm'` / `'Ngày này không nằm trong lịch báo cơm'`
   Hoặc dùng error code (i18n key) thay vì raw message.

═══════════════════════════════════════════════════════════════════════════════════
🎬 BUG-004: API COLD START TIMEOUT LẦN ĐẦU (Low, Performance)
═══════════════════════════════════════════════════════════════════════════════════

  Client                Next.js Dev              Bundler
       │                      │                       │
       │ GET /api/users/nonexistent_id                │
       │ ─────────────────────► │                       │
       │                      │ Compile route on-demand
       │                      │ (first time)           │
       │                      │ ──────────────────────►│
       │   (waiting...)       │         (slow)         │
       │   (waiting...)       │ ◄───── compiled ─────  │
       │                      │ execute handler       │
       │   HTTP 000 timeout   │                       │
       │ ◄──────────────────── │                       │

  Lần thứ 2:
       │ GET /api/users/nonexistent_id
       │ ─────────────────────► │
       │                      │ (route cached)
       │   HTTP 404 "Not found"                       │
       │ ◄──────────────────── │                       │

📌 TÓM LẠI: Request đầu tiên đến 1 API route có thể timeout.
💥 ROOT CAUSE: Next.js dev mode compile route handler on-demand lần đầu.
🔧 FIX: Production build loại bỏ vấn đề này.
   Hoặc pre-warm bằng cách hit 1 request "throwaway" trước deploy.

═══════════════════════════════════════════════════════════════════════════════════
🎬 BUG-010: HOLIDAY ENDPOINT KHÔNG PUBLIC NHƯ SPEC (Low, API Contract)
═══════════════════════════════════════════════════════════════════════════════════

  Spec (E2E_TEST_SPEC.md): "Employee có thể xem holidays"
  Actual: GET /api/holidays → 401 Unauthorized

  Anonymous          Server
       │                 │
       │ GET /api/holidays
       │ ───────────────►│
       │                 │ middleware.withAuth
       │                 │ → no cookie → 401
       │   HTTP 401      │
       │ ◄──────────────│

📌 TÓM LẠI: Frontend nếu cần show holidays cho employee phải có token.
💥 ROOT CAUSE: `app/api/holidays/route.ts` GET handler được wrap với `withAuth`.
🔧 FIX: Cho phép GET public (chỉ POST/PATCH/DELETE admin-only):
   ```typescript
   export const GET = async () => {
     const holidays = await prisma.holiday.findMany({ where: { isActive: true } })
     return NextResponse.json({ holidays })
   }
   // Giữ POST/PATCH/DELETE qua withAdmin
   ```

═══════════════════════════════════════════════════════════════════════════════════
🎬 BUG-011: MALFORMED JSON TRẢ 500 THAY VÌ 400 (Medium, Error Handling)
═══════════════════════════════════════════════════════════════════════════════════

  Client                Login Route           Next.js Runtime
       │                      │                       │
       │ POST /api/auth/login                       │
       │ Content-Type: application/json              │
       │ Body: NOT_JSON                                │
       │ ──────────────────────►│                       │
       │                      │ req.json() throws   │
       │                      │ ────────────────────►│
       │                      │ SyntaxError          │
       │                      │ uncaught in handler  │
       │                      │ ────────────────────►│
       │   HTTP 500           │ internal error      │
       │   {"error": "Internal│                      │
       │    server error"}    │                      │
       │ ◄────────────────────│                      │

📌 TÓM LẠI: Client gửi JSON sai → server trả 500 thay vì 400.
💥 ROOT CAUSE: `app/api/auth/login/route.ts` thiếu try/catch quanh `req.json()`.
   (Đã làm đúng ở `/api/admin/settings/cutoff/route.ts:17-20`.)
🔧 FIX:
   ```typescript
   let body
   try {
     body = await req.json()
   } catch {
     return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
   }
   ```

═══════════════════════════════════════════════════════════════════════════════════
🎬 BUG-012: PERMISSION CHECK CHẠY SAU DATE VALIDATION (Medium, Info Disclosure)
═══════════════════════════════════════════════════════════════════════════════════

  Employee         Service.update()              Date validation      Permission check
       │                  │                            │                    │
       │ PATCH /registrations/X                        │                    │
       │ ───────────────►│ validateEditableDate()      │                    │
       │                  │ ──────────────────────────► │                    │
       │                  │                            │  now > cutoffAt?   │
       │                  │                            │  → throw "Ngay nay│
       │                  │ ◄──────────────────────────│    da khoa bao com"│
       │   HTTP 400       │                            │                    │
       │   "Ngay nay..."  │ (employee never reached    │                    │
       │ ◄────────────────│  permission check!)        │                    │

📌 TÓM LẠI: Employee PATCH registration (của người khác) → 400 thay vì 403.
   Lộ thông tin: registration tồn tại và có/không trong window.
💥 ROOT CAUSE: `RegistrationService.update()` (line 70-77):
   - validateEditableDate() chạy ĐẦU TIÊN (line 81-86)
   - Permission check `role !== 'admin' && registration.userId !== userId` (line 75-77)
     chạy SAU đó
🔧 FIX: Check role admin TRƯỚC date validation:
   ```typescript
   async update(id, userId, role, data, note) {
     const registration = await this.registrationRepository.findOne(id)
     if (!registration) throw new Error('Registration not found')

     // Permission FIRST
     if (role !== 'admin' && registration.userId !== userId) {
       throw new Error('Forbidden')
     }

     // Date validation SAU
     this.validateEditableDate(registration.date, /* employee only */)
     // ...
   }
   ```

═══════════════════════════════════════════════════════════════════════════════════
🎬 BUG-013: REPORTS QUERY PARAMS NAMING KHÔNG NHẤT QUÁN (Low, API Contract)
═══════════════════════════════════════════════════════════════════════════════════

  Dev 1 wrote controller expecting:    startDate/endDate
  Dev 2 wrote frontend calling:        from/to (REST convention)
  Dev 3 wrote tests expecting:         date=YYYY-MM-DD
  All 3 are "valid" choices — none documented.

  Client (try each)              Server response
       │                              │
       │ ?startDate=X&endDate=Y       │
       │ ────────────────────────────►│ ✅ 200 OK (correct params)
       │                              │
       │ ?from=X&to=Y                 │
       │ ────────────────────────────►│ ❌ 400 "Missing date range"
       │                              │  (silent failure — không nói
       │                              │   cần dùng param nào)
       │                              │
       │ ?date=2026-06-22             │
       │ ────────────────────────────►│ ❌ 400 "Missing date range"

📌 TÓM LẠI: 3 dev cùng dùng 3 cách gọi khác nhau, chỉ 1 work.
💥 ROOT CAUSE: API không có OpenAPI/Swagger docs.
   Controller chỉ check `startDate/endDate`.
🔧 FIX:
   1. Document params trong README / OpenAPI
   2. Error message rõ ràng: "Missing required query params: startDate, endDate"
   3. Support alias `from`/`to` cho backward compat:
      ```typescript
      const startDate = searchParams.get('startDate')
                       ?? searchParams.get('from')
                       ?? null
      ```

═══════════════════════════════════════════════════════════════════════════════════
🎬 BUG-014: SQLi PAYLOAD TRẢ ERROR TIẾNG VIỆT MẤT DẤU (Low, Security/UX)
═══════════════════════════════════════════════════════════════════════════════════

  Attacker           Service             Prisma              Response
       │                 │                   │                   │
       │ POST /registrations                  │                   │
       │ date: "2026-06-01' OR '1'='1"        │                   │
       │ ───────────────►│ parseLocalDate()  │                   │
       │                 │ (invalid format)  │                   │
       │                 │ ─────────────────►│ Prisma parse error│
       │                 │                   │ (no SQL injection│
       │                 │                   │  — Prisma safe!)  │
       │                 │ validateEditableDate()                │
       │                 │ → throw "Ngay nay│                    │
       │                 │   khong nam trong│                    │
       │                 │   lich bao com"   │                    │
       │   HTTP 400      │                   │                    │
       │   "Ngay nay..." │                   │                    │
       │ ◄──────────────│                   │                    │

📌 TÓM LẠI: SQLi không attack được (Prisma parameterized) nhưng:
  1. Error message sai ngữ nghĩa (input invalid → báo "ngoài window")
  2. UX confusing cho attacker/legit user
💥 ROOT CAUSE: Không validate date format TRƯỚC khi gọi business logic.
   Kết hợp với BUG-003 (no diacritics) làm message tệ gấp đôi.
🔧 FIX:
   ```typescript
   if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
     return NextResponse.json(
       { error: 'Invalid date format. Expected YYYY-MM-DD.' },
       { status: 400 }
     )
   }
   ```

═══════════════════════════════════════════════════════════════════════════════════

📊 SUMMARY — 14 bugs total:
  Critical (2): BUG-002, BUG-005  — full scenes ở file riêng
  High (4):     BUG-006, BUG-007, BUG-008, BUG-009 — full scenes ở file riêng
  Medium (5):   BUG-001, BUG-003, BUG-011, BUG-012, BUG-014 — gộp ở file này
  Low (3):      BUG-004, BUG-010, BUG-013 — gộp ở file này

Xem chi tiết từng scene ở các file:
  - docs/qa/evidence/BUG-002.scene.md
  - docs/qa/evidence/BUG-005.scene.md
  - docs/qa/evidence/BUG-006.scene.md
  - docs/qa/evidence/BUG-007.scene.md
  - docs/qa/evidence/BUG-008.scene.md
  - docs/qa/evidence/BUG-009.scene.md