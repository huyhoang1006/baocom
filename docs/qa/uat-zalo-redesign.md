# UAT Script — Zalo Bot Admin Redesign (Nested Routes)

> Ngày: 2026-06-26  
> Dev server: `http://localhost:3001` (port 3000 bị chiếm)  
> Tài khoản: `admin / admin123`

> **Ghi chú cập nhật**: `/admin/zalo-bot` đã được phân tách thành nested layout + sub-pages.
> Thay vì tabs trong 1 page, mỗi chức năng giờ là 1 route riêng: `/send`, `/schedule`, `/history`.
> Hub `/admin/zalo-bot` render SetupCard (khi chưa connect) hoặc dashboard tóm tắt (khi CONNECTED).

---

## Tổng quan luồng kiểm tra

```
┌──────────────────────────────────────────────────────────────┐
│                        UAT FLOW (Nested Routes)              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   L1: Login ──► Dashboard ──► Sidebar                        │
│                      │                                       │
│                      ▼                                       │
│   L2: /admin/zalo-bot  (Hub)                                 │
│           │                                                  │
│           ├── DISCONNECTED/EXPIRED/CONNECTING                │
│           │       └─► SetupCard (QR + logout)                │
│           │                                                  │
│           └── CONNECTED                                      │
│                   └─► Dashboard:                             │
│                       ├─► /send   (Gửi ngay)                │
│                       ├─► /schedule (Hẹn giờ)               │
│                       ├─► /history  (Lịch sử)               │
│                       └─► GroupPicker (ở hub)               │
│                                                              │
│   Mỗi sub-page dùng <RequireConnected>:                     │
│     • Nếu state ≠ CONNECTED → auto redirect về hub          │
│     • Nếu CONNECTED → render nội dung riêng                 │
│                                                              │
│   L3: Logout ──► DISCONNECTED ──► auto redirect sub-pages   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## L1: Login + điều hướng

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 1: Mở trang login                                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║           ┌──────────────────────────┐                       ║
║           │   🍴 BaoCom             │                       ║
║           │   Quản lý suất ăn       │                       ║
║           │                          │                       ║
║           │  ┌────────────────────┐  │                       ║
║           │  │ admin              │  │                       ║
║           │  ├────────────────────┤  │                       ║
║           │  │ ••••••••           │  │                       ║
║           │  └────────────────────┘  │                       ║
║           │                          │                       ║
║           │  [    Đăng nhập    ]     │                       ║
║           │                          │                       ║
║           │  Quên mật khẩu?          │                       ║
║           │                          │                       ║
║           └──────────────────────────┘                       ║
║                                                              ║
║  INPUT: username=admin, password=admin123                     ║
║  EXPECT: redirect → /admin/dashboard                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 2: Dashboard sau login                                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌──────────┬──────────────────────────────────────────────┐ ║
║  │ BaoCom   │  Dashboard — Ngày mai                        │ ║
║  │          │  Thứ Hai, 29/06                               │ ║
║  ├──────────┼──────────────────────────────────────────────┤ ║
║  │ Dashboard│                                              │ ║
║  │ Thực đơn │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │ ║
║  │ Lễ/nghỉ  │  │ 12   │ │ 12   │ │ 0    │ │ 12   │       │ ║
║  │ Nhân sự  │  │Total │ │Eat   │ │No eat│ │Done  │       │ ║
║  │ Phòng ban│  └──────┘ └──────┘ └──────┘ └──────┘       │ ║
║  │ Báo cáo  │                                              │ ║
║  │          │                                              │ ║
║  │ ─────── │                                              │ ║
║  │ ●Zalo Bot│                                              │ ║
║  │          │                                              │ ║
║  ├──────────┤                                              │ ║
║  │ Admin    │                                              │ ║
║  │ Cài đặt  │                                              │ ║
║  └──────────┴──────────────────────────────────────────────┘ ║
║                                                              ║
║  EXPECT: Sidebar hiện "●Zalo Bot" với status dot              ║
║          dot = gray (DISCONNECTED)                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 3: Click "Zalo Bot" trong sidebar                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  EXPECT: Navigate → /admin/zalo-bot (hub)                    ║
║          Trang hiện StatusBar + SetupCard (disconnected)     ║
║          KHÔNG có nav ngang (ẩn khi !CONNECTED)              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## L2a: Hub khi DISCONNECTED

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 4: Hub /admin/zalo-bot khi DISCONNECTED               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ╔═══════════════════════════════════════════════════════╗   ║
║  ║ ● 灰色 Bot chưa kết nối                              ║   ║
║  ╚═══════════════════════════════════════════════════════╝   ║
║  ↑ Status Bar (sticky, luôn hiện)                            ║
║  ↑ Nav ngang KHÔNG hiển thị (vì state != CONNECTED)          ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  Zalo Bot                                            │    ║
║  │  Kết nối tài khoản Zalo để gửi thông báo "báo cơm"  │    ║
║  │                                                       │    ║
║  │  ┌─────────────────────────────────────────────┐    │    ║
║  │  │  1. Kết nối                                  │    │    ║
║  │  │                                               │    │    ║
║  │  │           📱                                   │    │    ║
║  │  │                                               │    │    ║
║  │  │  Quét QR để kết nối tài khoản Zalo Bot       │    │    ║
║  │  │                                               │    │    ║
║  │  │       [ Bắt đầu quét QR ]                    │    │    ║
║  │  │                                               │    │    ║
║  │  │  💡 Dùng tài khoản Zalo phụ (không phải TK chính)  │    ║
║  │  └─────────────────────────────────────────────┘    │    ║
║  │                                                       │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  EXPECT:                                                      ║
║  ✓ StatusBar hiển thị "Bot chưa kết nối"                     ║
║  ✓ SetupCard hiện nút "Bắt đầu quét QR"                      ║
║  ✓ Nav ngang ẩN (3 link Gửi ngay / Hẹn giờ / Lịch sử)       ║
║  ✓ KHÔNG có GroupPicker                                       ║
║  ✓ KHÔNG có MiniHistory                                       ║
║  ✓ KHÔNG có quick-action cards                                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 5: Click "Bắt đầu quét QR"                            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  EXPECT:                                                      ║
║  ✓ POST /api/zalo/qr được gọi                                ║
║  ✓ State chuyển sang CONNECTING                               ║
║  ✓ StatusBar hiện "⏳ Đang kết nối..." + spinner              ║
║  ✓ SetupCard hiển thị QR code image + hướng dẫn              ║
║  ✓ "Mở Zalo trên điện thoại → quét mã bên dưới:"            ║
║  ✓ "⏱ QR hết hạn sau ~2 phút"                                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## L2b: Hub khi CONNECTING

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 6: Trạng thái CONNECTING                               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ╔═══════════════════════════════════════════════════════╗   ║
║  ║ ⏳ Đang kết nối...                                    ║   ║
║  ╚═══════════════════════════════════════════════════════╝   ║
║  ↑ Nav ngang vẫn ẨN (CONNECTING khác CONNECTED)              ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  ⏳ Đang chờ quét QR...                             │    ║
║  │                                                      │    ║
║  │  Mở Zalo trên điện thoại → quét mã bên dưới:       │    ║
║  │                                                      │    ║
║  │       ┌──────────────────┐                           │    ║
║  │       │    ▓▓▓▓▓▓▓▓▓▓   │                           │    ║
║  │       │    ▓▓▓▓▓▓▓▓▓▓   │                           │    ║
║  │       │    ▓▓ QR  ▓▓▓   │                           │    ║
║  │       │    ▓▓▓▓▓▓▓▓▓▓   │                           │    ║
║  │       │    ▓▓▓▓▓▓▓▓▓▓   │                           │    ║
║  │       └──────────────────┘                           │    ║
║  │                                                      │    ║
║  │  ⏱ QR hết hạn sau ~2 phút                           │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  EXPECT:                                                      ║
║  ✓ Polling interval = 2s (nhanh hơn 10s default)              ║
║  ✓ QR image hiển thị base64 PNG                              ║
║  ✓ Sau khi scan thành công → state = CONNECTED                ║
║  ✓ Toast "Đã kết nối Zalo Bot!" xuất hiện                    ║
║  ✓ Nav ngang xuất hiện với 3 link                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## L2c: Hub khi CONNECTED — Dashboard

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 7: Hub /admin/zalo-bot khi CONNECTED                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ╔═══════════════════════════════════════════════════════╗   ║
║  ║ ● 绿色 Đã kết nối — Nguyễn Văn A  2 phút trước  [⏏] ║   ║
║  ╚═══════════════════════════════════════════════════════╝   ║
║  ↑ StatusBar: dot xanh, tên TK, relative time, nút logout   ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  [📤 Gửi ngay] [⏰ Hẹn giờ] [📜 Lịch sử]            │    ║
║  ╰─────────────────────────────────────────────────────╯    ║
║  ↑ Nav ngang (horizontal) — chỉ hiện khi CONNECTED          ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  Zalo Bot                                            │    ║
║  │  Kết nối tài khoản Zalo để gửi thông báo "báo cơm"  │    ║
║  │                                                       │    ║
║  │  ┌───────────┬───────────┬───────────┐               │    ║
║  │  │ 📤         │ ⏰         │ 📜         │               │    ║
║  │  │ Gửi ngay  │ Hẹn giờ   │ Lịch sử   │               │    ║
║  │  │ Soạn và   │ Cấu hình  │ Xem các   │               │    ║
║  │  │ gửi thông │ auto-send │ lần gửi   │               │    ║
║  │  │ báo thủ   │ theo cron │ gần nhất  │               │    ║
║  │  │ công      │ + preview │           │               │    ║
║  │  └───────────┴───────────┴───────────┘               │    ║
║  │  ↑ Quick-action cards                                │    ║
║  │                                                       │    ║
║  │  ┌─────────────────────────────────────────────┐    │    ║
║  │  │  Nhóm đích                                   │    │    ║
║  │  │  ● Báo cơm  ID: 123456789 · 12 thành viên  │    │    ║
║  │  │  ⭐ Đã chọn                                   │    │    ║
║  │  └─────────────────────────────────────────────┘    │    ║
║  │  ↑ GroupPicker (ở hub khi CONNECTED)                 │    ║
║  │                                                       │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  EXPECT:                                                      ║
║  ✓ SetupCard KHÔNG hiện                                      ║
║  ✓ Nav ngang hiện 3 link (active state cho hub)              ║
║  ✓ 3 quick-action cards hiển thị với icons                   ║
║  ✓ GroupPicker hiện bên dưới cards                           ║
║  ✓ MiniHistory KHÔNG ở hub (chuyển sang /history)            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Sub-page 1: /send — Gửi ngay

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 8: Click "📤 Gửi ngay" từ hub                         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  URL: /admin/zalo-bot/send                                  ║
║                                                              ║
║  ╔═══════════════════════════════════════════════════════╗   ║
║  ║ ● 绿色 Đã kết nối — Nguyễn Văn A  2 phút trước  [⏏] ║   ║
║  ╚═══════════════════════════════════════════════════════╝   ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  [📤 Gửi ngay*] [⏰ Hẹn giờ] [📜 Lịch sử]            │    ║
║  ╰─────────────────────────────────────────────────────╯    ║
║  ↑ "Gửi ngay" highlighted (active)                            ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  📤 Gửi ngay                                         │    ║
║  │  Soạn và gửi thông báo thủ công vào group Zalo.   │    ║
║  │                                                       │    ║
║  │  ✏️ Soạn tin nhắn                                    │    ║
║  │  ┌─────────────────────────────────────────────┐    │    ║
║  │  │ Nhập nội dung thông báo cơm cho group...   │    │    ║
║  │  │                                             │    │    ║
║  │  └─────────────────────────────────────────────┘    │    ║
║  │  0/2000                                               │    ║
║  │                                                       │    ║
║  │  [🍱 Menu hôm nay] [⚠️ Ngày nghỉ] [✏️ Tùy chỉnh]   │    ║
║  │  ↑ Quick templates                                    │    ║
║  │                                                       │    ║
║  │  ──────────────────────────────────────────────      │    ║
║  │  0/2000                          [📤 Gửi]              │    ║
║  │  ↑ char count                  ↑ disabled khi trống  │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  TEST CASES:                                                  ║
║  ✓ URL thay đổi thành /admin/zalo-bot/send                   ║
║  ✓ Nav link "Gửi ngay" highlight (active state)              ║
║  ✓ Empty textarea → nút "📤 Gửi" disabled                    ║
║  ✓ Type text → char count update, nút enabled                 ║
║  ✓ Click "🍱 Menu hôm nay" → template auto-fill               ║
║  ✓ Click "📤 Gửi" → POST /api/zalo/send                      ║
║  ✓ Success → toast "✅ Đã gửi tin nhắn!" + clear textarea    ║
║  ✓ Fail → toast "❌ Gửi thất bại" + error description        ║
║  ✓ Last send footer hiện: "📝 Lần gửi gần nhất: HH:mm ..."  ║
║  ✓ KHÔNG có GroupPicker (ở hub)                              ║
║  ✓ KHÔNG có MiniHistory (ở /history)                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 9: Gửi tin nhắn thành công                            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  SAU KHI CLICK GỬI:                                         ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │                                                      │    ║
║  │  ✅ Đã gửi tin nhắn!                                │    ║
║  │  msgId: m-123                                       │    ║
║  │                                                      │    ║
║  │  ✏️ Soạn tin nhắn              [Đóng]               │    ║
║  │  ┌────────────────────────┐                         │    ║
║  │  │                        │  ← trống lại           │    ║
║  │  └────────────────────────┘                         │    ║
║  │  0/2000                                             │    ║
║  │                                                      │    ║
║  │  📝 Lần gửi gần nhất: 11:27:48 26/6/2026           │    ║
║  │  (msgId: m-123)                                     │    ║
║  │                                                      │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  EXPECT:                                                      ║
║  ✓ Toast thành công hiện 3s rồi tự ẩn                        ║
║  ✓ Textarea clear về rống                                    ║
║  ✓ Char count reset về 0/2000                                ║
║  ✓ Last send footer hiển thị timestamp + msgId               ║
║  ✓ URL KHÔNG đổi (vẫn ở /send)                               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Sub-page 2: /schedule — Hẹn giờ

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 10: Click "⏰ Hẹn giờ" từ nav hoặc hub               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  URL: /admin/zalo-bot/schedule                              ║
║                                                              ║
║  ╔═══════════════════════════════════════════════════════╗   ║
║  ║ ● 绿色 Đã kết nối — Nguyễn Văn A  2 phút trước  [⏏] ║   ║
║  ╚═══════════════════════════════════════════════════════╝   ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  [📤 Gửi ngay] [⏰ Hẹn giờ*] [📜 Lịch sử]           │    ║
║  ╰─────────────────────────────────────────────────────╯    ║
║  ↑ "Hẹn giờ" highlighted (active)                            ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  ⏰ Hẹn giờ                                          │    ║
║  │  Cấu hình auto-send theo lịch, chỉnh template       │    ║
║  │  và xem preview.                                     │    ║
║  │                                                       │    ║
║  │  ⏰ Lịch tự động gửi "báo cơm"                      │    ║
║  │                                                       │    ║
║  │  [●] Bật gửi tự động                                │    ║
║  │                                                       │    ║
║  │  📅 Khi nào gửi?                                     │    ║
║  │  ┌─────────────────────────────────────────────┐    │    ║
║  │  │ T2-T6 hàng tuần lúc 8:00 sáng           ▼  │    │    ║
║  │  └─────────────────────────────────────────────┘    │    ║
║  │                                                       │    ║
║  │  🕐 Lần gửi tiếp: 8h sáng T2-T6                     │    ║
║  │     → T2, 29/6 8:00                                  │    ║
║  │                                                       │    ║
║  │  🍱 Nội dung tin nhắn                                │    ║
║  │  ┌─────────────────────────────────────────────┐    │    ║
║  │  │ 🍱 Báo cơm {date}                          │    │    ║
║  │  │ {registrations}                              │    │    ║
║  │  │ 📋 Thực đơn: {menu}                          │    │    ║
║  │  └─────────────────────────────────────────────┘    │    ║
║  │  Biến: {date} {registrations} {menu}                 │    ║
║  │                                                       │    ║
║  │  👁 Xem trước                                         │    ║
║  │  ┌─────────────────────────────────────────────┐    │    ║
║  │  │ 🍱 Báo cơm 26/06/2026                        │    │    ║
║  │  │ 1. NCPT: 05 suất a/c (a, b, c, d, e)        │    │    ║
║  │  │ 📋 Thực đơn:                                  │    │    ║
║  │  │ - Thịt kho                                    │    │    ║
║  │  │ - Canh chua                                    │    │    ║
║  │  └─────────────────────────────────────────────┘    │    ║
║  │  [🔄 Cập nhật preview]                                │    ║
║  │                                                       │    ║
║  │  ──────────────────────────────────────────────      │    ║
║  │  [📤 Gửi thử ngay]                                   │    ║
║  │  ⚠️ Chưa chọn group đích (nếu chưa có)               │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  TEST CASES:                                                  ║
║  ✓ URL thay đổi thành /admin/zalo-bot/schedule               ║
║  ✓ Nav link "Hẹn giờ" highlight (active state)               ║
║  ✓ Toggle auto-send → PATCH /api/zalo/config                 ║
║  ✓ Chọn preset dropdown → auto-save cron                     ║
║  ✓ Chọn "⚙️ Tùy chỉnh" → hiện cron input                    ║
║  ✓ Type template → onBlur auto-save                          ║
║  ✓ Preview load lần đầu + sau khi edit template              ║
║  ✓ "📤 Gửi thử ngay" → POST /api/zalo/auto-send (runNow)   ║
║  ✓ Success → toast "✅ Đã gửi thử!" + timestamp             ║
║  ✓ Không có groupId → toast warning                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 11: Toggle auto-send OFF                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  SAU KHI TOGGLE OFF:                                         ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  ⏰ Lịch tự động gửi "báo cơm"                      │    ║
║  │                                                       │    ║
║  │  [○] Bật gửi tự động                                │    ║
║  │                                                       │    ║
║  │  ──────────────────────────────────────────────      │    ║
║  │                                                       │    ║
║  │            ⏸️                                        │    ║
║  │  Auto-send đang tắt                                  │    ║
║  │  Tin nhắn sẽ chỉ gửi khi bạn bấm                   │    ║
║  │  "Gửi thử ngay" bên dưới.                          │    ║
║  │                                                       │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  EXPECT:                                                      ║
║  ✓ Cron/template section bị ẩn                              ║
║  ✓ Disabled state hiện icon ⏸️ + message                     ║
║  ✓ URL KHÔNG đổi (vẫn ở /schedule)                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Sub-page 3: /history — Lịch sử

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 12: Click "📜 Lịch sử" từ nav hoặc hub                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  URL: /admin/zalo-bot/history                               ║
║                                                              ║
║  ╔═══════════════════════════════════════════════════════╗   ║
║  ║ ● 绿色 Đã kết nối — Nguyễn Văn A  2 phút trước  [⏏] ║   ║
║  ╚═══════════════════════════════════════════════════════╝   ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  [📤 Gửi ngay] [⏰ Hẹn giờ] [📜 Lịch sử*]           │    ║
║  ╰─────────────────────────────────────────────────────╯    ║
║  ↑ "Lịch sử" highlighted (active)                             ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  📜 Lịch sử gửi                                      │    ║
║  │  Các lần gửi gần nhất (auto + manual) đến group Zalo.│    ║
║  │                                                       │    ║
║  │  ┌────────────────────────┐                         │    ║
║  │  │ ✅ Auto-send            │                         │    ║
║  │  │    → thread 123456789   │                         │    ║
║  │  │    Báo cơm hôm nay     │     2 phút trước         │    ║
║  │  └────────────────────────┘                         │    ║
║  │                                                       │    ║
║  │  ┌────────────────────────┐                         │    ║
║  │  │ ✅ Gửi tay              │                         │    ║
║  │  │    → thread 123456789   │                         │    ║
║  │  │    Tin test E2E         │     vừa xong            │    ║
║  │  └────────────────────────┘                         │    ║
║  │                                                       │    ║
║  │  ──────────────────────────────────────────────      │    ║
║  │                                                       │    ║
║  │  ✅ Lần gửi gần nhất (auto): Báo cơm hôm nay        │    ║
║  │  ↑ MiniHistory (footer của /history)                  │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  TEST CASES:                                                  ║
║  ✓ URL thay đổi thành /admin/zalo-bot/history                ║
║  ✓ Nav link "Lịch sử" highlight (active state)               ║
║  ✓ Loading state: spinner + "Đang tải lịch sử…"              ║
║  ✓ Empty state: icon 📭 + "Chưa có lịch sử gửi nào"         ║
║  ✓ Entry hiện: ✅/❌ icon, kind, threadId, preview, time    ║
║  ✓ Failed entry hiện error message màu đỏ                   ║
║  ✓ Poll 30s tự refresh                                       ║
║  ✓ Fetch error → silent fallback (không crash)               ║
║  ✓ MiniHistory hiện ở footer (5 lần gần nhất)                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Auto-redirect guard (RequireConnected)

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 13: Auto-redirect khi state thay đổi                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Scenario A: Đang ở /send, state → EXPIRED                   ║
║                                                              ║
║  TRƯỚC:                                                       ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  URL: /admin/zalo-bot/send                           │    ║
║  │  [📤 Gửi ngay*] [⏰ Hẹn giờ] [📜 Lịch sử]           │    ║
║  │  ...SendTab content...                               │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  SAU 1-2s (polling detect EXPIRED):                          ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  URL: /admin/zalo-bot (hub) ← auto-redirect        │    ║
║  │  (Nav ngang ẩN)                                      │    ║
║  │  SetupCard hiện (EXPIRED state)                       │    ║
║  │  Toast "Bot hết hạn" hiện                            │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  Scenario B: User gõ trực tiếp /send khi DISCONNECTED        ║
║                                                              ║
║  TRƯỚC (URL bar):                                             ║
║  /admin/zalo-bot/send                                        ║
║                                                              ║
║  SAU 1s (RequireConnected redirect):                         ║
║  /admin/zalo-bot  ← URL tự đổi về hub                       ║
║  SetupCard hiện                                               ║
║                                                              ║
║  EXPECT:                                                      ║
║  ✓ RequireConnected hook phát hiện state != CONNECTED        ║
║  ✓ router.replace('/admin/zalo-bot') được gọi                ║
║  ✓ URL thay đổi về hub                                       ║
║  ✓ Không flash UI trống (return null trong lúc redirect)    ║
║  ✓ Toast EXPIRED hiện đúng nội dung                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## GroupPicker + MiniHistory (ở các vị trí mới)

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 14: GroupPicker — Chỉ ở hub khi CONNECTED             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  VỊ TRÍ: dưới 3 quick-action cards ở hub                     ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  Nhóm đích                                          │    ║
║  │                                                      │    ║
║  │  ┌──────────────────────────────────────────────┐  │    ║
║  │  │  🔍 Tìm kiếm group...                         │  │    ║
║  │  └──────────────────────────────────────────────┘  │    ║
║  │  ↑ hiện khi > 2 groups                             │    ║
║  │                                                      │    ║
║  │  ┌──────────────────────────────────────────────┐  │    ║
║  │  │  ● Báo cơm  ID: 123456789 · 12 thành viên   │  │    ║
║  │  │    ⭐ Đã chọn                                  │  │    ║
║  │  └──────────────────────────────────────────────┘  │    ║
║  │                                                      │    ║
║  │  Hoặc nhập groupId thủ công                         │    ║
║  │  ┌─────────────────────────┐  ┌──────┐             │    ║
║  │  │ vd: 1234567890          │  │📌 Lưu│             │    ║
║  │  └─────────────────────────┘  └──────┘             │    ║
║  │                                                      │    ║
║  │  ℹ️ Lấy groupId: Mở group Zalo → ⋮ Menu → ...     │    ║
║  │                                                      │    ║
║  │  ✓ Đang gửi đến: Báo cơm    [🔄 Refresh]           │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  TEST CASES:                                                  ║
║  ✓ GroupPicker CHỈ hiện ở hub, KHÔNG hiện ở /send /schedule ║
║  ✓ Load groups từ GET /api/zalo/groups khi CONNECTED          ║
║  ✓ Click group → PATCH /api/zalo/config (set groupId)        ║
║  ✓ Selected group highlight blue + "⭐ Đã chọn"              ║
║  ✓ Manual input + Lưu → validate regex 6-20 digits           ║
║  ✓ Search filter khi > 2 groups                              ║
║  ✓ Refresh button reload danh sách                           ║
║  ✓ Error toast khi PATCH fail                                ║
║  ✓ Sau khi chọn group, sang /send vẫn thấy group đã chọn     ║
║    (vì context share qua layout)                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 15: MiniHistory — Ở footer của /history                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  VỊ TRÍ: dưới RecentTab, ở /history                          ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  ✅ Lần gửi gần nhất (auto): Báo cơm hôm nay      │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  TEST CASES:                                                  ║
║  ✓ MiniHistory CHỈ ở /history, KHÔNG ở hub hay /send         ║
║  ✓ Không có data → render nothing (null)                     ║
║  ✓ Có data → hiện ✅/❌ + kind + preview                     ║
║  ✓ Poll 30s tự refresh                                       ║
║  ✓ Fetch error → silent (không crash)                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## L3: Logout

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 16: Logout bot                                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  BƯỚC 16a: Click nút "⏏ Đăng xuất" trên StatusBar           ║
║                                                              ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  ● 绿色 Đã kết nối — Admin  [⏏ Đăng xuất]         │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                              ║
║  EXPECT:                                                      ║
║  ✓ Confirm dialog: "Đăng xuất bot? Cần quét QR lại."        ║
║  ✓ Confirm → DELETE /api/zalo/qr                             ║
║  ✓ State → DISCONNECTED                                      ║
║  ✓ Toast "Đã đăng xuất bot"                                 ║
║  ✓ StatusBar dot chuyển gray                                 ║
║  ✓ Nav ngang biến mất                                       ║
║  ✓ Quick-action cards biến mất (chỉ hiện khi CONNECTED)     ║
║  ✓ GroupPicker biến mất                                      ║
║  ✓ SetupCard hiện thay                                       ║
║                                                              ║
║  BƯỚC 16b: Nếu đang ở /send /schedule /history              ║
║                                                              ║
║  EXPECT:                                                      ║
║  ✓ Auto-redirect về /admin/zalo-bot (hub)                   ║
║  ✓ URL thay đổi về hub                                       ║
║  ✓ SetupCard hiện tại hub                                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## L4: Navigation giữa các sub-pages

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 17: Điều hướng qua nav ngang                          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  TEST CASES:                                                  ║
║  ✓ Click "Gửi ngay" ở nav → URL /send, content SendTab      ║
║  ✓ Click "Hẹn giờ" ở nav → URL /schedule, content ScheduleTab║
║  ✓ Click "Lịch sử" ở nav → URL /history, content RecentTab   ║
║  ✓ Click logo "BaoCom" hoặc breadcrumb "Zalo Bot" → hub     ║
║  ✓ Status KHÔNG re-fetch khi chuyển sub-page                ║
║    (vì ZaloBotContext ở layout cha, persist qua nav)        ║
║  ✓ Toast KHÔNG bị reset khi chuyển sub-page                 ║
║  ✓ Polling interval KHÔNG bị restart khi chuyển sub-page     ║
║  ✓ Browser back/forward hoạt động đúng (Next.js App Router) ║
║                                                              ║
║  BƯỚC 17a: Test URL trực tiếp                                ║
║  ✓ Gõ /admin/zalo-bot/send vào URL bar khi CONNECTED        ║
║    → Load thẳng SendTab (không redirect)                    ║
║  ✓ Gõ /admin/zalo-bot/history vào URL bar                   ║
║    → Load thẳng RecentTab + MiniHistory                      ║
║  ✓ Gõ /admin/zalo-bot/send khi DISCONNECTED                  ║
║    → RequireConnected phát hiện → redirect hub               ║
║    → SetupCard hiện                                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Responsive breakpoints

```
╔══════════════════════════════════════════════════════════════╗
║  BƯỚC 18: Responsive test                                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  375px (Mobile):                                             ║
║  ┌─────────────────────────┐                                ║
║  │ ☰ BaoCom Admin     A   │ ← hamburger menu               ║
║  ├─────────────────────────┤                                ║
║  │ Zalo Bot                │                                ║
║  │ ● Đã kết nối — Admin   │                                ║
║  ├─────────────────────────┤                                ║
║  │ [📤 Gửi] [⏰ Hẹn] [📜 Lịch] │ ← nav ngang scrollable    ║
║  ├─────────────────────────┤                                ║
║  │ Quick-action cards      │ ← stack dọc trên mobile       ║
║  │ ┌─────────────────────┐│                                ║
║  │ │ 📤 Gửi ngay         ││                                ║
║  │ └─────────────────────┘│                                ║
║  │ ┌─────────────────────┐│                                ║
║  │ │ ⏰ Hẹn giờ          ││                                ║
║  │ └─────────────────────┘│                                ║
║  │ Nhóm đích               │                                ║
║  │ ● Báo cơm              │                                ║
║  └─────────────────────────┘                                ║
║                                                              ║
║  768px (Tablet):                                             ║
║  ┌──────────────────────────────────────┐                   ║
║  │ Sidebar (collapsible) │ Content      │                   ║
║  │ ├─ Dashboard          │ Zalo Bot     │                   ║
║  │ ├─ Thực đơn           │ ● Connected  │                   ║
║  │ ├─ Zalo Bot           │              │                   ║
║  │ └─ ...                │ [Nav ngang]  │                   ║
║  │                       │ Quick cards  │                   ║
║  │                       │ GroupPicker  │                   ║
║  └──────────────────────────────────────┘                   ║
║                                                              ║
║  1280px (Desktop):                                           ║
║  ┌────────────┬────────────────────────────────────┐        ║
║  │ Sidebar    │ Content (full width)                │        ║
║  │ 220px      │ StatusBar + Nav + Hub/Send/Schedule │        ║
║  │            │ + History                           │        ║
║  └────────────┴────────────────────────────────────┘        ║
║                                                              ║
║  EXPECT (all breakpoints):                                   ║
║  ✓ StatusBar sticky top luôn visible khi scroll              ║
║  ✓ Nav ngang scrollable ngang trên mobile                   ║
║  ✓ Nav ngang wrap hoặc scrollable trên tablet                ║
║  ✓ GroupPicker card full width                               ║
║  ✓ Sub-page content full width (max-width container)         ║
║  ✓ MiniHistory ở /history footer (không ở hub)               ║
║  ✓ Không có horizontal scroll ngoài nav                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Checklist tổng hợp (cập nhật cho nested routes)

```
┌────┬──────────────────────────────────┬─────────┐
│ #  │ Test case                        │ Status  │
├────┼──────────────────────────────────┼─────────┤
│ L1 │ Login admin → dashboard          │ ☐       │
│ L2a│ Hub DISCONNECTED → SetupCard     │ ☐       │
│ L2a│ Hub DISCONNECTED → nav ẩN        │ ☐       │
│ L2b│ Click QR → CONNECTING state      │ ☐       │
│ L2b│ CONNECTING → nav vẫn ẩN          │ ☐       │
│ L2c│ Hub CONNECTED → nav hiện (3 link)│ ☐       │
│ L2c│ Hub CONNECTED → quick-action cards│ ☐       │
│ L2c│ Hub CONNECTED → GroupPicker      │ ☐       │
│ H  │ /send: URL thay đổi              │ ☐       │
│ H  │ /send: nav "Gửi ngay" active    │ ☐       │
│ T1 │ /send: empty → disabled          │ ☐       │
│ T1 │ /send: type → enabled            │ ☐       │
│ T1 │ /send: send success toast        │ ☐       │
│ T1 │ /send: send fail toast           │ ☐       │
│ T1 │ /send: KHÔNG có GroupPicker      │ ☐       │
│ H  │ /schedule: URL thay đổi          │ ☐       │
│ H  │ /schedule: nav "Hẹn giờ" active  │ ☐       │
│ T2 │ /schedule: toggle auto-send      │ ☐       │
│ T2 │ /schedule: change preset         │ ☐       │
│ T2 │ /schedule: edit template         │ ☐       │
│ T2 │ /schedule: preview render        │ ☐       │
│ T2 │ /schedule: run-now success       │ ☐       │
│ T2 │ /schedule: disabled state        │ ☐       │
│ H  │ /history: URL thay đổi           │ ☐       │
│ H  │ /history: nav "Lịch sử" active   │ ☐       │
│ T3 │ /history: empty state            │ ☐       │
│ T3 │ /history: show entries           │ ☐       │
│ T3 │ /history: MiniHistory ở footer   │ ☐       │
│ G  │ GroupPicker chỉ ở hub            │ ☐       │
│ G  │ GroupPicker: select group        │ ☐       │
│ G  │ GroupPicker: manual groupId      │ ☐       │
│ G  │ GroupPicker: search filter       │ ☐       │
│ M  │ MiniHistory chỉ ở /history       │ ☐       │
│ R  │ RequireConnected: DISCONNECTED→hub│ ☐       │
│ R  │ RequireConnected: EXPIRED→hub    │ ☐       │
│ R  │ RequireConnected: CONNECTED OK   │ ☐       │
│ N  │ Nav: click chuyển sub-page       │ ☐       │
│ N  │ Status persist khi nav sub-page  │ ☐       │
│ N  │ Browser back/forward hoạt động   │ ☐       │
│ L3 │ Logout → DISCONNECTED → hub      │ ☐       │
│ R  │ Mobile 375px                     │ ☐       │
│ R  │ Tablet 768px                     │ ☐       │
│ R  │ Desktop 1280px                   │ ☐       │
│ A  │ Lighthouse a11y ≥ 90            │ ☐ (91)  │
└────┴──────────────────────────────────┴─────────┘
```

---

## Tóm tắt thay đổi từ UAT cũ

| Phần | Cũ (Tabs) | Mới (Nested Routes) |
|------|-----------|---------------------|
| URL `/admin/zalo-bot` | 1 page duy nhất | Hub: SetupCard HOẶC dashboard |
| Sub-routes | Không có | `/send`, `/schedule`, `/history` |
| Navigation | Tabs trong 1 page | Nav ngang giữa các URL riêng |
| GroupPicker | Ở mọi tab | Chỉ ở hub |
| MiniHistory | Ở footer page | Chỉ ở `/history` |
| State guard | Conditional render | `RequireConnected` auto-redirect |
| Polling | Re-mount mỗi lần | Persist qua nav (context ở layout) |
| SetupCard | Trong tab "Setup" | Ở hub khi !CONNECTED |
| Quick-actions | Không có | 3 cards ở hub dẫn tới sub-pages |