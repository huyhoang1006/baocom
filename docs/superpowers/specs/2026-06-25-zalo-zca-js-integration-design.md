# Zalo Bot Integration via zca-js — Design Spec

> **Date:** 2026-06-25

## Goal

Tích hợp một tài khoản Zalo cá nhân đóng vai trò **bot** vào hệ thống baocom, dùng để tự động gửi thông báo "báo cơm" (menu ngày, lịch nghỉ, deadline đặt cơm...) vào **một group Zalo cố định**.

## Problem

Hiện tại:
- Domain `docs/qa/flow-diagrams/06-security-and-journey.md:200` có ghi "Notify employees via Zalo/Telegram" trong employee journey, nhưng **chưa có code** để thực hiện.
- `.env.zalo.example` đã có `ZALO_APP_ID/SECRET/COOK_USER_ID` (định hướng Zalo OA), nhưng:
  - Zalo OA chỉ gửi được từ Official Account → user (cần user follow OA trước), không phù hợp với "gửi vào 1 group nội bộ".
  - `app/api/zalo/{send,auto-send}/` đã scaffold thư mục rỗng nhưng chưa có implementation.
- HR/admin hiện phải tự mở Zalo nhắn thủ công — không scale khi nhân viên đông.

## Solution

Dùng **zca-js** (reverse-engineer Zalo Web API) để login 1 tài khoản Zalo cá nhân qua QR, sau đó dùng tài khoản đó gửi tin nhắn vào 1 group đã chọn — cả thủ công (admin bấm nút) lẫn tự động (cron).

### Tech stack bổ sung

- **zca-js** `^2.1.2` — Zalo personal API client (đã research: 146 methods, MIT license, ESM + CJS, Bun + Node 18+)
- **node-cron** `^4.x` — schedule auto-send

**Không cần** package QR riêng — zca-js `loginQR` callback `QRCodeGenerated` đã trả về `image` dạng base64 PNG, client chỉ render `<img src={dataUrl}>`.

### 1. Database Schema

**New model:**
```prisma
model ZaloConfig {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

Key-value đơn giản, không cần quan hệ. Initial keys:

| Key | Default | Mô tả |
|---|---|---|
| `zalo.groupId` | `null` | Group ID đích (số rất dài) |
| `zalo.autoSend.enabled` | `'false'` | Bật/tắt cron |
| `zalo.autoSend.cron` | `'0 8 * * 1-5'` | Expression cron (mặc định 8h sáng T2-T6) |
| `zalo.autoSend.template` | `'🍱 Báo cơm {date}\n{menu}'` | Template message |

### 2. File layout

```
data/
  zalo-bot-credentials.json     ← gitignored, credentials bot
  zalo-bot-errors.log           ← JSON-lines error log

lib/
  zalo/
    bot.ts                      ← singleton + state machine
    credentials.ts              ← load/save JSON file
    config.ts                   ← ZaloConfig DB helpers
    auto-send.ts                ← node-cron job
    errors.ts                   ← classify Zalo errors
    retry.ts                    ← withRetry helper
    types.ts                    ← shared types

app/
  api/zalo/
    status/route.ts             ← GET bot status
    qr/route.ts                 ← POST init / DELETE logout
    groups/route.ts             ← GET list groups
    send/route.ts               ← POST manual send
    auto-send/route.ts          ← POST trigger / check
    config/route.ts             ← GET / PATCH config
  admin/zalo-bot/page.tsx       ← UI: QR setup + status + compose + send
  components/admin/zalo-bot/    ← client components

tests/
  unit/
    zalo-errors.test.ts
    zalo-retry.test.ts
    zalo-auto-send.test.ts
    zalo-config.test.ts
    zalo-credentials.test.ts
  integration/
    zalo-routes.test.ts
  fakes/
    zca-js.ts                   ← mock zca-js cho test
```

### 3. API Endpoints

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/zalo/status` | admin | `{ state, qr?, account?, lastError?, lastConnectedAt? }` |
| POST | `/api/zalo/qr` | admin | Trigger QR init, trả initial status (polling tiếp theo) |
| DELETE | `/api/zalo/qr` | admin | Logout, xoá credentials |
| GET | `/api/zalo/groups` | admin | List groups bot đang tham gia |
| POST | `/api/zalo/send` | admin | `{ text, threadId? }` → `{ msgId }` |
| POST | `/api/zalo/auto-send` | admin | `{ runNow?: boolean }` → `{ ok, sentAt }` |
| GET | `/api/zalo/config` | admin | All ZaloConfig as object |
| PATCH | `/api/zalo/config` | admin | `{ groupId?, autoSendEnabled?, cron?, template? }` |

Auth: dùng middleware `withAdmin` đã có sẵn trong project.

### 4. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Admin Browser (React)                       │
│  /admin/zalo-bot page (3 cards)                                 │
│   ┌────────────┬──────────────┬──────────────┐                   │
│   │  Setup     │ Bot Status   │ Compose      │                   │
│   └─────┬──────┴──────┬───────┴──────┬───────┘                   │
└─────────┼─────────────┼──────────────┼───────────────────────────┘
          │             │              │
          ▼             ▼              ▼
   ┌─────────────────────────────────────────────┐
   │    app/api/zalo/*/route.ts (thin ctrl)      │
   └──────────────────┬──────────────────────────┘
                      ▼
   ┌─────────────────────────────────────────────┐
   │    lib/zalo/bot.ts (singleton)              │
   │    state: DISCONNECTED → CONNECTING         │
   │           → CONNECTED → EXPIRED             │
   │    • initQR(onEvent)                        │
   │    • ensureLoggedIn()   ← lazy + dedup      │
   │    • send(text, threadId?)                 │
   │    • listGroups()                           │
   │    • status()                               │
   └──────┬──────────────────┬──────────────┬────┘
          │                  │              │
          ▼                  ▼              ▼
   ┌──────────────┐   ┌─────────────┐  ┌─────────────┐
   │credentials   │   │ config.ts   │  │   zca-js    │
   │  .ts         │   │ ZaloConfig  │  │  (^2.1.2)   │
   │ data/*.json  │   │ table       │  │             │
   └──────────────┘   └─────────────┘  └─────────────┘
                                                 ▲
                                                 │
                                  ┌──────────────┴─────────────┐
                                  │  lib/zalo/auto-send.ts     │
                                  │  node-cron                 │
                                  │  default: '0 8 * * 1-5'   │
                                  │  trigger: buildMessage +   │
                                  │            bot.send        │
                                  └────────────────────────────┘
```

### 5. Components

| Module | Responsibility | Public API |
|---|---|---|
| `lib/zalo/bot.ts` | Singleton, state machine, lazy login, dedup in-flight login | `bot.initQR`, `bot.ensureLoggedIn`, `bot.send`, `bot.listGroups`, `bot.status`, `bot.logout` |
| `lib/zalo/credentials.ts` | Persist `cookie/imei/userAgent` to `data/zalo-bot-credentials.json`, chmod 600 | `load`, `save`, `clear` |
| `lib/zalo/config.ts` | CRUD trên `ZaloConfig` table, helper cho key cụ thể | `get`, `set`, `getAll`, `getGroupId`, `setGroupId`, `isAutoSendEnabled`, `setAutoSendEnabled` |
| `lib/zalo/auto-send.ts` | node-cron job, đọc config mỗi tick, build message từ menu hôm nay | `start`, `stop`, `runNow` |
| `lib/zalo/errors.ts` | Phân loại lỗi từ zca-js → `{ kind, retryable, userMessage }` | `classifyZaloError` |
| `lib/zalo/retry.ts` | Backoff retry wrapper | `withRetry(fn, {max, delays})` |
| `lib/zalo/types.ts` | Shared types: `BotStatus`, `BotState`, `StoredCreds`, `GroupInfo` | types only |
| `app/api/zalo/*/route.ts` | Thin HTTP controllers, gọi `bot.*` và `config.*` | Next route handlers |
| `app/admin/zalo-bot/page.tsx` | UI page, 3 cards, polling `/api/zalo/status` mỗi 2s khi connecting | React Server + Client components |

### 6. Data Flow

#### 6.1 First-time QR Setup

```
Admin → POST /api/zalo/qr
       → bot.initQR(onEvent)
       → zalo.loginQR({userAgent}, callback)
       → [polling loop]
            → POST /authen/qr/generate → returns {code, image (base64 PNG)}
            → POST /authen/qr/waiting-scan (poll, error_code 8 → retry)
            → POST /authen/qr/waiting-confirm (poll, error_code -13 → declined)
            → POST /account/checksession → success
       → onEvent(QRCodeGenerated) { image, token }
       → UI hiển thị QR
       → onEvent(QRCodeScanned) { display_name, avatar }
       → UI hiển thị "Đã quét, vui lòng confirm trên điện thoại"
       → onEvent(GotLoginInfo) { cookie, imei, userAgent }
       → credentials.save(cookie, imei, userAgent) → data/zalo-bot-credentials.json
       → state = CONNECTED
       → UI reload, hiển thị account info
```

#### 6.2 Manual Send

```
Admin → POST /api/zalo/send {text, threadId?}
      → validate: threadId ?? config.getGroupId() (400 nếu null)
      → bot.ensureLoggedIn()
           → credentials.load() → null → throw 503 BOT_NOT_SETUP
           → credentials.load() → ok → zalo.login(creds) → api instance
           → (lần 2 cùng lúc: in-flight dedup, không gọi login lại)
      → api.sendMessage({msg: text}, threadId, ThreadType.Group)
      → trả {msgId, sentAt}
      → (nếu ZaloApiError code 120/121) → state = EXPIRED → trả 503 BOT_EXPIRED
```

#### 6.3 Auto-send Cron

```
node-cron tick @ '0 8 * * 1-5'
→ auto-send.ts handler
→ config.isAutoSendEnabled() → false → skip
→ enabled = true:
   → config.getGroupId() → null → log warn, skip
   → bot.ensureLoggedIn() → fail → log warn "bot expired, skip auto-send", không crash
   → getTodayMenu() (query từ service hiện có của baocom)
   → buildMessage(template, menu) = "🍱 Báo cơm 25/06/2026\n- Phở bò\n- Cơm gà"
   → bot.send(message)
   → log success → file data/zalo-bot-errors.log (chỉ log error, success → console)
```

#### 6.4 Lazy Reconnect (cookie expired mid-session)

```
Send request → ensureLoggedIn → login(creds) → 401 expired
            → retry 1 lần với cùng creds (trường hợp network blip)
            → nếu vẫn fail (lần thứ 2 liên tiếp) → state = EXPIRED
            → trả 503 BOT_EXPIRED
UI → poll /api/zalo/status → thấy state=expired → banner "Bot hết hạn, kết nối lại"
Admin → click "Kết nối lại" → flow 6.1 (QR lại)
```

### 7. Error Handling

| Layer | Error | HTTP | UI message |
|---|---|---|---|
| zca-js | `ZaloApiLoginQRAborted` | — | "QR bị huỷ" |
| zca-js | `ZaloApiLoginQRDeclined` | — | "Bạn đã từ chối đăng nhập" |
| zca-js | `ZaloApiError(code 120/121)` | 503 | "Bot hết hạn, cần kết nối lại" (set EXPIRED sau khi `login(creds)` fail **2 lần liên tiếp**; lần đầu fail được coi là network blip và retry trước khi set state) |
| zca-js | `ZaloApiError(code 429)` | 429 | "Zalo rate-limit, thử lại sau 5s" |
| zca-js | `ZaloApiError(5xx)` | 502 | "Zalo server lỗi, đang retry" |
| credentials | File not found | 503 | "Bot chưa được kết nối" |
| credentials | JSON corrupt | 500 | "Lỗi hệ thống" |
| DB config | Group ID chưa set | 400 | "Chưa chọn group đích" |
| Auth | Middleware fail | 401/403 | (handled bởi `withAdmin`) |

**Retry policy** (`lib/zalo/retry.ts`):

| Kind | Retryable | Strategy |
|---|---|---|
| `auth` (cookie expired) | No | Set EXPIRED, đợi admin |
| `expired` | No | Set EXPIRED |
| `rate-limit` (429) | Yes | backoff `5s, 10s, 20s`, max 3 |
| `transient` (network/5xx) | Yes | backoff `1s, 2s, 4s`, max 3 |
| `fatal` (logic) | No | Bubble ngay |

**Logging**:
- Console: `[zalo-bot]` prefix, luôn log INFO/WARN/ERROR
- File `data/zalo-bot-errors.log`: JSON-lines append-only cho errors (không cần DB)
- Mỗi response kèm `requestId` (UUID) để user copy debug

### 8. Validation Rules

- `text` khi send: required, max 2000 chars
- `cron` expression: validate bằng `node-cron` `validateCronExpression` trước khi save
- `groupId`: required, regex `^\d{6,20}$` (Zalo group ID là chuỗi số)
- Credentials file: chmod 600 sau khi ghi (chỉ owner process đọc được)
- Auto-send cron: skip nếu `groupId=null` hoặc `bot.state≠CONNECTED`

### 9. Security

- Credentials file trong `data/`, chmod 600, **gitignore**
- Tất cả `/api/zalo/*` đều qua `withAdmin` middleware
- UI page `/admin/zalo-bot` chỉ accessible cho role admin
- Không log cookie/imei/userAgent ra console (chỉ log masked version như `imei:abc***xyz`)
- Không gửi message đến group mà bot không phải member (UI disable nút Send nếu group không hợp lệ)

## Files to Create/Modify

### New Files

**Backend (lib):**
- `lib/zalo/bot.ts`
- `lib/zalo/credentials.ts`
- `lib/zalo/config.ts`
- `lib/zalo/auto-send.ts`
- `lib/zalo/errors.ts`
- `lib/zalo/retry.ts`
- `lib/zalo/types.ts`

**API routes:**
- `app/api/zalo/status/route.ts`
- `app/api/zalo/qr/route.ts`
- `app/api/zalo/groups/route.ts`
- `app/api/zalo/send/route.ts`
- `app/api/zalo/auto-send/route.ts`
- `app/api/zalo/config/route.ts`

**UI:**
- `app/admin/zalo-bot/page.tsx` (Server Component shell)
- `app/admin/zalo-bot/ZaloBotClient.tsx` (Client Component)
- `app/components/admin/zalo-bot/SetupCard.tsx`
- `app/components/admin/zalo-bot/StatusCard.tsx`
- `app/components/admin/zalo-bot/ComposeCard.tsx`
- `app/components/admin/zalo-bot/AutoSendCard.tsx`

**Tests:**
- `tests/unit/zalo-errors.test.ts`
- `tests/unit/zalo-retry.test.ts`
- `tests/unit/zalo-auto-send.test.ts`
- `tests/unit/zalo-config.test.ts`
- `tests/unit/zalo-credentials.test.ts`
- `tests/integration/zalo-routes.test.ts`
- `tests/fakes/zca-js.ts`
- `app/e2e/zalo-bot.spec.ts` (Playwright, 1 test)

**Docs:**
- `docs/qa/12-zalo-manual-checks.md`

### Modified Files

- `prisma/schema.prisma` — thêm model `ZaloConfig`
- `package.json` — thêm deps: `zca-js`, `node-cron`, `qrcode`
- `.gitignore` — thêm `data/zalo-bot-credentials.json`
- `.env.zalo.example` — không cần thêm biến mới (ZALO_APP_ID/SECRET/COOK_USER_ID hiện có không dùng cho zca-js flow; zca-js tự trả về userAgent qua callback `GotLoginInfo` và lưu vào credentials file)
- `app/admin/layout.tsx` (hoặc sidebar component) — thêm link "Zalo Bot"

## Testing Checklist

### Unit tests (10-15 tests)

- [ ] `classifyZaloError` — 5 cases: expired, rate-limit, transient, fatal, unknown
- [ ] `withRetry` — 3 cases: success on first try, fail all retries, partial fail
- [ ] `buildMessage` — 4 cases: menu rỗng, có món, template default, template custom
- [ ] `getGroupId/setGroupId` — 2 cases (DB roundtrip)
- [ ] `credentials.load/save/clear` — 4 cases (file exist, not exist, corrupt, chmod)

### Integration tests (10 tests)

- [ ] POST `/api/zalo/qr` → 200 + `{qr, state: connecting}`
- [ ] GET `/api/zalo/status` khi connected → 200 + account info
- [ ] POST `/api/zalo/send` không có groupId → 400
- [ ] POST `/api/zalo/send` cookie hợp lệ → 200 + msgId
- [ ] POST `/api/zalo/send` cookie expired (mock code 120) → 503 BOT_EXPIRED
- [ ] GET `/api/zalo/groups` → 200 + array
- [ ] PATCH `/api/zalo/config` groupId → 200, DB updated
- [ ] POST `/api/zalo/auto-send` runNow → 200 + bot.send called
- [ ] POST `/api/zalo/send` không admin cookie → 401
- [ ] 2 requests song song `ensureLoggedIn` → chỉ 1 login (in-flight dedup)

### E2E (1 test)

- [ ] Admin login → /admin/zalo-bot → thấy status "Connected" (với mock credentials) → compose + send → success toast

### Manual QA (ghi vào `docs/qa/12-zalo-manual-checks.md`)

- [ ] First-time setup: scan QR thật trên điện thoại → confirm → reload thấy Connected
- [ ] Disconnect/reconnect bằng credentials cũ (không cần QR)
- [ ] Cookie expire: xoá credentials file → page hiện "Bot chưa kết nối"
- [ ] Wrong group (bot không trong group) → send fail message rõ
- [ ] Cron test: đổi cron thành `* * * * *` → đợi 1 phút → message gửi
- [ ] Concurrent: 2 tab admin cùng bấm Send → 2 message gửi OK (không block)
- [ ] Multi-device: HR mở Zalo Web → admin send → nhận BOT_EXPIRED → QR lại

## Out of Scope (làm sau nếu cần)

- Multi-bot (nhiều TK Zalo)
- Worker process riêng (để WS sống vĩnh viễn)
- Listener/inbound messages (chatbot phản hồi)
- Group member scanning
- Rich message (sticker, image, link preview)
- Auto-send theo sự kiện (cron only ở Phase 1)
- Persistent send log table (chỉ file log ở Phase 1)
- i18n cho error messages (Tiếng Việt cứng Phase 1)

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Zalo đổi protocol → zca-js break | Watch repo `RFS-ADRENO/zca-js` releases; có fallback dùng Zalo OA cho thông báo critical |
| Cookie bị Zalo flag là bot → ban account | Khuyến nghị dùng TK Zalo phụ (không phải TK cá nhân HR chính); đặt rate-limit trong config |
| Multi-instance deploy (Vercel) → state chia sẻ sai | Phase 1 chỉ support single-instance; Phase 2 move sang worker process |
| File credentials corrupt → mất access | Có cơ chế re-init QR; không tự động xoá file cũ |
| node-cron không chạy khi server scale to zero | Phase 2 chuyển sang Vercel Cron / external scheduler |

## Status: Awaiting user review

---

## Changelog

- 2026-06-25: Initial design (5 sections brainstormed and approved by user)