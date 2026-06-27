# Zalo Session KeepAlive — Thiết kế

## Mục tiêu

Kéo dài thời hạn session Zalo **vô hạn** — chỉ kết thúc khi người dùng chủ động đăng xuất. Hiện tại session hết hạn sau vài giờ không hoạt động, yêu cầu quét QR lại.

## Vấn đề hiện tại

1. Cookie Zalo có thời hạn (ước tính 24-48h)
2. Không có cơ chế keepAlive — cookie tự hết hạn
3. Khi hết hạn → `ensureLoggedIn()` ném lỗi → state = `EXPIRED`
4. Người dùng phải quét QR lại mỗi lần

## Giải pháp

### Chiến lược: KeepAlive định kỳ + Tự động phục hồi

1. **KeepAlive định kỳ**: Gọi `api.keepAlive()` mỗi 15 phút khi state = `CONNECTED`
2. **Tự động phục hồi**: Khi keepAlive lỗi (expired/auth), tự động login lại bằng cookie đã lưu
3. **Tự động kết nối**: Khi server khởi động, tự động login nếu credentials tồn tại

### Chi tiết kỹ thuật

#### API keepAlive (zca-js)

zca-js có sẵn `api.keepAlive()` — gửi GET request đến Zalo server để duy trì session:

```javascript
// node_modules/zca-js/dist/apis/keepAlive.js
return async function keepAlive() {
    const params = { imei: ctx.imei };
    const encryptedParams = utils.encodeAES(JSON.stringify(params));
    return utils.resolve(response, undefined, false);
};
```

#### Thay đổi trong `src/lib/zalo/bot.ts`

**Thêm state mới:**

```typescript
export type BotState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'EXPIRED'
```

**Thêm thuộc tính mới vào class ZaloBot:**

```typescript
private keepAliveTimer: ReturnType<typeof setInterval> | null = null
private reconnectFailures = 0
private autoConnectAttempted = false
```

**Thêm methods mới:**

1. `startKeepAlive()` — Bắt đầu scheduler keepAlive mỗi 15 phút
2. `stopKeepAlive()` — Dừng scheduler
3. `reconnect()` — Tự động login lại bằng cookie đã lưu
4. `autoConnectOnStart()` — Tự động kết nối khi server khởi động

#### Luồng xử lý

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VÒNG ĐỜI SESSION                                 │
└─────────────────────────────────────────────────────────────────────┘

  DISCONNECTED ──► CONNECTING ──► CONNECTED ◄──┐
       ▲              │              │          │
       │              │              │          │
       │         [QR scan]    RECONNECTING ─────┘
       │                           │
       └───────────────────────────┘
         (thất bại 2 lần → EXPIRED → quét QR)
```

**Khi login thành công (QR hoặc reconnect):**
- `state = CONNECTED`
- Gọi `startKeepAlive()` — bắt đầu scheduler

**Khi keepAlive được gọi (mỗi 15 phút):**
- Nếu `state !== CONNECTED` → bỏ qua
- Gọi `api.keepAlive()`
- Thành công → reset `reconnectFailures = 0`
- Lỗi `expired/auth` → gọi `reconnect()`
- Lỗi `rate-limit/transient` → bỏ qua, thử lần sau

**Khi reconnect():**
- `state = RECONNECTING`
- Đọc credentials từ file
- Gọi `new Zalo().login(creds)`
- Thành công → `state = CONNECTED`, reset failures
- Thất bại → `reconnectFailures++`
  - Nếu `reconnectFailures >= 2` → `state = EXPIRED`

**Khi logout():**
- Gọi `stopKeepAlive()`
- Xóa credentials
- `state = DISCONNECTED`

**Khi server khởi động:**
- `autoConnectOnStart()` được gọi
- Nếu credentials tồn tại → tự động login
- Thành công → `state = CONNECTED` + `startKeepAlive()`
- Thất bại → `state = DISCONNECTED` (chờ quét QR)

#### Xử lý lỗi keepAlive

| Loại lỗi | Hành động |
|----------|-----------|
| `rate-limit` | Bỏ qua, thử lần sau |
| `transient` | Bỏ qua, thử lần sau |
| `expired` | Gọi `reconnect()` |
| `auth` | Gọi `reconnect()` |
| `unknown` | Bỏ qua, thử lần sau |

#### Server restart

Khi Next.js server restart:
1. ZaloBot singleton bị mất (globalThis reset)
2. Credentials vẫn còn trong file `data/zalo-bot-credentials.json`
3. Khi có request đầu tiên đến `/api/zalo/status`:
   - `ensureLoggedIn()` được gọi
   - Đọc credentials từ file
   - Tự động login lại
   - Nếu thành công → `state = CONNECTED` + `startKeepAlive()`

Hoặc chủ động hơn:
- Export function `autoConnectOnStart()` từ `bot.ts`
- Gọi trong `instrumentation.ts` hoặc route handler đầu tiên

### Files cần thay đổi

1. **`src/lib/zalo/bot.ts`** — Thêm keepAlive scheduler, reconnect logic, autoConnect
2. **`src/lib/zalo/types.ts`** — Thêm state `RECONNECTING` (tùy chọn)
3. **`src/lib/zalo/errors.ts`** — Xử lý lỗi keepAlive (đã có sẵn)

### Không cần thay đổi

- `credentials.ts` — Đã đủ chức năng
- `config.ts` — Không liên quan
- `auto-send.ts` — Gọi `bot.send()` → `ensureLoggedIn()` → tự động kết nối
- UI components — Hiển thị state hiện tại đã đủ

### Rủi ro và mitigation

| Rủi ro | Mitigation |
|--------|-----------|
| Zalo thay đổi API keepAlive | Phân loại lỗi → reconnect → thử login lại |
| Cookie hết hạn giữa 2 lần keepAlive | Tự động reconnect khi keepAlive lỗi |
| Server restart频繁 | AutoConnectOnStart — không cần thao tác thủ công |
| Rate limit từ Zalo | Bỏ qua lỗi rate-limit, thử lại sau 15 phút |

### Metrics

- `reconnectFailures`: Đếm số lần reconnect thất bại liên tiếp
- `lastKeepAliveAt`: Timestamp lần keepAlive thành công cuối cùng
- `keepAliveTimer`: Trạng thái scheduler (running/stopped)

## Kết quả mong đợi

1. Session Zalo tồn tại **vô hạn** — chỉ kết thúc khi logout
2. Server restart → tự động kết nối lại (không cần quét QR)
3. Cookie hết hạn → tự động reconnect (không cần quét QR)
4. Chỉ khi reconnect thất bại 2 lần liên tiếp → mới cần quét QR lại
