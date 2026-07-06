# UAT Test Scenario: Zalo Session KeepAlive — Proactive Recycling

## Objective

Validate cơ chế duy trì phiên đăng nhập Zalo hoạt động đúng:
- Proactive session recycling — recycle trước khi session expire
- Adaptive keepAlive interval — 15 phút (thay vì 5 phút)
- State `RECONNECTING` — hiển thị đúng khi đang reconnect
- Session monitoring — debug endpoint trả về đúng session info

## Prerequisites

- App chạy tại `http://localhost:3000`
- Đã đăng nhập với tài khoản admin (`admin` / `admin123`)
- Zalo bot đã connect (state = `CONNECTED`)
- File `data/zalo-bot-credentials.json` tồn tại với cookie/imei/userAgent hợp lệ
- Browser: Chrome latest version

## Test Matrix

| Scenario | Mô tả | Expected |
|---|---|---|
| TC-01 | KeepAlive interval mặc định = 15 phút | `intervalMs = 900000` |
| TC-02 | Session monitoring — GET debug endpoint | Response có `session` object |
| TC-03 | Proactive recycle — verify recycleCount | recycleCount = 0 (chưa đủ 4h) |
| TC-03b | sessionStartedAt reset sau re-login | startedAt là timestamp mới |
| TC-04 | State RECONNECTING khi đang reconnect | UI hiển thị "Đang kết nối lại..." |
| TC-05 | Recycle fail (credentials sai) → giữ session cũ | State vẫn CONNECTED |
| TC-05b | Không có credentials → EXPIRED ngay | State = EXPIRED |
| TC-06 | Server restart → auto-connect | Bot tự login lại từ credentials |
| TC-07 | KeepAlive fail → retry → re-login | Exponential backoff → auto re-login |
| TC-08 | KeepAlive fail 5 lần → EXPIRED | Cần quét QR lại |
| TC-09 | Thay đổi keepAlive interval qua API | intervalMs thay đổi |
| TC-10 | Restart keepAlive timer | Timer reset |
| TC-11 | Warning event ở attempt 3 | keepalive-warning emit |
| TC-12 | UI disable khi RECONNECTING | SendTab, GroupPicker disable |
| TC-13 | Auto-send sau session recycle | Auto-send vẫn hoạt động |
| TC-14 | LoginInFlight lock | Concurrent calls bị skip |
| TC-15 | Interval validation | Reject interval không hợp lệ |

---

## Test Steps

### Step 1: Đăng nhập Admin

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

### Step 2: Mở trang Zalo Bot

╔══════════════════════════════════════════════════════════════╗
║  SCREEN: Admin Sidebar                                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 🍱 Báo Cơm Admin                                        │ ║
║  │                                                         │ ║
║  │  📊 Dashboard                                           │ ║
║  │  👥 Nhân viên                                           │ ║
║  │  🏢 Phòng ban                                           │ ║
║  │  📅 Thực đơn                                           │ ║
║  │  🎉 Ngày lễ                                            │ ║
║  │  📊 Báo cáo                                             │ ║
║  │  ⚙️ Cài đặt                                            │ ║
║  │  🤖 Zalo Bot  ← CLICK                                   │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Click "🤖 Zalo Bot" trong sidebar                   ║
║  EXPECTED: Chuyển đến trang Zalo Bot Hub                     ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 3: TC-01 — Verify KeepAlive Interval = 15 phút

╔══════════════════════════════════════════════════════════════╗
║  TEST: Gọi API kiểm tra keepAlive interval                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  $ curl -b cookies.txt http://localhost:3000/api/zalo/debug/keepalive
║                                                              ║
║  EXPECTED response:                                           ║
║  {                                                           ║
║    "bot": {                                                  ║
║      "state": "CONNECTED",                                   ║
║      "account": { "displayName": "Bot Zalo" },               ║
║      "lastConnectedAt": "2026-07-06T...",                    ║
║      "lastError": null,                                      ║
║      "hasQr": false                                          ║
║    },                                                        ║
║    "keepAlive": {                                            ║
║      "active": true,                                         ║
║      "intervalMs": 900000,        ← 15 PHÚT                 ║
║      "lastKeepAliveAt": "2026-07-06T...",                    ║
║      "lastKeepAliveResult": { "config_vesion": 2 }           ║
║    },                                                        ║
║    "session": {                                              ║
║      "startedAt": "2026-07-06T...",                          ║
║      "ageMs": 123456,                                        ║
║      "maxAgeMs": 14400000,        ← 4 GIỜ                   ║
║      "nextRecycleAt": "2026-07-06T...",                      ║
║      "recycleCount": 0                                       ║
║    }                                                         ║
║  }                                                           ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ keepAlive.intervalMs = 900000 (15 phút)                ║
║    ☐ keepAlive.active = true                                 ║
║    ☐ session.startedAt không null                            ║
║    ☐ session.ageMs > 0                                       ║
║    ☐ session.maxAgeMs = 14400000 (4 giờ)                    ║
║    ☐ session.recycleCount = 0                                ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 4: TC-02 — Session Monitoring — Verify session object

╔══════════════════════════════════════════════════════════════╗
║  TEST: Kiểm tra session status qua debug endpoint            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Gọi API:                                                     ║
║  $ curl -b cookies.txt http://localhost:3000/api/zalo/debug/keepalive
║                                                              ║
║  Kiểm tra response JSON:                                      ║
║                                                              ║
║  ✅ "session.startedAt" = ISO timestamp hợp lệ              ║
║  ✅ "session.ageMs" = số > 0 (thời gian session đã sống)    ║
║  ✅ "session.maxAgeMs" = 14400000 (4 giờ = ngưỡng recycle)  ║
║  ✅ "session.nextRecycleAt" = ISO timestamp                   ║
║  ✅ "session.recycleCount" = 0 (chưa lần nào recycle)       ║
║                                                              ║
║  Verify:                                                      ║
║    ☐ nextRecycleAt = startedAt + maxAgeMs                    ║
║    ☐ ageMs ≈ now - startedAt                                ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Gọi API GET /api/zalo/debug/keepalive              ║
║  EXPECTED: Response chứa session object đầy đủ              ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 5: TC-03 — Proactive Recycle khi session >= 4h

╔══════════════════════════════════════════════════════════════╗
║  TEST: Verify proactive recycle hoạt động                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  BƯỚC 1: Gọi keepAlive lần đầu (bình thường)               ║
║                                                              ║
║  $ curl -b cookies.txt -X POST \                             ║
║    http://localhost:3000/api/zalo/debug/keepalive \           ║
║    -d '{"triggerNow": true}'                                 ║
║                                                              ║
║  → Ghi nhận: session.recycleCount = 0                        ║
║  → Ghi nhận: session.startedAt = "2026-07-06T..."           ║
║                                                              ║
║  BƯỚC 2: Verify recycleCount ban đầu = 0                     ║
║                                                              ║
║  $ curl -b cookies.txt http://localhost:3000/api/zalo/debug/keepalive
║                                                              ║
║  EXPECTED: session.recycleCount = 0  ← VERIFY                ║
║                                                              ║
║  BƯỚC 3: Trigger keepAlive lại (giả lập session đủ lâu)     ║
║                                                              ║
║  ⚠️ LƯU Ý: Không thể chờ 4h thật trong UAT manual.          ║
║  Cách verify: Gọi triggerNow nhiều lần → mỗi lần keepAlive  ║
║  OK → check session.ageMs tăng dần. Khi ageMs >= maxAgeMs   ║
║  → recycleCount sẽ tăng.                                     ║
║                                                              ║
║  Hoặc verify qua unit test (đã pass):                        ║
║  - tests/unit/zalo-keepalive.test.ts → "recycleSession tăng  ║
║    recycleCount khi thành công"                              ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ Lần 1: recycleCount = 0 (chưa recycle)                 ║
║    ☐ keepAlive.result.config_vesion = số                     ║
║    ☐ bot.state = "CONNECTED"                                 ║
║    ☐ session.startedAt được ghi nhận                         ║
║    ☐ Unit test verify recycleCount tăng sau recycle          ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Gọi keepAlive, verify recycleCount và session state ║
║  EXPECTED: keepAlive OK, recycleCount = 0 (chưa đủ 4h)      ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 5b: TC-03b — Verify sessionStartedAt reset sau re-login

╔══════════════════════════════════════════════════════════════╗
║  TEST: sessionStartedAt reset khi re-login thành công         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. Ghi nhận session.startedAt hiện tại                      ║
║     $ curl -b cookies.txt http://localhost:3000/api/zalo/debug/keepalive
║     → startedAt_old = response.session.startedAt             ║
║                                                              ║
║  2. Trigger keepAlive (re-login nếu cần)                     ║
║     $ curl -b cookies.txt -X POST \                          ║
║       http://localhost:3000/api/zalo/debug/keepalive \        ║
║       -d '{"triggerNow": true}'                              ║
║                                                              ║
║  3. Gọi lại GET để verify                                    ║
║     $ curl -b cookies.txt http://localhost:3000/api/zalo/debug/keepalive
║     → startedAt_new = response.session.startedAt             ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ startedAt_new là ISO timestamp hợp lệ                   ║
║    ☐ startedAt_new >= startedAt_old                          ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Verify sessionStartedAt được update đúng            ║
║  EXPECTED: startedAt là timestamp mới                         ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 6: TC-04 — State RECONNECTING (giả lập qua console)

╔══════════════════════════════════════════════════════════════╗
║  TEST: Verify state RECONNECTING hiển thị đúng trên UI       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Mở Browser Console (F12) → Network tab                      ║
║                                                              ║
║  Trigger reconnect bằng cách:                                 ║
║  1. Đổi cookie trong credentials file thành giá trị sai      ║
║  2. Gọi POST triggerNow → keepAlive fail                     ║
║  3. Bot thử re-login → state = RECONNECTING                  ║
║                                                              ║
║  Quan sát UI:                                                 ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Status Bar:                                              │ ║
║  │   🟠 Đang kết nối lại...     ← VERIFY                   │ ║
║  │   Đang khôi phục kết nối...  ← VERIFY                   │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ Status dot = 🟠 cam nhấp nháy (animate-pulse)          ║
║    ☐ Label = "Đang kết nối lại..."                           ║
║    ☐ Sub text = "Đang khôi phục kết nối..."                  ║
║    ☐ KHÔNG giống "Đang kết nối..." (CONNECTING)              ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Trigger re-login, quan sát Status Bar               ║
║  EXPECTED: Hiển thị "Đang kết nối lại..." màu cam           ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 7: TC-05 — Recycle Fail → Giữ session cũ (credentials sai)

╔══════════════════════════════════════════════════════════════╗
║  TEST: Recycle fail khi credentials sai → KHÔNG chuyển EXPIRED║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ⚠️ ĐÂY LÀ TEST CASE RIÊNG, KHÁC với Step 10 (TC-08).      ║
║  Step 10: credentials sai + keepAlive fail 5 lần → EXPIRED   ║
║  Step 7:  credentials sai + keepAlive 1 lần fail → giữ cũ   ║
║                                                              ║
║  Giả lập: Ghi đè credentials với cookie sai NHƯNG vẫn có    ║
║  đủ trường (cookie, imei, userAgent):                         ║
║                                                              ║
║  $ echo '{"cookie":"bad-cookie","imei":"test-imei",           ║
║    "userAgent":"test-ua","savedAt":"2026-07-06T00:00:00Z"}'  ║
║    > data\zalo-bot-credentials.json                          ║
║                                                              ║
║  Trigger keepAlive 1 lần:                                     ║
║  $ curl -b cookies.txt -X POST \                             ║
║    http://localhost:3000/api/zalo/debug/keepalive \           ║
║    -d '{"triggerNow": true}'                                 ║
║                                                              ║
║  EXPECTED:                                                    ║
║  {                                                           ║
║    "ok": false,                                              ║
║    "error": "...",                                           ║
║    "kind": "expired" hoặc "auth",                            ║
║    "bot": {                                                  ║
║      "state": "CONNECTED",  ← VẪN CONNECTED (chưa EXPIRED)  ║
║      ...                                                     ║
║    }                                                         ║
║  }                                                           ║
║                                                              ║
║  ⚠️ LƯU Ý: keepAlive fail 1 lần → retry → chưa đạt ngưỡng  ║
║  5 lần → nên state vẫn CONNECTED. Chỉ khi fail đủ 5 lần     ║
║  liên tiếp + re-login cũng fail → mới chuyển EXPIRED.        ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ ok = false (keepAlive fail)                             ║
║    ☐ bot.state = "CONNECTED" (KHÔNG phải EXPIRED)            ║
║    ☐ Credentials file vẫn tồn tại (không bị xóa)            ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Ghi đè credentials sai, trigger keepAlive 1 lần    ║
║  EXPECTED: keepAlive fail nhưng state vẫn CONNECTED           ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 7b: TC-05b — Không có credentials → EXPIRED ngay

╔══════════════════════════════════════════════════════════════╗
║  TEST: Xóa credentials → trigger keepAlive → EXPIRED          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  $ del data\zalo-bot-credentials.json                        ║
║  $ curl -b cookies.txt -X POST \                             ║
║    http://localhost:3000/api/zalo/debug/keepalive \           ║
║    -d '{"triggerNow": true}'                                 ║
║                                                              ║
║  EXPECTED:                                                    ║
║  {                                                           ║
║    "ok": false,                                              ║
║    "error": "Bot chưa được setup",                           ║
║    "bot": { "state": "EXPIRED", ... }                        ║
║  }                                                           ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ ok = false                                              ║
║    ☐ bot.state = "EXPIRED"                                   ║
║    ☐ error message = "Bot chưa được setup"                   ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Xóa credentials, trigger keepAlive                  ║
║  EXPECTED: Bot chuyển EXPIRED vì không có credentials        ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 8: TC-06 — Server Restart → Auto-Connect

╔══════════════════════════════════════════════════════════════╗
║  TEST: Server restart → bot tự kết nối lại                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. Đảm bảo credentials file tồn tại:                       ║
║     $ dir data\zalo-bot-credentials.json                     ║
║     → File phải tồn tại                                      ║
║                                                              ║
║  2. Restart Next.js server:                                   ║
║     Ctrl+C trong terminal chạy server                        ║
║     $ npm run dev                                            ║
║                                                              ║
║  3. Mở browser → Admin → Zalo Bot                           ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Status Bar:                                              │ ║
║  │   🟢 Đã kết nối — Bot Zalo    ← VERIFY                 │ ║
║  │   Hoạt động ...                                          │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  4. Gọi API verify:                                          ║
║  $ curl -b cookies.txt http://localhost:3000/api/zalo/debug/keepalive
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ bot.state = "CONNECTED"                                 ║
║    ☐ keepAlive.active = true                                 ║
║    ☐ session.startedAt không null (session mới)              ║
║    ☐ KHÔNG cần quét QR lại                                   ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Restart server, kiểm tra bot status                 ║
║  EXPECTED: Bot tự connect lại, state = CONNECTED             ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 9: TC-07 — KeepAlive Fail → Retry → Re-Login

╔══════════════════════════════════════════════════════════════╗
║  TEST: KeepAlive fail → retry với exponential backoff        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Giả lập: Ngắt kết nối mạng tạm thời                       ║
║                                                              ║
║  1. Mở DevTools → Network → Offline                         ║
║  2. Chờ keepAlive trigger (mỗi 15 phút)                     ║
║  3. Bật lại mạng                                             ║
║                                                              ║
║  Quan sát console log server:                                 ║
║  [zalo-bot] keepAlive failed (attempt 1/5)                   ║
║  [zalo-bot] keepAlive retry in 30000ms...                    ║
║  [zalo-bot] keepAlive failed (attempt 2/5)                   ║
║  [zalo-bot] keepAlive retry in 60000ms...                    ║
║  ...                                                         ║
║  [zalo-bot] keepAlive retries exhausted, attempting auto re-login...
║  [zalo-bot] re-login OK, state=CONNECTED                     ║
║  [zalo-bot] Auto re-login successful, keepAlive resumed      ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ Retry delays: 30s, 60s, 120s, 240s, 480s              ║
║    ☐ Warning emit ở attempt 3                                ║
║    ☐ Re-login attempt ở attempt 5                            ║
║    ☐ Nếu re-login OK → keepAlive resume                     ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Ngắt mạng, chờ keepAlive fail, bật lại mạng       ║
║  EXPECTED: Retry → re-login → CONNECTED                     ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 10: TC-08 — KeepAlive Fail 5 lần → EXPIRED

╔══════════════════════════════════════════════════════════════╗
║  TEST: Hết retry → re-login fail → state = EXPIRED           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Giả lập: Credentials hết hạn (cookie rotated by server)     ║
║                                                              ║
║  1. Ghi đè credentials với cookie sai:                       ║
║     $ echo '{"cookie":"expired","imei":"x","userAgent":"x",  ║
║       "savedAt":"2026-01-01"}' > data\zalo-bot-credentials.json
║                                                              ║
║  2. Trigger keepAlive:                                       ║
║     $ curl -b cookies.txt -X POST \                          ║
║       http://localhost:3000/api/zalo/debug/keepalive \        ║
║       -d '{"triggerNow": true}'                              ║
║                                                              ║
║  3. Quan sát UI:                                             ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Status Bar:                                              │ ║
║  │   🔴 Bot hết hạn              ← VERIFY                  │ ║
║  │   Session hết hạn, cần quét QR lại                      │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ bot.state = "EXPIRED"                                   ║
║    ☐ lastError.kind = "expired"                              ║
║    ☐ lastError.message = "Session hết hạn, cần quét QR lại" ║
║    ☐ Status dot = 🔴 đỏ                                      ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Ghi đè credentials sai, trigger keepAlive           ║
║  EXPECTED: Bot chuyển EXPIRED, yêu cầu quét QR              ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 11: Verify qua Database (SQLite)

╔══════════════════════════════════════════════════════════════╗
║  TEST: Kiểm tra ZaloConfig trong SQLite                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Session state KHÔNG lưu trong DB (nằm trong memory),        ║
║  nhưng ZaloConfig lưu cấu hình auto-send:                    ║
║                                                              ║
║  $ python sqlite-tools/scripts/sqlite_query.py \             ║
║      --database prisma/dev.db \                              ║
║      --query "SELECT * FROM ZaloConfig"                      ║
║                                                              ║
║  EXPECTED:                                                    ║
║  {                                                           ║
║    "rows": [                                                 ║
║      { "key": "zalo.groupId", "value": "9876543210" },       ║
║      { "key": "zalo.autoSend.enabled", "value": "true" },    ║
║      { "key": "zalo.autoSend.cron", "value": "*/10 * * * *" }║
║    ]                                                         ║
║  }                                                           ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ ZaloConfig có ít nhất 3 rows                            ║
║    ☐ groupId = "9876543210"                                  ║
║    ☐ autoSend.enabled = "true"                               ║
║    ☐ autoSend.cron hợp lệ                                    ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Query ZaloConfig table                              ║
║  EXPECTED: Config data hợp lệ                                ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 12: Verify Credentials File

╔══════════════════════════════════════════════════════════════╗
║  TEST: Kiểm tra file credentials tồn tại và hợp lệ          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  $ type data\zalo-bot-credentials.json                       ║
║                                                              ║
║  EXPECTED content:                                            ║
║  {                                                           ║
║    "cookie": ["..."],        ← cookie string/array           ║
║    "imei": "...",            ← device identifier             ║
║    "userAgent": "...",       ← browser user agent            ║
║    "savedAt": "2026-07-06T..."  ← ISO timestamp             ║
║  }                                                           ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ File tồn tại                                            ║
║    ☐ JSON parse thành công                                   ║
║    ☐ Có đủ 4 trường: cookie, imei, userAgent, savedAt       ║
║    ☐ cookie không rỗng                                       ║
║    ☐ savedAt là ISO timestamp hợp lệ                        ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Đọc file credentials                                ║
║  EXPECTED: File hợp lệ với đầy đủ trường                    ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 13: TC-09 — Thay đổi KeepAlive Interval

╔══════════════════════════════════════════════════════════════╗
║  TEST: POST intervalMs → thay đổi keepAlive interval         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. Gọi POST với intervalMs mới:                             ║
║  $ curl -b cookies.txt -X POST \                             ║
║    http://localhost:3000/api/zalo/debug/keepalive \           ║
║    -H "Content-Type: application/json" \                     ║
║    -d '{"intervalMs": 120000}'                               ║
║                                                              ║
║  2. Verify response:                                          ║
║  EXPECTED:                                                    ║
║  {                                                           ║
║    "ok": true,                                               ║
║    "keepAlive": {                                            ║
║      "active": true,                                         ║
║      "intervalMs": 120000  ← ĐÃ ĐỔI (2 phút)               ║
║    }                                                         ║
║  }                                                           ║
║                                                              ║
║  3. Verify lại qua GET:                                       ║
║  $ curl -b cookies.txt http://localhost:3000/api/zalo/debug/keepalive
║  → keepAlive.intervalMs = 120000                             ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ intervalMs = 120000 (đã thay đổi)                      ║
║    ☐ keepAlive.active = true (vẫn chạy)                      ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: POST intervalMs = 120000                            ║
║  EXPECTED: Interval thay đổi thành 2 phút                    ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 14: TC-10 — Restart KeepAlive

╔══════════════════════════════════════════════════════════════╗
║  TEST: POST restart → reset keepAlive timer                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  $ curl -b cookies.txt -X POST \                             ║
║    http://localhost:3000/api/zalo/debug/keepalive \           ║
║    -H "Content-Type: application/json" \                     ║
║    -d '{"restart": true, "intervalMs": 60000}'               ║
║                                                              ║
║  EXPECTED:                                                    ║
║  {                                                           ║
║    "ok": true,                                               ║
║    "keepAlive": {                                            ║
║      "active": true,                                         ║
║      "intervalMs": 60000   ← 1 phút                         ║
║    }                                                         ║
║  }                                                           ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ stopKeepAlive được gọi (timer cũ bị xóa)               ║
║    ☐ startKeepAlive được gọi với interval mới                ║
║    ☐ keepAlive.active = true                                 ║
║    ☐ intervalMs = 60000                                      ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: POST restart + intervalMs = 60000                   ║
║  EXPECTED: Timer reset, interval = 1 phút                    ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 15: TC-11 — KeepAlive Warning Event (attempt 3)

╔══════════════════════════════════════════════════════════════╗
║  TEST: Verify warning emit ở keepAlive attempt 3              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ⚠️ Khó test manual vì cần keepAlive fail 3 lần liên tiếp.  ║
║  Verify qua unit test đã pass:                               ║
║  - tests/unit/zalo-keepalive.test.ts                         ║
║                                                              ║
║  Logic cần verify (qua code review + unit test):              ║
║  - attempt 1: fail → retry 30s                               ║
║  - attempt 2: fail → retry 60s                               ║
║  - attempt 3: fail → emit keepalive-warning event            ║
║  - attempt 4: fail → retry 240s                              ║
║  - attempt 5: fail → tryReLoginFromCredentials()             ║
║                                                              ║
║  PASS criteria (unit test):                                   ║
║    ☐ KEEPALIVE_WARNING_THRESHOLD = 3                         ║
║    ☐ onEvent({ type: 'keepalive-warning', failures: 3 })    ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Verify qua unit test                                ║
║  EXPECTED: Warning emit đúng ở attempt 3                     ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 16: TC-12 — UI Components disable khi RECONNECTING

╔══════════════════════════════════════════════════════════════╗
║  TEST: SendTab, GroupPicker disable khi state = RECONNECTING  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ⚠️ Khó trigger RECONNECTING manual (chỉ tồn tại vài giây   ║
║  trong quá trình re-login). Verify qua code review:           ║
║                                                              ║
║  SendTab.tsx:100:                                             ║
║    const disabled = status.state !== 'CONNECTED' || busy      ║
║  → RECONNECTING → disabled = true ✅                         ║
║                                                              ║
║  GroupPicker.tsx:43:                                          ║
║    if (status.state !== 'CONNECTED') return undefined         ║
║  → RECONNECTING → return undefined (disable) ✅              ║
║                                                              ║
║  SetupCard.tsx:                                               ║
║    - Hiển thị UI khác nhau theo state                        ║
║    - RECONNECTING → không match case nào → hiển thị trống    ║
║    → Cần thêm case RECONNECTING nếu muốn hiển thị UI        ║
║                                                              ║
║  PASS criteria (code review):                                 ║
║    ☐ SendTab disable khi RECONNECTING                        ║
║    ☐ GroupPicker disable khi RECONNECTING                    ║
║    ☐ StatusBar hiển thị "Đang kết nối lại..."               ║
║    ☐ ZaloStatusDot hiển thị 🟠 cam nhấp nháy                ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Code review + trigger re-login nhanh để observe      ║
║  EXPECTED: UI disable đúng khi RECONNECTING                  ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 17: TC-13 — Auto-send vẫn hoạt động sau session recycle

╔══════════════════════════════════════════════════════════════╗
║  TEST: Auto-send hoạt động bình thường sau khi session recycle║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. Trigger keepAlive (recycle session):                      ║
║     $ curl -b cookies.txt -X POST \                          ║
║       http://localhost:3000/api/zalo/debug/keepalive \        ║
║       -d '{"triggerNow": true}'                              ║
║                                                              ║
║  2. Verify auto-send config vẫn còn:                         ║
║     $ curl -b cookies.txt http://localhost:3000/api/zalo/config
║                                                              ║
║  3. Trigger auto-send manual:                                 ║
║     $ curl -b cookies.txt -X POST \                          ║
║       http://localhost:3000/api/zalo/auto-send                ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ auto-send.enabled = true (không bị reset)               ║
║    ☐ auto-send.cron vẫn giữ nguyên                           ║
║    ☐ Gửi tin nhắn thành công (nếu group set)                ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Recycle session → verify auto-send                  ║
║  EXPECTED: Auto-send hoạt động bình thường                   ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 18: TC-14 — LoginInFlight Lock

╔══════════════════════════════════════════════════════════════╗
║  TEST: Concurrent keepAlive calls bị skip                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ⚠️ Khó test manual (cần timing chính xác).                  ║
║  Verify qua unit test:                                       ║
║  - tests/unit/zalo-keepalive.test.ts                         ║
║  - "recycleSession skip nếu loginInFlight"                   ║
║                                                              ║
║  Logic:                                                       ║
║  - Gọi triggerNow 2 lần nhanh liên tiếp                     ║
║  - Lần 2 sẽ skip vì loginInFlight = true                     ║
║                                                              ║
║  PASS criteria (unit test):                                   ║
║    ☐ recycleSession() return false khi loginInFlight         ║
║    ☐ Không tạo 2 login cùng lúc                              ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: Verify qua unit test                                ║
║  EXPECTED: Lock prevent concurrent login                     ║
╚══════════════════════════════════════════════════════════════╝

---

### Step 19: TC-15 — Interval validation

╔══════════════════════════════════════════════════════════════╗
║  TEST: POST intervalMs không hợp lệ → reject                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  $ curl -b cookies.txt -X POST \                             ║
║    http://localhost:3000/api/zalo/debug/keepalive \           ║
║    -H "Content-Type: application/json" \                     ║
║    -d '{"intervalMs": 500}'                                  ║
║                                                              ║
║  EXPECTED:                                                    ║
║  {                                                           ║
║    "error": "intervalMs phải là số từ 1000 đến 86400000 (24h)"
║  }                                                           ║
║  Status: 400                                                 ║
║                                                              ║
║  PASS criteria:                                               ║
║    ☐ intervalMs < 1000 → reject 400                          ║
║    ☐ intervalMs > 86400000 → reject 400                      ║
║    ☐ intervalMs = "abc" → reject 400                         ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ACTION: POST intervalMs không hợp lệ                        ║
║  EXPECTED: 400 Bad Request                                   ║
╚══════════════════════════════════════════════════════════════╝

---

## Edge Cases

| # | Case | Expected |
|---|---|---|
| E1 | Credentials file không tồn tại → trigger keepAlive | Bot.state = EXPIRED, error "Bot chưa được setup" |
| E2 | Credentials file bị corrupt (JSON invalid) | Bot.state = EXPIRED, error "credentials file bị hỏng" |
| E3 | KeepAlive đang chạy → gọi startKeepAlive() lần nữa | Không tạo timer mới (singleton-safe) |
| E4 | Session age = 3h59m → keepAlive OK | KHÔNG trigger recycle (dưới ngưỡng 4h) |
| E5 | Session age = 4h01m → keepAlive OK | Trigger proactive recycle |
| E6 | Recycle đang chạy → keepAlive trigger tiếp | Skip recycle (loginInFlight = true) |
| E7 | Server restart → credentials sai | ensureLoggedIn() fail → bot.state = DISCONNECTED (không phải EXPIRED, vì chưa đủ fail 2 lần) |
| E8 | keepAliveIntervalMs = 0 → startKeepAlive() | Dùng default 15 phút |

---

## Regression Test Checklist

Sau khi pass tất cả TC, chạy regression:

- [ ] QR scan flow vẫn hoạt động (initQR → scan → CONNECTED)
- [ ] Logout vẫn xóa credentials + stop keepAlive + reset sessionStartedAt
- [ ] Auto-send vẫn hoạt động đúng sau khi session recycle
- [ ] Gửi tin nhắn Zalo vẫn hoạt động (bot.send())
- [ ] Group list vẫn cache đúng (5 phút TTL)
- [ ] Debug endpoint GET trả về đúng shape (bot + keepAlive + session)
- [ ] Debug endpoint POST triggerNow hoạt động
- [ ] Debug endpoint POST intervalMs thay đổi interval
- [ ] Debug endpoint POST restart reset timer
- [ ] Status Bar hiển thị đúng tất cả 5 states (DISCONNECTED/CONNECTING/CONNECTED/RECONNECTING/EXPIRED)
- [ ] ZaloStatusDot hiển thị đúng màu cho mỗi state
- [ ] SendTab disabled khi state !== CONNECTED
- [ ] GroupPicker disabled khi state !== CONNECTED
- [ ] Interval validation reject giá trị không hợp lệ (< 1000 hoặc > 86400000)

---

## API Reference

### GET /api/zalo/debug/keepalive

```json
{
  "bot": {
    "state": "CONNECTED",
    "account": { "displayName": "Bot Zalo" },
    "lastConnectedAt": "ISO timestamp",
    "lastError": null,
    "hasQr": false
  },
  "keepAlive": {
    "active": true,
    "intervalMs": 900000,
    "lastKeepAliveAt": "ISO timestamp",
    "lastKeepAliveResult": { "config_vesion": 2 }
  },
  "session": {
    "startedAt": "ISO timestamp",
    "ageMs": 123456,
    "maxAgeMs": 14400000,
    "nextRecycleAt": "ISO timestamp",
    "recycleCount": 0
  }
}
```

### POST /api/zalo/debug/keepalive

```json
// Trigger keepAlive ngay
{ "triggerNow": true }

// Thay đổi interval
{ "intervalMs": 900000 }

// Restart keepAlive
{ "restart": true, "intervalMs": 60000 }
```

---

## Sign-off

| Role | Name | Date | Result |
|---|---|---|---|
| Tester | __________ | __________ | ☐ Pass ☐ Fail |
| Admin | __________ | __________ | ☐ Pass ☐ Fail |
| Notes | | | |
