# UAT Test: Zalo Bot — Toàn bộ Features (NF / AF / EF)

## Ngày: 2026-07-06

## Mục tiêu

Test toàn bộ chức năng Zalo Bot với 3 loại flow:
- **NF (Normal Flow)**: Luồng bình thường, đúng预期
- **AF (Alternative Flow)**: Luồng thay thế hợp lệ (user chọn cách khác)
- **EF (Exception Flow)**: Luồng lỗi, ngoại lệ, edge case

---

## Test Data (từ Database thực tế)

| Data | Giá trị | Nguồn |
|---|---|---|
| Admin username | `admin` | DB: User table |
| Admin password | `admin123` | App config |
| groupId hiện tại | `5506436216265422412` | DB: ZaloConfig (zalo.groupId) |
| autoSendEnabled | `true` | DB: ZaloConfig |
| cron hiện tại | `*/10 * * * *` | DB: ZaloConfig (zalo.autoSend.cron) |
| threadId (group test) | `6910594314981483821` | Send log history |
| userAgent | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) baocom-bot/1.0` | Credentials file |
| Credentials path | `data/zalo-bot-credentials.json` | src/lib/zalo/paths.ts |
| Send log path | `data/zalo-bot-send-log.jsonl` | src/lib/zalo/send-log.ts |
| Error log path | `data/zalo-bot-errors.log` | src/lib/zalo/paths.ts |

**LƯU Ý**: Khi test API, dùng `threadId` từ send log history (ví dụ: `6910594314981483821` hoặc `5506436216265422412`), KHÔNG dùng giá trị giả.

---

## Tổng quan Features

| # | Feature | API Routes | Components |
|---|---------|-----------|------------|
| 1 | QR Login | POST /api/zalo/qr | SetupCard |
| 2 | Session KeepAlive | GET/POST /api/zalo/debug/keepalive | StatusBar |
| 3 | Logout | DELETE /api/zalo/qr | SetupCard, StatusBar |
| 4 | Send Message | POST /api/zalo/send | SendTab |
| 5 | Auto-Send | GET/POST /api/zalo/auto-send | ScheduleTab |
| 6 | Send History | GET /api/zalo/auto-send/recent | RecentTab, MiniHistory |
| 7 | Config | GET/PATCH /api/zalo/config | GroupPicker, CronBuilder |
| 8 | Groups | GET /api/zalo/groups | GroupPicker |
| 9 | Status | GET /api/zalo/status | ZaloStatusDot, StatusBar |
| 10 | Stats | GET /api/zalo/stats | DashboardTab |
| 11 | Credentials | File: data/zalo-bot-credentials.json | — |
| 12 | Error Handling | classifyZaloError | — |
| 13 | Send Log | File: data/zalo-send-log.jsonl | RecentTab |

---

## Feature 1: QR Login

### NF-1.1: Quét QR thành công

╔══════════════════════════════════════════════════════════════╗
║  SCREEN: Zalo Bot — Chưa kết nối                             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. Mở /admin/zalo-bot                                      ║
║  2. Click "Bắt đầu quét QR"                                 ║
║  3. QR code hiển thị                                         ║
║  4. Mở Zalo điện thoại → quét QR                            ║
║  5. Xác nhận trên điện thoại                                 ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ QR image hiển thị (base64 PNG)                          ║
║    ☐ Status: "Đang kết nối..." → "Đã kết nối"               ║
║    ☐ Toast: "Đã kết nối Zalo Bot!"                          ║
║    ☐ credentials file được lưu                               ║
║    ☐ keepAlive tự động start                                 ║
║    ☐ Sidebar: "Bot kết nối" (dot xanh)                       ║
╚══════════════════════════════════════════════════════════════╝

### AF-1.1: Hủy quét QR (QR hết hạn)

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ QR hết hạn sau ~2 phút                                  ║
║    ☐ Status vẫn "Đang kết nối..."                            ║
║    ☐ Có thể click lại để tạo QR mới                         ║
╚══════════════════════════════════════════════════════════════╝

### AF-1.2: Từ chối đăng nhập trên điện thoại

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Status: "Đã từ chối đăng nhập."                         ║
║    ☐ State: DISCONNECTED                                     ║
║    ☐ Có thể thử lại                                         ║
╚══════════════════════════════════════════════════════════════╝

### EF-1.1: Mở Zalo Web cùng lúc khi listener active

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Listener bị ngắt (chỉ 1 web listener/account)          ║
║    ☐ Bot vẫn CONNECTED nhưng không nhận message             ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 2: Session KeepAlive

### NF-2.1: KeepAlive interval 15 phút

╔══════════════════════════════════════════════════════════════╗
║  API: GET /api/zalo/debug/keepalive                          ║
║  EXPECTED:                                                    ║
║    ☐ keepAlive.active = true                                 ║
║    ☐ keepAlive.intervalMs = 900000 (15 phút)                ║
║    ☐ session.startedAt = ISO timestamp                       ║
║    ☐ session.maxAgeMs = 14400000 (4 giờ)                    ║
╚══════════════════════════════════════════════════════════════╝

### NF-2.2: Trigger keepAlive thủ công

╔══════════════════════════════════════════════════════════════╗
║  API: POST { triggerNow: true }                              ║
║  EXPECTED:                                                    ║
║    ☐ ok = true                                               ║
║    ☐ result.config_vesion = số                               ║
║    ☐ keepAlive.lastKeepAliveAt cập nhật                     ║
╚══════════════════════════════════════════════════════════════╝

### NF-2.3: Thay đổi interval

╔══════════════════════════════════════════════════════════════╗
║  API: POST { intervalMs: 120000 }                            ║
║  EXPECTED:                                                    ║
║    ☐ keepAlive.intervalMs = 120000                           ║
║    ☐ keepAlive.active = true                                 ║
╚══════════════════════════════════════════════════════════════╝

### NF-2.4: Restart keepAlive

╔══════════════════════════════════════════════════════════════╗
║  API: POST { restart: true, intervalMs: 60000 }              ║
║  EXPECTED:                                                    ║
║    ☐ Timer cũ bị xóa                                        ║
║    ☐ Timer mới tạo với interval mới                          ║
║    ☐ keepAlive.active = true                                 ║
╚══════════════════════════════════════════════════════════════╝

### NF-2.5: Proactive session recycling

╔══════════════════════════════════════════════════════════════╗
║  Khi session age >= 4 giờ:                                    ║
║  EXPECTED:                                                    ║
║    ☐ Bot tự re-login từ credentials                          ║
║    ☐ session.recycleCount tăng                               ║
║    ☐ session.startedAt reset                                 ║
║    ☐ keepAlive tiếp tục chạy                                 ║
╚══════════════════════════════════════════════════════════════╝

### EF-2.1: KeepAlive fail → retry exponential backoff

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ attempt 1: retry 30s                                    ║
║    ☐ attempt 2: retry 60s                                    ║
║    ☐ attempt 3: emit keepalive-warning + retry 120s          ║
║    ☐ attempt 4: retry 240s                                   ║
║    ☐ attempt 5: tryReLoginFromCredentials()                  ║
║    ☐ Nếu re-login OK → reset, keepAlive resume              ║
║    ☐ Nếu re-login fail → state = EXPIRED                     ║
╚══════════════════════════════════════════════════════════════╝

### EF-2.2: Không có credentials → EXPIRED

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Bot.state = EXPIRED                                     ║
║    ☐ UI: "Bot hết hạn", "Cần quét QR lại"                   ║
║    ☐ Button "Kết nối lại bằng QR" hiển thị                  ║
╚══════════════════════════════════════════════════════════════╝

### EF-2.3: Credentials corrupt (JSON invalid)

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ loadCredentials() throw "credentials file bị hỏng"      ║
║    ☐ Bot không crash                                         ║
║    ☐ State = DISCONNECTED hoặc EXPIRED                       ║
╚══════════════════════════════════════════════════════════════╝

### AF-2.1: KeepAlive đang chạy → gọi startKeepAlive() lần nữa

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Không tạo timer mới (singleton-safe)                    ║
║    ☐ Giữ nguyên timer cũ                                    ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 3: Logout

### NF-3.1: Logout thành công

╔══════════════════════════════════════════════════════════════╗
║  1. Click "Đăng xuất" trên StatusBar                        ║
║  2. Confirm dialog: "Đăng xuất bot? Cần quét QR lại."       ║
║  3. Click OK                                                 ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ credentials file bị xóa                                 ║
║    ☐ Bot.state = DISCONNECTED                                ║
║    ☐ keepAlive stopped                                       ║
║    ☐ sessionStartedAt reset                                  ║
║    ☐ Toast: "Đã đăng xuất bot"                               ║
║    ☐ UI hiển thị "Bot chưa kết nối" + "Bắt đầu quét QR"   ║
╚══════════════════════════════════════════════════════════════╝

### AF-3.1: Hủy logout (Cancel dialog)

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Không có thay đổi                                       ║
║    ☐ Bot vẫn CONNECTED                                       ║
╚══════════════════════════════════════════════════════════════╝

### EF-3.1: Logout khi đang send message

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Message đang gửi có thể fail                            ║
║    ☐ Bot chuyển DISCONNECTED                                  ║
║    ║  Không crash                                             ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 4: Send Message

### NF-4.1: Gửi tin nhắn thành công

╔══════════════════════════════════════════════════════════════╗
║  API: POST /api/zalo/send                                    ║
║  Body: { text: "Hello", threadId: "6910594314981483821" }    ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ ok = true                                               ║
║    ☐ msgId = string                                          ║
║    ☐ sentAt = ISO timestamp                                  ║
║    ☐ Message xuất hiện trong group Zalo                      ║
║    ☐ Send log được ghi                                       ║
╚══════════════════════════════════════════════════════════════╝

### NF-4.2: Gửi qua SendTab UI

╔══════════════════════════════════════════════════════════════╗
║  1. Mở tab "Gửi ngay"                                       ║
║  2. Nhập tin nhắn                                            ║
║  3. Click "Gửi"                                              ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ Toast: "Đã gửi thử!"                                   ║
║    ☐ Message trong group Zalo                                ║
║    ☐ Recent tab cập nhật                                     ║
╚══════════════════════════════════════════════════════════════╝

### AF-4.1: Gửi khi bot chưa kết nối

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Button "Gửi" disabled                                   ║
║    ☐ Hoặc: Toast error "Bot chưa kết nối"                    ║
╚══════════════════════════════════════════════════════════════╝

### EF-4.1: Text rỗng

╔══════════════════════════════════════════════════════════════╗
║  API: POST { text: "", threadId: "123" }                     ║
║  EXPECTED:                                                    ║
║    ☐ Error: "text phải có độ dài 1-2000 ký tự"              ║
║    ☐ Status: 400                                             ║
╚══════════════════════════════════════════════════════════════╝

### EF-4.2: Text > 2000 ký tự

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Error: "text phải có độ dài 1-2000 ký tự"              ║
║    ☐ Status: 400                                             ║
╚══════════════════════════════════════════════════════════════╝

### EF-4.3: threadId rỗng

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Error: "threadId required"                              ║
╚══════════════════════════════════════════════════════════════╝

### EF-4.4: Zalo API fail (rate-limit)

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Error: "Zalo đang giới hạn tốc độ"                      ║
║    ☐ Status: 429                                             ║
║    ☐ Bot vẫn CONNECTED (không disconnect)                    ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 5: Auto-Send

### NF-5.1: Bật auto-send

╔══════════════════════════════════════════════════════════════╗
║  1. Mở tab "Hẹn giờ"                                        ║
║  2. Toggle "Bật gửi tự động"                                ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ Toggle ON                                               ║
║    ☐ Section "Phương thức chọn ngày" xuất hiện              ║
║    ☐ Radio "Tự động theo rule cutoff" mặc định              ║
║    ☐ Preview "Ngày sẽ gửi tiếp" hiển thị                    ║
╚══════════════════════════════════════════════════════════════╝

### NF-5.2: Cron chạy đúng lịch

╔══════════════════════════════════════════════════════════════╗
║  Cron: "0 8 * * 1-5" (8h sáng T2-T6)                       ║
║  EXPECTED:                                                    ║
║    ☐ Message tự động gửi vào 8h sáng                         ║
║    ☐ Nội dung: menu + registrations ngày target             ║
║    ☐ Send log ghi lại                                        ║
╚══════════════════════════════════════════════════════════════╝

### NF-5.3: Trigger auto-send thủ công

╔══════════════════════════════════════════════════════════════╗
║  API: POST /api/zalo/auto-send                               ║
║  EXPECTED:                                                    ║
║    ☐ ok = true                                               ║
║    ☐ action = "started"                                      ║
║    ☐ Message gửi đến group                                   ║
╚══════════════════════════════════════════════════════════════╝

### NF-5.4: Xem preview

╔══════════════════════════════════════════════════════════════╗
║  Click "Cập nhật preview"                                    ║
║  EXPECTED:                                                    ║
║    ☐ Hiển thị message mẫu với data ngày target              ║
║    ☐ Format: 🍱 Báo cơm {date}\n{registrations}\n📋 Thực đơn:\n{menu}
╚══════════════════════════════════════════════════════════════╝

### AF-5.1: Chọn mode "Today"

╔══════════════════════════════════════════════════════════════╗
║  Radio: "Luôn gửi ngày hiện tại"                             ║
║  EXPECTED:                                                    ║
║    ☐ targetDate = hôm nay                                    ║
║    ☐ Nếu T7/CN → skip → T2 tuần sau                        ║
╚══════════════════════════════════════════════════════════════╝

### AF-5.2: Chọn mode "Manual"

╔══════════════════════════════════════════════════════════════╗
║  Radio: "Chọn ngày thủ công"                                ║
║  EXPECTED:                                                    ║
║    ☐ Date picker xuất hiện                                   ║
║    ☐ Admin chọn ngày cụ thể                                 ║
║    ☐ Nếu chọn T7/CN → cảnh báo cam                         ║
╚══════════════════════════════════════════════════════════════╝

### AF-5.3: Đổi cron expression

╔══════════════════════════════════════════════════════════════╗
║  CronBuilder: chọn preset hoặc nhập custom                  ║
║  EXPECTED:                                                    ║
║    ☐ Cron expression cập nhật                                ║
║    ☐ "Lần gửi tiếp" hiển thị đúng                           ║
║    ☐ Auto-send restart với cron mới                          ║
╚══════════════════════════════════════════════════════════════╝

### AF-5.4: Tắt auto-send

╔══════════════════════════════════════════════════════════════╗
║  Toggle OFF                                                  ║
║  EXPECTED:                                                    ║
║    ☐ Cron scheduler stopped                                  ║
║    ☐ Empty state: "Auto-send đang tắt"                       ║
║    ☐ Config vẫn giữ nguyên (không xóa)                      ║
╚══════════════════════════════════════════════════════════════╝

### EF-5.1: Auto-send khi groupId chưa set

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Không gửi (skip)                                        ║
║    ☐ Error log: "groupId not configured"                     ║
║    ║  Không crash                                             ║
╚══════════════════════════════════════════════════════════════╝

### EF-5.2: Auto-send khi bot disconnected

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Không gửi                                               ║
║    ☐ Error log: "Bot chưa được xác thực"                     ║
║    ☐ Auto-send vẫn scheduled (thử lại lần sau)              ║
╚══════════════════════════════════════════════════════════════╝

### EF-5.3: Auto-send fail → Zalo rate-limit

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Error logged                                            ║
║    ☐ Bot vẫn CONNECTED                                       ║
║    ☐ Lần auto-send tiếp theo sẽ thử lại                     ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 6: Send History

### NF-6.1: Xem lịch sử gửi

╔══════════════════════════════════════════════════════════════╗
║  Tab "Lịch sử"                                               ║
║  EXPECTED:                                                    ║
║    ☐ Danh sách entries (mới nhất đầu)                        ║
║    ☐ Mỗi entry: timestamp, kind, status, preview             ║
║    ☐ Hiển thị "auto" hoặc "tay" cho kind                    ║
╚══════════════════════════════════════════════════════════════╝

### NF-6.2: API recent entries

╔══════════════════════════════════════════════════════════════╗
║  API: GET /api/zalo/auto-send/recent?limit=20                ║
║  EXPECTED:                                                    ║
║    ☐ entries = array                                         ║
║    ☐ Mỗi entry có: timestamp, kind, status, threadId, preview║
╚══════════════════════════════════════════════════════════════╝

### EF-6.1: Send log file không tồn tại

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ readRecent trả về array rỗng                            ║
║    ☐ Không crash                                             ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 7: Config Management

### NF-7.1: Xem config

╔══════════════════════════════════════════════════════════════╗
║  API: GET /api/zalo/config                                   ║
║  EXPECTED:                                                    ║
║    ☐ groupId, autoSendEnabled, cron, template, mode          ║
║    ☐ manualDate (null nếu mode != manual)                    ║
╚══════════════════════════════════════════════════════════════╝

### NF-7.2: Cập nhật config

╔══════════════════════════════════════════════════════════════╗
║  API: PATCH /api/zalo/config                                 ║
║  Body: { cron: "0 9 * * 1-5" }                              ║
║  EXPECTED:                                                    ║
║    ☐ Config cập nhật                                         ║
║    ☐ Auto-send restart với cron mới                          ║
╚══════════════════════════════════════════════════════════════╝

### EF-7.1: Cron expression không hợp lệ

╔══════════════════════════════════════════════════════════════╗
║  PATCH { cron: "invalid" }                                   ║
║  EXPECTED:                                                    ║
║    ☐ Error: "Cron expression không hợp lệ"                   ║
║    ☐ Config không thay đổi                                   ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 8: Group Management

### NF-8.1: Lấy danh sách groups

╔══════════════════════════════════════════════════════════════╗
║  API: GET /api/zalo/groups                                   ║
║  EXPECTED:                                                    ║
║    ☐ Array of groups (groupId, name, memberCount)            ║
║    ☐ Cache 5 phút                                            ║
╚══════════════════════════════════════════════════════════════╝

### NF-8.2: Chọn group đích

╔══════════════════════════════════════════════════════════════╗
║  GroupPicker: chọn group từ dropdown                         ║
║  EXPECTED:                                                    ║
║    ☐ groupId cập nhật trong config                           ║
║    ☐ "Đang gửi đến: {groupName}"                             ║
╚══════════════════════════════════════════════════════════════╝

### NF-8.3: Refresh danh sách groups

╔══════════════════════════════════════════════════════════════╗
║  Click "Refresh danh sách"                                   ║
║  EXPECTED:                                                    ║
║    ☐ Bỏ qua cache                                            ║
║    ☐ Fetch lại từ Zalo API                                   ║
║    ☐ Danh sách cập nhật                                      ║
╚══════════════════════════════════════════════════════════════╝

### AF-8.1: Nhập groupId thủ công

╔══════════════════════════════════════════════════════════════╗
║  Nhập groupId vào textbox → Click "Lưu"                     ║
║  EXPECTED:                                                    ║
║    ☐ groupId cập nhật                                        ║
║    ☐ Button "Lưu" disabled nếu rỗng                         ║
╚══════════════════════════════════════════════════════════════╝

### EF-8.1: Bot chưa kết nối → lấy groups

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ GroupPicker disabled hoặc trả rỗng                      ║
║    ║  Không crash                                             ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 9: Status & Monitoring

### NF-9.1: Status API

╔══════════════════════════════════════════════════════════════╗
║  API: GET /api/zalo/status                                   ║
║  EXPECTED:                                                    ║
║    ☐ state: DISCONNECTED/CONNECTING/CONNECTED/RECONNECTING/EXPIRED
║    ☐ account: { displayName, avatar }                        ║
║    ☐ lastConnectedAt, lastError                              ║
╚══════════════════════════════════════════════════════════════╝

### NF-9.2: Stats API

╔══════════════════════════════════════════════════════════════╗
║  API: GET /api/zalo/stats                                    ║
║  EXPECTED:                                                    ║
║    ☐ totalSent, successCount, errorCount                     ║
║    ☐ nextFire (lần gửi tiếp)                                 ║
╚══════════════════════════════════════════════════════════════╝

### NF-9.3: ZaloStatusDot

╔══════════════════════════════════════════════════════════════╗
║  Sidebar component                                           ║
║  EXPECTED:                                                    ║
║    ☐ DISCONNECTED: dot xám                                   ║
║    ☐ CONNECTING: dot vàng nhấp nháy                          ║
║    ☐ CONNECTED: dot xanh lá                                  ║
║    ☐ RECONNECTING: dot cam nhấp nháy                         ║
║    ☐ EXPIRED: dot đỏ                                         ║
║    ☐ Poll mỗi 30 giây                                        ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 10: Dashboard

### NF-10.1: Dashboard Tab

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Thống kê: Tổng đã gửi, Thành công, Lỗi 7 ngày         ║
║    ☐ Lần gửi tiếp                                            ║
║    ☐ Nhóm đích                                               ║
║    ☐ Lần gửi gần nhất                                        ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 11: Credentials

### NF-11.1: Lưu credentials

╔══════════════════════════════════════════════════════════════╗
║  File: data/zalo-bot-credentials.json                        ║
║  EXPECTED:                                                    ║
║    ☐ JSON với cookie, imei, userAgent, savedAt               ║
║    ☐ cookie là array of objects (key, value, domain...)      ║
║    ☐ savedAt là ISO timestamp                                ║
╚══════════════════════════════════════════════════════════════╝

### NF-11.2: Load credentials

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Trả về StoredCreds object                               ║
║    ☐ Validate đủ 3 trường bắt buộc                          ║
╚══════════════════════════════════════════════════════════════╝

### EF-11.1: File không tồn tại

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ loadCredentials() trả về null                           ║
║    ║  Không throw                                           ║
╚══════════════════════════════════════════════════════════════╝

### EF-11.2: File bị corrupt

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ loadCredentials() throw "credentials file bị hỏng"      ║
╚══════════════════════════════════════════════════════════════╝

### EF-11.3: Thiếu trường bắt buộc

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ loadCredentials() throw "credentials thiếu trường bắt buộc"
╚══════════════════════════════════════════════════════════════╝

---

## Feature 12: Error Handling

### NF-12.1: classifyZaloError

╔══════════════════════════════════════════════════════════════╗
║  Error types:                                                ║
║    ☐ auth → "Bot chưa được xác thực" (503)                  ║
║    ☐ expired → "Bot hết hạn, cần kết nối lại" (503)         ║
║    ☐ rate-limit → "Zalo đang giới hạn tốc độ" (429)         ║
║    ☐ transient → "Zalo server lỗi tạm thời" (502)           ║
║    ☐ fatal → "QR bị huỷ" hoặc "Từ chối đăng nhập" (400)   ║
║    ☐ unknown → "Lỗi hệ thống" (500)                         ║
╚══════════════════════════════════════════════════════════════╝

### NF-12.2: Error logging

╔══════════════════════════════════════════════════════════════╗
║  File: data/zalo-bot-errors.log                              ║
║  EXPECTED:                                                    ║
║    ☐ Mỗi dòng là JSON                                        ║
║    ☐ Có timestamp, error info                                ║
║    ☐ Append (không ghi đè)                                   ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 13: Retry Logic

### NF-13.1: withRetry

╔══════════════════════════════════════════════════════════════╗
║  Retry cho transient errors                                  ║
║  EXPECTED:                                                    ║
║    ☐ Retry với delay tăng dần                                ║
║    ☐ Stop retry khi error không retryable                    ║
║    ☐ Throw lỗi cuối cùng nếu hết retry                      ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 14: Auto-Connect on Startup

### NF-14.1: Server restart → auto-connect

╔══════════════════════════════════════════════════════════════╗
║  1. Restart server                                           ║
║  2. Mở /admin/zalo-bot                                      ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ Status route gọi ensureLoggedIn() nếu credentials tồn tại
║    ☐ Bot tự login lại                                       ║
║    ☐ State = CONNECTED                                       ║
║    ☐ Không cần quét QR                                       ║
╚══════════════════════════════════════════════════════════════╝

### EF-14.1: Server restart + credentials sai

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ Auto-connect fail gracefully                            ║
║    ☐ State = DISCONNECTED                                    ║
║    ☐ Không 500 error                                         ║
║    ☐ UI: "Bot chưa kết nối"                                 ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 15: Singleton & HMR

### NF-15.1: Singleton survives hot-reload

╔══════════════════════════════════════════════════════════════╗
║  EXPECTED:                                                    ║
║    ☐ globalThis.__zaloBot giữ instance                       ║
║    ☐ HMR không tạo instance mới nếu class shape không đổi   ║
║    ☐ Nếu class shape đổi → tạo instance mới                 ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 16: UI Components (bổ sung)

### NF-16.1: Tabs Navigation

╔══════════════════════════════════════════════════════════════╗
║  Component: Tabs.tsx                                         ║
║  Tabs: Dashboard / Gửi ngay / Hẹn giờ / Lịch sử            ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ Click tab → URL cập nhật (?tab=dashboard|send|schedule|history)
║    ☐ Tab active highlight                                    ║
║    ☐ Content切换 tương ứng                                   ║
║    ☐ Tab "Gửi ngay" disabled khi bot chưa kết nối           ║
╚══════════════════════════════════════════════════════════════╝

### NF-16.2: Toast Notifications

╔══════════════════════════════════════════════════════════════╗
║  Component: Toast.tsx                                        ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ Success toast (xanh lá): "Đã kết nối Zalo Bot!"        ║
║    ☐ Error toast (đỏ): "Bot hết hạn"                         ║
║    ☐ Info toast (xanh dương): "Đã đăng xuất bot"            ║
║    ☐ Toast tự ẩn sau ~5 giây (trừ error có autoHideMs=0)   ║
║    ☐ Click "Đóng" để dismiss thủ công                        ║
║    ☐ Nhiều toast cùng lúc → stack                            ║
╚══════════════════════════════════════════════════════════════╝

### NF-16.3: StatCard

╔══════════════════════════════════════════════════════════════╗
║  Component: StatCard.tsx                                     ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ Hiển thị icon + label + value                           ║
║    ☐ Responsive trên mobile                                  ║
║    ☐ Value cập nhật khi data thay đổi                       ║
╚══════════════════════════════════════════════════════════════╝

### NF-16.4: RequireConnected Guard

╔══════════════════════════════════════════════════════════════╗
║  Component: RequireConnected.tsx                             ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ Nếu bot.state !== 'CONNECTED' → redirect về hub        ║
║    ☐ Nếu bot.state === 'CONNECTED' → render children        ║
║    ☐ Send/Hẹn giờ tabs bị guard                              ║
╚══════════════════════════════════════════════════════════════╝

---

## Feature 17: Edge Cases bổ sung

### EF-17.1: Send route fallback threadId

╔══════════════════════════════════════════════════════════════╗
║  API: POST /api/zalo/send { text: "test" }  (KHÔNG threadId)║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ Tự động lấy threadId từ getGroupId()                   ║
║    ☐ Nếu groupId đã set → gửi thành công                    ║
║    ☐ Nếu groupId chưa set → error "Chưa chọn group đích"    ║
╚══════════════════════════════════════════════════════════════╝

### EF-17.2: Config setManualDate

╔══════════════════════════════════════════════════════════════╗
║  API: PATCH /api/zalo/config                                 ║
║  Body: { mode: "manual", manualDate: "2026-07-10" }         ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ mode = "manual"                                         ║
║    ☐ manualDate = ISO string hợp lệ                          ║
║    ☐ Preview hiển thị ngày đã chọn                          ║
╚══════════════════════════════════════════════════════════════╝

### EF-17.3: Credentials file permissions (non-Windows)

╔══════════════════════════════════════════════════════════════╗
║  Trên Linux/Mac:                                              ║
║  EXPECTED:                                                    ║
║    ☐ File permissions = 0o600 (chỉ owner đọc/ghi)           ║
║    ☐ Trên Windows: skip chmod (best-effort)                  ║
╚══════════════════════════════════════════════════════════════╝

### EF-17.4: Stats computeNextFire edge cases

╔══════════════════════════════════════════════════════════════╗
║  Cron expressions phức tạp:                                   ║
║                                                              ║
║  EXPECTED:                                                    ║
║    ☐ "0 8 * * 1-5" → tìm T2-T6 kế tiếp                    ║
║    ☐ "0 8 * * 1,3,5" → tìm T2/T4/T6 kế tiếp              ║
║    ☐ "0 8 * * *" → tìm ngày kế tiếp                        ║
║    ☐ Cron quá phức tạp → trả null (không crash)             ║
║    ☐ Đã qua giờ hôm nay → nhảy sang ngày mai               ║
╚══════════════════════════════════════════════════════════════╝

### EF-17.5: Error log file format

╔══════════════════════════════════════════════════════════════╗
║  File: data/zalo-bot-errors.log                              ║
║  EXPECTED:                                                    ║
║    ☐ Mỗi dòng là JSON object                                 ║
║    ☐ Có trường: ts (ISO timestamp), error info               ║
║    ☐ Append mode (không ghi đè khi restart)                  ║
║    ☐ Nếu file chưa tồn tại → tạo mới                        ║
╚══════════════════════════════════════════════════════════════╝

---

## Test Matrix Summary

| Feature | NF | AF | EF | Total |
|---------|----|----|-----|-------|
| QR Login | 1 | 2 | 1 | 4 |
| KeepAlive | 5 | 1 | 3 | 9 |
| Logout | 1 | 1 | 1 | 3 |
| Send Message | 2 | 1 | 4 | 7 |
| Auto-Send | 4 | 4 | 3 | 11 |
| Send History | 2 | 0 | 1 | 3 |
| Config | 2 | 0 | 1 | 3 |
| Groups | 3 | 1 | 1 | 5 |
| Status | 3 | 0 | 0 | 3 |
| Dashboard | 1 | 0 | 0 | 1 |
| Credentials | 2 | 0 | 3 | 5 |
| Error Handling | 2 | 0 | 0 | 2 |
| Retry | 1 | 0 | 0 | 1 |
| Auto-Connect | 1 | 0 | 1 | 2 |
| Singleton | 1 | 0 | 0 | 1 |
| UI Components | 4 | 0 | 0 | 4 |
| Edge Cases | 0 | 0 | 5 | 5 |
| **TOTAL** | **35** | **9** | **24** | **68** |

---

## Sign-off

| Role | Name | Date | Result |
|---|---|---|---|
| Tester | __________ | __________ | ☐ Pass ☐ Fail |
| Admin | __________ | __________ | ☐ Pass ☐ Fail |
| Notes | | | |
