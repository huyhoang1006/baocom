# UAT Test Scenario: Auto-send Zalo - Chọn ngày mục tiêu theo rule cutoff

## Objective

Validate admin có thể cấu hình auto-send Zalo để tự động chọn ngày mục tiêu (target date) theo rule cutoff:
- Mode `auto`: luôn gửi data workday kế tiếp sau thời điểm gửi (vd T2 sáng → T3)
- Mode `today`: gửi data hôm nay (skip T7/CN → T2 tuần sau)
- Mode `manual`: admin chọn ngày cụ thể

## Prerequisites

- App chạy tại `http://localhost:3000`
- Đã đăng nhập với tài khoản admin (vd `admin` / `admin123`)
- Zalo bot đã connect và đã chọn groupId
- Có dữ liệu menu + registrations cho các ngày T2-T6 tuần test
- Cutoff mặc định 23:00 (có thể đổi qua `/admin/settings`)
- Cron hiện tại: `0 8 * * 1-5` (8h sáng T2-T6)

## Test Matrix

| Scenario | Hôm nay | Mode | Target mong đợi |
|---|---|---|---|
| TC-01 | T2 (22/06/2026) | auto | T3 (23/06) |
| TC-02 | T6 (26/06/2026) | auto | T2 tuần sau (29/06) |
| TC-03 | T7 (27/06/2026) | auto | T2 tuần sau (29/06) |
| TC-04 | CN (28/06/2026) | auto | T2 tuần sau (29/06) |
| TC-05 | T2 (22/06/2026) | today | T2 (22/06) |
| TC-06 | T7 (27/06/2026) | today | T2 tuần sau (29/06) |
| TC-07 | Bất kỳ | manual | Ngày admin chọn |
| TC-08 | Bất kỳ | manual + T7/CN | Vẫn gửi T7/CN + cảnh báo cam |

---

## Test Steps

### Step 1: Mở trang Schedule

╔══════════════════════════════════════════════════════════════╗
║  SCREEN: Login - Báo Cơm                                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║    ┌──────────────────────────────┐                           ║
║    │ Username:                   │                           ║
║    │ [__________________________] │  ← Nhập: admin           ║
║    └──────────────────────────────┘                           ║
║                                                              ║
║    ┌──────────────────────────────┐                           ║
║    │ Password:                    │                           ║
║    │ [__________________________] │  ← Nhập: admin123        ║
║    └──────────────────────────────┘                           ║
║                                                              ║
║              [   Login   ]  ← CLICK                          ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Đăng nhập với tài khoản admin                       ║
║  EXPECTED: Chuyển đến trang chính admin                      ║
╚══════════════════════════════════════════════════════════════╝

---

╔══════════════════════════════════════════════════════════════╗
║  SCREEN: Admin Home                                          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 🍱 Báo Cơm Admin         [👤 admin ▼]                   │ ║
║  │                                                         │ ║
║  │ Sidebar:                                                │ ║
║  │  • Dashboard                                            │ ║
║  │  • Book                                                  │ ║
║  │  • Reports                                              │ ║
║  │  • Settings                                             │ ║
║  │  • Zalo Bot  ← active                                   │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Click "Zalo Bot" trong sidebar                      ║
║  EXPECTED: Chuyển đến trang Zalo Bot                          ║
╚══════════════════════════════════════════════════════════════╝

---

╔══════════════════════════════════════════════════════════════╗
║  SCREEN: Zalo Bot Admin                                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Zalo Bot      [📤 Gửi] [📅 Lịch] [📜 Lịch sử]          │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Click tab "📅 Lịch"                                 ║
║  EXPECTED: Mở ScheduleTab                                    ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 2: Schedule Tab - mặc định ban đầu

╔══════════════════════════════════════════════════════════════╗
║  SCREEN: Schedule - Lịch tự động gửi "báo cơm"             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ⏰ Lịch tự động gửi "báo cơm"                              ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ [○━━━━]  Bật gửi tự động                              │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  ⏸️ Auto-send đang tắt                                       ║
║     Tin nhắn sẽ chỉ gửi khi bạn bấm "Gửi thử ngay".         ║
║                                                              ║
║  ─────────────────────────────────────────────────────────   ║
║                                                              ║
║                              [ 📤 Gửi thử ngay ]  ← CLICK   ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Quan sát toggle "Bật gửi tự động" đang TẮT         ║
║  EXPECTED: Hiển thị empty state "Auto-send đang tắt"         ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 3: Bật auto-send

╔══════════════════════════════════════════════════════════════╗
║  SCREEN: Schedule - Sau khi bật                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ⏰ Lịch tự động gửi "báo cơm"                              ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ [━━━━●]  Bật gửi tự động     ← CLICK toggle bật      │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │  🎯 Phương thức chọn ngày                              │  ║
║  │                                                        │  ║
║  │  ┌──────────────────────────────────────────────────┐  │  ║
║  │  │ (●) Tự động theo rule cutoff                    │  │  ║
║  │  │     Luôn gửi workday kế tiếp (T2 sáng → T3).    │  │  ║
║  │  │     Bỏ T7/CN.                                   │  │  ║
║  │  └──────────────────────────────────────────────────┘  │  ║
║  │  ┌──────────────────────────────────────────────────┐  │  ║
║  │  │ ( ) Luôn gửi ngày hiện tại                      │  │  ║
║  │  │     Nếu rơi T7/CN → gửi T2 tuần sau.            │  │  ║
║  │  └──────────────────────────────────────────────────┘  │  ║
║  │  ┌──────────────────────────────────────────────────┐  │  ║
║  │  │ ( ) Chọn ngày thủ công                          │  │  ║
║  │  │     Admin tự đặt ngày cụ thể (có thể là T7/CN). │  │  ║
║  │  └──────────────────────────────────────────────────┘  │  ║
║  │                                                        │  ║
║  │  [ 💾 Lưu phương thức chọn ngày ]                       │  ║
║  │                                                        │  ║
║  │  📅 Ngày sẽ gửi tiếp: 23/06/2026 (T3)                 │  ║
║  │                                                        │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  📅 Khi nào gửi?                                             ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ T2-T6 hàng tuần lúc 8:00 sáng                       ▼ │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  🕐 Lần gửi tiếp: 8h sáng T2-T6 → T3, 23/6 lúc 08:00      ║
║                                                              ║
║  🍱 Nội dung tin nhắn                                        ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 🍱 Báo cơm {date}                                     │  ║
║  │ {registrations}                                        │  ║
║  │ 📋 Thực đơn: {menu}                                   │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  👁 Xem trước                                                ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 🍱 Báo cơm 23/06/2026                                 │  ║
║  │ 1. NCPT: 03 suất a/c (a, b, c)                        │  ║
║  │ 2. IT: 02 suất a/c (d, e)                              │  ║
║  │ 📋 Thực đơn:                                          │  ║
║  │ - Cơm gà                                              │  ║
║  │ - Canh chua                                            │  ║
║  └────────────────────────────────────────────────────────┘  ║
║  [ 🔄 Cập nhật preview ]                                    ║
║                                                              ║
║  ─────────────────────────────────────────────────────────   ║
║                                                              ║
║  [ 📤 Gửi thử ngay ]                                        ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Click toggle "Bật gửi tự động"                     ║
║  EXPECTED:                                                    ║
║    • Section "🎯 Phương thức chọn ngày" xuất hiện           ║
║    • Radio "Tự động theo rule cutoff" mặc định được chọn     ║
║    • Preview "Ngày sẽ gửi tiếp" hiển thị ngày kế tiếp       ║
║    • Preview nội dung dùng data ngày kế tiếp, KHÔNG phải    ║
║      ngày hôm nay                                             ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 4: TC-01 - Auto mode + hôm nay là T2 → target T3

╔══════════════════════════════════════════════════════════════╗
║  GIẢ LẬP: Hệ thống ngày T2 22/06/2026 (mock system date)   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 🎯 Phương thức chọn ngày                              │  ║
║  │  (●) Tự động theo rule cutoff                          │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  📅 Ngày sẽ gửi tiếp: 23/06/2026 (T3)  ← VERIFY            ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Quan sát preview "Ngày sẽ gửi tiếp"                ║
║  EXPECTED: Hiển thị "23/06/2026 (T3)" — workday kế tiếp     ║
║  PASS criteria:                                               ║
║    ☐ targetDate = 23/06/2026                                ║
║    ☐ targetDayName = T3                                      ║
║    ☐ Preview nội dung hiển thị menu + registrations T3      ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 5: TC-02 - Auto mode + hôm nay là T6 → target T2 tuần sau

╔══════════════════════════════════════════════════════════════╗
║  GIẢ LẬP: Hệ thống ngày T6 26/06/2026                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 🎯 Phương thức chọn ngày                              │  ║
║  │  (●) Tự động theo rule cutoff                          │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  📅 Ngày sẽ gửi tiếp: 29/06/2026 (T2)  ← VERIFY            ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Quan sát preview                                    ║
║  EXPECTED:                                                    ║
║    ☐ targetDate = 29/06/2026                                ║
║    ☐ targetDayName = T2 (skip T7 + CN)                       ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 6: TC-04 - Auto mode + hôm nay là CN → target T2 tuần sau

╔══════════════════════════════════════════════════════════════╗
║  GIẢ LẬP: Hệ thống ngày CN 28/06/2026                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 🎯 Phương thức chọn ngày                              │  ║
║  │  (●) Tự động theo rule cutoff                          │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  📅 Ngày sẽ gửi tiếp: 29/06/2026 (T2)  ← VERIFY            ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Quan sát preview                                    ║
║  EXPECTED:                                                    ║
║    ☐ targetDate = 29/06/2026                                ║
║    ☐ targetDayName = T2                                      ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 7: TC-05 - Chuyển sang Today mode → target = hôm nay

╔══════════════════════════════════════════════════════════════╗
║  GIẢ LẬP: Hệ thống ngày T2 22/06/2026                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 🎯 Phương thức chọn ngày                              │  ║
║  │  ( ) Tự động theo rule cutoff                          │  ║
║  │  (●) Luôn gửi ngày hiện tại  ← CLICK chọn             │  ║
║  │  ( ) Chọn ngày thủ công                               │  ║
║  │                                                        │  ║
║  │  [ 💾 Lưu phương thức chọn ngày ]  ← CLICK            │  ║
║  │                                                        │  ║
║  │  📅 Ngày sẽ gửi tiếp: 22/06/2026 (T2)  ← VERIFY      │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION:                                                      ║
║    1. Click radio "Luôn gửi ngày hiện tại"                  ║
║    2. Click "💾 Lưu phương thức chọn ngày"                  ║
║  EXPECTED:                                                    ║
║    ☐ Toast "Đã lưu cấu hình" xuất hiện                    ║
║    ☐ Preview cập nhật: 22/06/2026 (T2) = hôm nay            ║
║    ☐ Preview nội dung đổi sang data ngày 22/06              ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 8: TC-06 - Today mode + hôm nay là T7 → target T2 tuần sau

╔══════════════════════════════════════════════════════════════╗
║  GIẢ LẬP: Hệ thống ngày T7 27/06/2026                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 🎯 Phương thức chọn ngày                              │  ║
║  │  (●) Luôn gửi ngày hiện tại                          │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  📅 Ngày sẽ gửi tiếp: 29/06/2026 (T2)  ← VERIFY            ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Quan sát preview                                    ║
║  EXPECTED:                                                    ║
║    ☐ T7 → skip → target = 29/06/2026 (T2)                  ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 9: TC-07 - Manual mode + chọn ngày cụ thể

╔══════════════════════════════════════════════════════════════╗
║  SCREEN: Schedule - Manual mode                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 🎯 Phương thức chọn ngày                              │  ║
║  │  ( ) Tự động theo rule cutoff                          │  ║
║  │  ( ) Luôn gửi ngày hiện tại                          │  ║
║  │  (●) Chọn ngày thủ công  ← CLICK chọn                 │  ║
║  │                                                        │  ║
║  │  Ngày gửi cụ thể:                                      │  ║
║  │  ┌──────────────┐                                       │  ║
║  │  │ 2026-06-25   │  ← Nhập: 2026-06-25 (T5)            │  ║
║  │  └──────────────┘                                       │  ║
║  │                                                        │  ║
║  │  [ 💾 Lưu phương thức chọn ngày ]  ← CLICK            │  ║
║  │                                                        │  ║
║  │  📅 Ngày sẽ gửi tiếp: 25/06/2026 (T5)  ← VERIFY      │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION:                                                      ║
║    1. Click radio "Chọn ngày thủ công"                       ║
║    2. Date picker xuất hiện                                  ║
║    3. Chọn ngày 25/06/2026                                  ║
║    4. Click "💾 Lưu phương thức chọn ngày"                  ║
║  EXPECTED:                                                    ║
║    ☐ Toast "Đã lưu cấu hình"                                ║
║    ☐ Preview cập nhật: 25/06/2026 (T5)                      ║
║    ☐ Preview nội dung dùng data ngày 25/06                  ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 10: TC-08 - Manual mode + chọn ngày T7/CN → cảnh báo cam

╔══════════════════════════════════════════════════════════════╗
║  SCREEN: Schedule - Manual mode chọn T7                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 🎯 Phương thức chọn ngày                              │  ║
║  │  (●) Chọn ngày thủ công                               │  ║
║  │                                                        │  ║
║  │  Ngày gửi cụ thể:                                      │  ║
║  │  ┌──────────────┐                                       │  ║
║  │  │ 2026-06-27   │  ← Nhập: 2026-06-27 (T7)            │  ║
║  │  └──────────────┘                                       │  ║
║  │                                                        │  ║
║  │  ⚠️ Đã chọn ngày T7/CN — tin nhắn sẽ gửi cho ngày   │  ║
║  │     này (admin quyết định).                            │  ║
║  │                                                        │  ║
║  │  [ 💾 Lưu phương thức chọn ngày ]                       │  ║
║  │                                                        │  ║
║  │  📅 Ngày sẽ gửi tiếp: 27/06/2026 (T7)  ← VERIFY      │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION:                                                      ║
║    1. Chọn ngày 27/06/2026 (T7)                              ║
║  EXPECTED:                                                    ║
║    ☐ Cảnh báo màu cam hiển thị ngay dưới date picker       ║
║    ☐ VẪN cho phép lưu và gửi (admin quyết định)            ║
║    ☐ targetDate = 27/06/2026 (giữ T7)                       ║
║    ☐ targetDayName = T7                                      ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 11: Gửi thử ngay để verify message thật

╔══════════════════════════════════════════════════════════════╗
║  SCREEN: Schedule - Gửi thử                                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Sau khi chọn mode = Manual + date = 25/06/2026             ║
║                                                              ║
║  ─────────────────────────────────────────────────────────   ║
║                                                              ║
║  [ 📤 Gửi thử ngay ]  ← CLICK                               ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION:                                                      ║
║    1. Click "📤 Gửi thử ngay"                                ║
║    2. Mở group Zalo đã chọn                                  ║
║  EXPECTED:                                                    ║
║    ☐ Toast "Đã gửi thử!" xuất hiện                         ║
║    ☐ Trong group Zalo có message mới chứa "25/06/2026"       ║
║    ☐ Nội dung menu + registrations khớp với data ngày 25/06  ║
║    ☐ KHÔNG có ngày khác trong message                        ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 12: Verify qua API

╔══════════════════════════════════════════════════════════════╗
║  TEST: Gọi API kiểm tra shape response                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  $ curl -b cookies.txt http://localhost:3000/api/zalo/auto-send
║                                                              ║
║  EXPECTED response:                                           ║
║  {                                                           ║
║    "enabled": true,                                          ║
║    "cron": "0 8 * * 1-5",                                    ║
║    "mode": "manual",                                         ║
║    "manualDate": "2026-06-24T17:00:00.000Z",                 ║
║    "targetDate": "25/06/2026",                               ║
║    "targetDayName": "T5"                                     ║
║  }                                                           ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ mode = "manual"                                          ║
║    ☐ manualDate khớp với ISO string                          ║
║    ☐ targetDate = "25/06/2026"                               ║
║    ☐ targetDayName = "T5"                                    ║
╚══════════════════════════════════════════════════════════════╝

---

## Regression Test Checklist

Sau khi pass tất cả TC, chạy regression:

- [ ] Cron tab UI vẫn hoạt động (chọn preset, nhập cron custom)
- [ ] Toggle Bật/Tắt auto-send vẫn hoạt động
- [ ] "Gửi thử ngay" khi groupId null vẫn hiển thị warning
- [ ] "Gửi thử ngay" khi groupId set vẫn gửi thành công
- [ ] Phần "Xem trước" vẫn hiển thị preview với template đúng
- [ ] "Cập nhật preview" button refresh data
- [ ] Đổi cron expression → trigger restart cron thành công
- [ ] Đổi template → message format cập nhật

---

## Edge Cases

| # | Case | Expected |
|---|---|---|
| E1 | Manual mode nhưng chưa chọn date → click Lưu | Toast "Chọn ngày trước khi lưu" |
| E2 | Auto-send OFF → section Phương thức chọn ngày ẩn | Chỉ hiển thị empty state |
| E3 | Bật auto-send ON → section Phương thức chọn ngày hiện ra | Radio mặc định = "Tự động" |
| E4 | PATCH mode=invalid (vd "wrong") | Toast error "mode phải là auto/today/manual" |
| E5 | DB chưa có config mode → mặc định auto | Radio hiển thị "Tự động" được chọn |
| E6 | T7 + manual mode + T7 → gửi data T7 | Vẫn gửi, cảnh báo cam hiển thị |
| E7 | Cron tick T2 8h + mode auto → gửi data T3 | Message trong group chứa "23/06/2026" |

---

## Sign-off

| Role | Name | Date | Result |
|---|---|---|---|
| Tester | __________ | __________ | ☐ Pass ☐ Fail |
| Admin | __________ | __________ | ☐ Pass ☐ Fail |
| Notes | | | |
