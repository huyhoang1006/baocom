═══════════════════════════════════════════════════════════════════════════════
6. EMPLOYEE BOOKING FLOW — Sequence + state machine
═══════════════════════════════════════════════════════════════════════════════

  Employee        Browser         /api/registrations    RegService    Prisma
     │              │                    │                  │           │
     │  1. Mở /book │                    │                  │           │
     │─────────────►│                    │                  │           │
     │              │──GET /api/reg─────►│                  │           │
     │              │                    │──2. findAll──────►│           │
     │              │                    │                  │──query──►│
     │              │                    │◄──3. user regs───│◄─────────│
     │              │                    │                  │
     │              │◄──4. 200 OK─────────│                  │
     │              │   {registrations:[]}                  │
     │              │                    │                  │
     │  5. Click "Có ăn" cho ngày mai                  │
     │─────────────►│                    │                  │
     │              │──POST /api/reg─────►│                  │
     │              │  {date, status: "eating"}             │
     │              │                    │──6. validateDate─►│
     │              │                    │                  │
     │              │                    │──7. upsert───────►│
     │              │                    │                  │──write──►│
     │              │                    │◄──8. 201 Created─│◄────────│
     │              │◄──9. 201 OK─────────│                  │
     │              │   {registration}   │                  │
     │              │                    │                  │
     │◄──10. UI──────│                    │                  │
     │  update card  │                    │                  │

  ══════════════════════════════════════════
  STATE MACHINE — Week navigation
  ══════════════════════════════════════════

       ┌──────────┐
       │ Current  │ ◄── Default (offset 0)
       │  week    │      [Tuần trước] disabled
       └────┬─────┘
            │ click "Tuần sau →"
            ▼
       ┌──────────┐
       │  Week +1 │      [Tuần trước] enabled
       └────┬─────┘
            │ ... (repeat 4 times max)
            ▼
       ┌──────────┐
       │  Week +4 │      [Tuần sau →] disabled (MAX_BOOKING_WEEK_OFFSET)
       └──────────┘

  ══════════════════════════════════════════
  DATE VALIDATION — Decision tree
  ══════════════════════════════════════════

  target date ──► isWeekend? ──YES──► REJECT (WEEKEND)
       │                │
       │ NO             ▼
       │           target <= today? ──YES──► REJECT (DATE_NOT_FUTURE)
       │                │
       │ NO             ▼
       │           in booking window? ──NO──► REJECT (OUTSIDE_CURRENT_WEEK)
       │                │
       │ YES            ▼
       │           now > cutoffAt? ──YES──► REJECT (LOCKED)
       │                │
       │ NO             ▼
       └────────► ALLOW ──────► upsert(registration)

═══════════════════════════════════════════════════════════════════════════════
7. BOOKING — Alternative Flow (AF-1.1): Đổi eating → not_eating
═══════════════════════════════════════════════════════════════════════════════

  Employee         Browser           API             Service
     │               │                 │                │
     │  click existing│                │                │
     │  "Có ăn" again│                │                │
     │──────────────►│                 │                │
     │               │──POST /api/reg─►│                │
     │               │  (same date,    │                │
     │               │   status:       │                │
     │               │   "not_eating") │                │
     │               │                 │──upsert (update)│
     │               │                 │                │
     │               │◄──201 OK────────│                │
     │◄──re-render───│                 │                │

═══════════════════════════════════════════════════════════════════════════════
8. BOOKING — Exception Flow (EF-3.1): Date ở quá khứ
═══════════════════════════════════════════════════════════════════════════════

  Employee         Browser           API             Service
     │               │                 │                │
     │  POST date=hôm qua                │                │
     │──────────────►│                 │                │
     │               │──POST───────────►│                │
     │               │                 │──parseDate────►│
     │               │                 │                │
     │               │                 │──isAllowed?────│
     │               │                 │  target<=today │
     │               │                 │  → reject      │
     │               │                 │                │
     │               │◄──400────────────│                │
     │               │  "Ngày này      │                │
     │               │   không nằm     │                │
     │               │   trong lịch     │                │
     │               │   báo cơm"      │                │
     │               │  (BEFORE fix:    │                │
     │               │   "Ngay nay      │                │
     │               │    khong nam     │                │
     │               │    trong lich    │                │
     │               │    bao com"      │                │
     │               │   no diacritics) │                │

═══════════════════════════════════════════════════════════════════════════════
9. BOOKING — Exception Flow (EF-3.2): After cutoff (date locked)
═══════════════════════════════════════════════════════════════════════════════

  Employee         Browser           API             Service
     │               │                 │                │
     │  POST date=ngày mai                │                │
     │  (nhưng sau 23:00 T7 → CN)        │                │
     │──────────────►│                 │                │
     │               │──POST───────────►│                │
     │               │                 │──validateDate──│
     │               │                 │  now >= cutoff? │
     │               │                 │  → LOCKED       │
     │               │                 │                │
     │               │◄──400────────────│                │
     │               │  "Ngày này đã   │                │
     │               │   khóa báo cơm" │                │
     │               │  + code:         │                │
     │               │  "DATE_LOCKED"   │                │

═══════════════════════════════════════════════════════════════════════════════
10. BOOKING — Exception Flow (EF-3.3): Invalid date format (SQLi attempt)
═══════════════════════════════════════════════════════════════════════════════

  Attacker         Browser           API             Service
     │               │                 │                │
     │  POST date=                       │                │
     │  "2026-06-01' OR '1'='1"          │                │
     │──────────────►│                 │                │
     │               │──POST───────────►│                │
     │               │                 │──regex match───│
     │               │                 │  YYYY-MM-DD    │
     │               │                 │  → FAIL        │
     │               │                 │                │
     │               │◄──400────────────│                │
     │               │  "Invalid date   │                │
     │               │   format.       │                │
     │               │   Expected      │                │
     │               │   YYYY-MM-DD."  │                │
     │               │                 │                │
     │  (BEFORE fix: returned "Ngay nay│                │
     │   khong nam trong lich bao com"  │                │
     │   — confusing, looks like SQLi  │                │
     │   succeeded. AFTER fix: clear   │                │
     │   "Invalid date format")         │                │
