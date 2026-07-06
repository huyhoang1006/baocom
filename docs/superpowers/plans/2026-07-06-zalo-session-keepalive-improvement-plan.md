# Zalo Session KeepAlive — Kế hoạch cải tiến

## Ngày: 2026-07-06

## Tổng quan

Cải tiến cơ chế duy trì phiên đăng nhập Zalo từ **reactive** (chờ fail rồi xử lý) sang **proactive** (recycle trước khi expire), dựa trên phân tích zca-js source code, GitHub issues, và best practices từ openzca/zca-cli.

---

## Kiến thức đã nạp

| Nguồn | Phát hiện chính |
|-------|-----------------|
| zca-js `keepAlive.ts` | `keepAlive()` chỉ gửi `{ imei }` → heartbeat đơn thuần, **không refresh cookie** |
| zca-js `login.ts` | Login dùng cookie + imei + userAgent → tạo session context mới |
| zca-js Context System | Session chứa `secretKey`, `cookie` (CookieJar), `uid`, `imei` → không expose cookie rotation |
| GitHub #198 | Chưa có câu trả lời chính thức về cookie lifetime |
| GitHub #88 | User report: để qua đêm → phải quét QR lại |
| GitHub #153 | Cookie vẫn "sống" nhưng session server-side expired → listener disconnect |
| openzca CLI | `--keep-alive` + `--recycle-ms 1800000` → proactive listener recycle mỗi 30 phút |
| zca-cli | `auth login-creds` → re-login từ saved credentials, không cần QR |

## So sánh Code hiện tại vs Best Practice

| Tiêu chí | Code hiện tại | Best practice | Gap |
|-----------|--------------|---------------|-----|
| KeepAlive interval | 5 phút | 15-30 phút | Quá频繁 |
| Proactive refresh | ❌ Chờ fail mới xử lý | ✅ Proactive recycle trước khi expire | **Lớn** |
| Session age tracking | ❌ Không có | openzca: `--recycle-ms` force recycle | Cần thêm |
| Re-login strategy | ✅ `tryReLoginFromCredentials()` | Giống zca-cli | Đã có |
| Exponential backoff | ✅ 30s→480s, max 5 lần | Tốt | Đã có |
| Warning threshold | ✅ attempt = 3 | Tốt | Đã có |
| Auto-connect on start | ✅ `ensureLoggedIn()` | openzca: auto-connect | Đã có |
| State machine | 4 states | openzca: thêm `RECONNECTING` | Nên thêm |

## Phương pháp: Proactive Session Recycling + Adaptive KeepAlive

Thay vì chờ session expire rồi reactive xử lý, **proactive recycle session trước khi expire** dựa trên session age.

```
Session Start (login/QR/reconnect)
     │
     ▼
┌─── keepAlive loop (mỗi 15 phút) ◄──────────────┐
│    │                                             │
│    ├─ OK → check session age                     │
│    │       ├─ age < 4h → continue                │
│    │       └─ age >= 4h → PROACTIVE RECYCLE ─────┘
│    │                     (re-login trước khi expire)
│    │
│    └─ FAIL (expired/auth)
│         ├─ attempt 1-2: immediate re-login
│         ├─ attempt 3: emit warning
│         └─ attempt 5: state = EXPIRED
│
└─── Session Recycle Timer (mỗi 4h)
     └─ force re-login ngay cả khi keepAlive OK
```

---

## Phase 1: Proactive Session Recycling (ưu tiên cao)

**File: `src/lib/zalo/bot.ts`**

| Thay đổi | Chi tiết |
|----------|----------|
| Thêm `sessionStartedAt: number \| null` | Track thời điểm session bắt đầu (epoch ms) |
| Thêm `SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000` | 4 giờ — ngưỡng proactive recycle |
| Thêm `recycleSession()` | Re-login từ credentials, giữ session cũ nếu fail |
| Sửa `runKeepAlive()` | Thêm check session age → gọi `recycleSession()` nếu >= threshold |
| Sửa `startKeepAlive()` | Ghi nhận `sessionStartedAt = Date.now()` khi start |
| Sửa `tryReLoginFromCredentials()` | Update `sessionStartedAt` khi re-login thành công |
| Sửa `initQR()` | Update `sessionStartedAt` khi QR login thành công |
| Sửa `ensureLoggedIn()` | Update `sessionStartedAt` khi login thành công |

**Logic `recycleSession()`:**

```typescript
private async recycleSession(): Promise<boolean> {
  // Không recycle nếu đang có login in-flight
  if (this.loginInFlight) return false

  try {
    const ok = await this.tryReLoginFromCredentials()
    if (ok) {
      this.sessionStartedAt = Date.now()
      this.keepAliveFailureCount = 0
      console.log('[zalo-bot] Proactive recycle OK')
      return true
    }
    return false
  } catch {
    // Recycle fail → giữ session cũ, thử lại lần sau
    console.warn('[zalo-bot] Proactive recycle failed, keeping current session')
    return false
  }
}
```

**Logic check trong `runKeepAlive()`:**

```typescript
// Sau keepAlive OK, check session age
if (this.sessionStartedAt &&
    Date.now() - this.sessionStartedAt > ZaloBot.SESSION_MAX_AGE_MS) {
  console.log('[zalo-bot] Session too old, proactive recycle...')
  await this.recycleSession()
}
```

---

## Phase 2: Adaptive KeepAlive Interval

**File: `src/lib/zalo/bot.ts`**

| Thay đổi | Chi tiết |
|----------|----------|
| Đổi `keepAliveIntervalMs` mặc định | `5 * 60 * 1000` → `15 * 60 * 1000` (15 phút) |
| Thêm `KEEPALIVE_INTERVAL_MS` constant | `15 * 60 * 1000` |
| Sửa debug endpoint | Cho phép admin set interval mới qua `intervalMs` param |

---

## Phase 3: State Machine Mở rộng

**File: `src/lib/zalo/types.ts`**

| Thay đổi | Chi tiết |
|----------|----------|
| Thêm state `RECONNECTING` | `'DISCONNECTED' \| 'CONNECTING' \| 'CONNECTED' \| 'RECONNECTING' \| 'EXPIRED'` |

**File: `src/lib/zalo/bot.ts`**

| Thay đổi | Chi tiết |
|----------|----------|
| Set `state = 'RECONNECTING'` trong `tryReLoginFromCredentials()` | Trước khi login attempt |
| Sửa `ensureLoggedIn()` | Handle `RECONNECTING` → chờ loginInFlight |

**File: UI components**

| Thay đổi | Chi tiết |
|----------|----------|
| Hiển thị `RECONNECTING` | Khác với `CONNECTING` (đang reconnect vs lần đầu) |

---

## Phase 4: Monitoring & Observability

**File: `app/api/zalo/debug/keepalive/route.ts`**

| Thay đổi | Chi tiết |
|----------|----------|
| Thêm `sessionAge` | `Date.now() - sessionStartedAt` (ms) |
| Thêm `sessionMaxAgeMs` | `SESSION_MAX_AGE_MS` |
| Thêm `nextRecycleAt` | `sessionStartedAt + SESSION_MAX_AGE_MS` |
| Thêm `recycleCount` | Số lần đã recycle thành công |

**Response shape mới:**

```json
{
  "bot": { ... },
  "keepAlive": {
    "active": true,
    "intervalMs": 900000,
    "lastKeepAliveAt": "...",
    "lastKeepAliveResult": { "config_vesion": 2 }
  },
  "session": {
    "startedAt": "2026-07-06T10:00:00Z",
    "ageMs": 3600000,
    "maxAgeMs": 14400000,
    "nextRecycleAt": "2026-07-06T14:00:00Z",
    "recycleCount": 1
  }
}
```

---

## Phase 5: Tests

**File: `tests/unit/zalo-keepalive.test.ts`**

| Test case | Mô tả |
|-----------|-------|
| `recycleSession()` gọi `tryReLoginFromCredentials()` | Verify re-login được gọi khi session age >= threshold |
| Recycle fail → giữ session cũ | Không chuyển EXPIRED nếu recycle fail |
| Session age reset sau recycle | `sessionStartedAt` được update |
| KeepAlive interval mới (15 phút) | Verify interval đúng |
| `RECONNECTING` state | Verify state transitions đúng |
| Proactive recycle trong `runKeepAlive()` | Verify recycle được trigger khi age >= threshold |

---

## Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `src/lib/zalo/bot.ts` | Phase 1, 2, 3 — core logic |
| `src/lib/zalo/types.ts` | Phase 3 — thêm state `RECONNECTING` |
| `app/api/zalo/debug/keepalive/route.ts` | Phase 4 — monitoring |
| `tests/unit/zalo-keepalive.test.ts` | Phase 5 — tests |

## Không cần thay đổi

| File | Lý do |
|------|-------|
| `src/lib/zalo/credentials.ts` | Đã đủ chức năng |
| `src/lib/zalo/config.ts` | Không liên quan |
| `src/lib/zalo/errors.ts` | Đã có `classifyZaloError()` |
| `src/lib/zalo/auto-send.ts` | Gọi `bot.send()` → `ensureLoggedIn()` → tự động kết nối |
| UI components | Hiển thị state hiện tại đã đủ (trừ Phase 3 nếu cần) |

## Rủi ro & Mitigation

| Rủi ro | Mitigation |
|--------|-----------|
| Recycle quá频繁 bị rate-limit | Adaptive: recycle fail → tăng interval lần sau |
| Recycle giữa lúc đang send message | Dùng lock (`loginInFlight`) — code đã có |
| Cookie rotate giữa recycle | Recycle fail → giữ session cũ → thử lại |
| Server restart mất state | `sessionStartedAt` reset, auto-connect lại |
| Zalo thay đổi API keepAlive | Phân loại lỗi → reconnect → thử login lại |

## Metrics theo dõi

| Metric | Mô tả |
|--------|-------|
| `sessionStartedAt` | Timestamp session bắt đầu |
| `keepAliveFailureCount` | Số lần keepAlive fail liên tiếp |
| `lastKeepAliveAt` | Timestamp keepAlive thành công cuối |
| `recycleCount` | Số lần proactive recycle thành công |
| `state` | Current bot state |

## Kết quả mong đợi

1. Session Zalo tồn tại **vô hạn** — chỉ kết thúc khi logout
2. Server restart → tự động kết nối lại (không cần QR)
3. Cookie hết hạn → tự động reconnect (không cần QR)
4. Session quá cũ → proactive recycle trước khi expire
5. Chỉ khi reconnect thất bại 5 lần liên tiếp → mới cần QR lại
