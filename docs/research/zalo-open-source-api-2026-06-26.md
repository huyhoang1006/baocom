# Zalo API — Repo mã nguồn mở & tài liệu (2026-06-26)

## 1. Phân loại hệ sinh thái Zalo API

| Loại | Đặc điểm | Rủi ro | Use-case phù hợp |
|---|---|---|---|
| **Zalo OA OpenAPI** (official) | OAuth2, REST, webhook do Zalo cấp app, dùng cho Official Account | Cần đăng ký OA, review app | Bot CSKH chính thức, gửi notification ZNS, tích hợp Mini App |
| **zca-js / zalo-api unofficial** | Giả lập browser Zalo Web, dùng tài khoản cá nhân | Vi phạm TOS → **ban account**, gãy khi Zalo đổi protocol | Bot nội bộ, tooling cá nhân, prototype |
| **zalo-bot-js** | SDK bot Node.js (TypeScript), hỗ trợ polling + webhook | Tương tự OA — phụ thuộc token OA | Triển khai nhanh trên Nuxt/Node |
| **zalo-node-sdk** | Wrapper cho **Zalo OpenAPI chính thức** + Zalo Login | Rủi ro thấp (official) | App cần Login bằng Zalo + gọi OA API |

---

## 2. Repo Open-source nổi bật

### 2.1. zca-js — *Unofficial Zalo API cho JavaScript*
- **Repo**: https://github.com/RFS-ADRENO/zca-js
- **npm**: https://www.npmjs.com/package/zca-js (v2.1.2)
- **Docs**: https://zca-js.tdung.com/en/
- **DeepWiki**: https://deepwiki.com/RFS-ADRENO/zca-js
- **License**: MIT
- **Stack**: ESM + CJS, Node 18+ / Bun
- **Số method**: ~146 (theo research trước trong spec `2026-06-25-zalo-zca-js-integration-design.md`)
- **Nhóm API chính**:
  - `loginQR()` → callback `QRCodeGenerated` trả về `image` base64 PNG (render trực tiếp `<img>`)
  - `api.sendMessage(text, threadId, type)`
  - `api.sendSticker`, `api.sendCard`, `api.sendVideo`, `api.sendImage`
  - `api.addFriend`, `api.acceptFriendRequest`, `api.removeFriend`
  - `api.getFriendsList`, `api.getGroupsList`, `api.getGroupInfo`
  - `api.listen({ onMessage, onReaction, onFriendRequest })`
  - `api.createGroup`, `api.addUserToGroup`, `api.changeGroupName`
- **⚠ Disclaimer**: "Unofficial API for personal account. Use at your own risk. Account may be locked or banned."
- **Lý do phổ biến**: API gần giống Zalo Web thật, base64 QR, có listener event realtime.

### 2.2. zalo-bot-js — *SDK chính thức-kiểu cho Zalo Bot trên Node.js*
- **Docs**: https://kaiyodev.github.io/zalo-bot-js/en/
- **Tiếng Việt**: https://kaiyodev.github.io/zalo-bot-js/vi/
- **Stack**: TypeScript, Node.js
- **Tính năng** (từ docs):
  - Polling helpers (long-polling, không cần public URL)
  - Webhook helpers (cho prod server có HTTPS)
  - Event listeners (`onMessage`, `onPostback`, `onFollow`, `onUnfollow`)
  - Core send APIs: `sendText`, `sendSticker`, `sendImage`, `sendList`, `sendButtons`
  - Workflow / quick-reply helpers
- **Use-case**: Viết Zalo OA Bot nhanh, hỗ trợ cả 2 mode (polling cho dev, webhook cho prod).

### 2.3. zalo-node-sdk — *Wrapper OpenAPI chính thức + Zalo Login*
- **Repo**: https://github.com/tungnguyentien/zalo-node-sdk
- **npm**: https://www.npmjs.com/package/zalo-sdk
- **License**: MIT
- **Bao gồm**:
  - Zalo OAuth Login flow (`getLoginUrl`, `getAccessToken`, `getUserInfo`)
  - Wrapper cho nhiều endpoint Zalo OpenAPI: Social API, Article API, Official Account API, Store API, Video API...
  - TypeScript typings
- **Use-case**: App Next.js / Express cần "Đăng nhập bằng Zalo" + gọi API trên OA đã đăng ký.

### 2.4. Zalopay OSS
- **Org**: https://github.com/zalopay-oss
- **Số repo**: 26 (liên quan đến payment, không phải Zalo social — chỉ liệt kê để tham khảo)

### 2.5. GitHub Topic — `zalo`
- **URL**: https://github.com/topics/zalo
- **Mục đích**: Crawl thêm các repo mới theo tag — khoảng vài chục repo gồm:
  - `ZaloDataExtractor` — tool extract IMEI/Cookie/UA từ Zalo Web
  - Bot cá nhân đa dạng (Python, Node, Go)
  - Wrapper OA API đa ngôn ngữ

---

## 3. Tài liệu chính thức

### 3.1. Zalo for Developers (Portal)
- **URL**: https://developers.zalo.me/docs
- **Nhóm tài liệu**:
  - **Zalo OA API**: gửi tin nhắn, ZNS template, Article API, Broadcast
  - **Social API**: login, share, invite friend (cần app review)
  - **Mini App**: SDK chạy trong Zalo app
  - **Zalo Pay**: payment gateway
- **Auth**: OAuth 2.0 với `app_id`, `app_secret`, `access_token` (TTL ~ 7200s, refresh bằng `refresh_token`)
- **Webhook**: Đăng ký URL nhận event `follow`, `unfollow`, `user_send_text`, `user_send_image`, `user_send_sticker`, `user_send_location`...

### 3.2. Zalo Bot Platform (OA Bot)
- **URL con**: https://developers.zalo.me/docs/api/bot-api
- **Pattern**: Gửi message qua REST `POST /v3/bot/message/{message_type}` với header `access_token`.

---

## 4. Ma trận chọn thư viện

| Tiêu chí | zca-js (unofficial) | zalo-bot-js | zalo-node-sdk |
|---|---|---|---|
| Tài khoản | Cá nhân | OA (Official Account) | OA + User OAuth |
| App review | Không | Có | Có |
| Realtime | listen() / webhook polling | polling + webhook | Webhook only |
| Tin nhắn 1-1 | ✅ | ✅ | ✅ |
| Tin nhắn nhóm | ✅ | ⚠ (hạn chế) | ❌ |
| Gửi broadcast | ❌ | ✅ | ✅ |
| Risk ban account | **Cao** | Thấp | Thấp |
| License | MIT | MIT | MIT |
| Ngôn ngữ | JS/TS | JS/TS | JS/TS |

---

## 5. Khuyến nghị cho dự án BaoCom (admin/zalo-bot)

Dựa trên spec đã có (`docs/superpowers/specs/2026-06-25-zalo-zca-js-integration-design.md`):
- **Hiện đang dùng**: `zca-js ^2.1.2` + `node-cron ^4.x`
- **Lý do chọn zca-js**: cần gửi broadcast vào nhóm Zalo nội bộ HR (không phải OA bot, không cần app review)
- **Mitigation trong spec**:
  - Dùng tài khoản Zalo phụ, không phải TK chính HR
  - Rate-limit config
  - Watch release `RFS-ADRENO/zca-js` để upgrade kịp khi Zalo đổi protocol
  - Có fallback plan chuyển sang Zalo OA nếu cần thông báo critical
  - Single-instance Phase 1, chuyển worker process Phase 2

---

## 6. Nguồn đã fetch & index

| URL | Mô tả | Source label |
|---|---|---|
| https://github.com/RFS-ADRENO/zca-js | Repo chính zca-js | `zca-js-github-readme` |
| https://zca-js.tdung.com/en/ | Landing docs | `zca-js-docs-site` |
| https://zca-js.tdung.com/en/get-started/introduction.html | Giới thiệu zca-js | `zca-js-introduction` |
| https://zca-js.tdung.com/en/apis/acceptFriendRequest.html | Sample API ref | `zca-js-api-reference-sample` |
| https://deepwiki.com/RFS-ADRENO/zca-js | Tổng quan | `zca-js-deepwiki-overview` |
| https://deepwiki.com/RFS-ADRENO/zca-js/2-getting-started | Hướng dẫn cài | `zca-js-deepwiki-getting-started` |
| https://deepwiki.com/RFS-ADRENO/zca-js/4-architecture | Messaging features | `zca-js-deepwiki-architecture` |
| https://github.com/tungnguyentien/zalo-node-sdk | Wrapper OA API + Login | `zalo-node-sdk-readme` |
| https://kaiyodev.github.io/zalo-bot-js/en/ | Landing SDK | `zalo-bot-js-docs` |
| https://kaiyodev.github.io/zalo-bot-js/en/getting-started | Hướng dẫn | `zalo-bot-js-getting-started` |
| https://kaiyodev.github.io/zalo-bot-js/en/api-reference | API lookup | `zalo-bot-js-api-reference` |
| https://developers.zalo.me/docs | Portal chính thức | `zalo-official-developers` |
| https://github.com/topics/zalo | Topic page các repo Zalo | `github-topic-zalo` |
| https://www.npmjs.com/package/zca-js | npm page zca-js (403 khi fetch) | n/a |

---

## 7. Tìm kiếm chưa hoàn thành / Hạn chế

- **Python libs** (`zalo-py`, `zalobot`): DuckDuckGo + WebSearch đều trả empty do rate-limit / bot detection. Cần thử lại sau hoặc search trực tiếp `https://github.com/topics/zalo` và filter theo Python.
- **npm registry `zalo-api`**: jsDelivr liệt kê nhưng không fetch chi tiết.
- **ZaloPay OSS repos cụ thể**: cần crawl https://github.com/orgs/zalopay-oss/repositories nếu cần dùng payment.

---

## 8. Khả năng duy trì đăng nhập dài hạn (Deep-dive)

Phân tích chi tiết dựa trên: source code project hiện tại (`src/lib/zalo/bot.ts`, `credentials.ts`), spec keepalive (`docs/superpowers/specs/2026-06-25-zalo-session-keepalive-design.md`), indexed source `zca-js-source-loginQR`, `zca-js-source-listen`, `zca-js-source-keepAlive`, và docs chính thức Zalo.

### 8.1. zca-js — *Giả lập Zalo Web, có cơ chế keepAlive*

**Cơ chế tự nhiên của Zalo (từ source code `loginQR.ts` + docs):**
- Sau khi QR login thành công → server trả về bộ `{ cookie, imei, userAgent }`.
- Cookie này dùng cho HTTP request + WebSocket listener.
- Cookie **KHÔNG tự refresh** — Zalo server tự expire sau khoảng 24-48h không hoạt động.

**API mà zca-js cung cấp để duy trì session:**

| API | Mục đích | Code path |
|---|---|---|
| `loginQR(opts, cb)` | Login lần đầu bằng QR (callback 5 events) | `src/apis/loginQR.ts` |
| `login({ cookie, imei, userAgent })` | Re-login bằng credentials đã lưu — **đây là key cho persistence** | wrapper trong `Zalo` class |
| `api.keepAlive()` | Heartbeat gửi GET đến Zalo để refresh session | `src/apis/keepAlive.ts` — params `{ imei }`, encrypted AES |
| `api.listen(opts)` | Mở WebSocket để nhận message realtime | `src/apis/listen.ts` (84 sections, 22KB) — sử dụng `ws` package |

**⚠ Cookie rotation: chưa rõ zca-js có tự update `cookie` sau mỗi keepAlive không.** Comment trong `bot.ts:446`:
> "Cookie rotation không expose qua API → dùng creds gốc; nếu server rotate cookie, lần login sau sẽ fail và buộc QR lại"

→ Cần test thực tế: nếu cookie thực sự rotate → solution hiện tại vẫn sẽ expire sau ~24-48h dù có keepAlive.

**Pattern persistence mà project đang dùng (từ `src/lib/zalo/bot.ts` + spec):**

```typescript
// 1. Lưu credentials khi GotLoginInfo
saveCredentials({ cookie, imei, userAgent })  // → data/zalo-bot-credentials.json

// 2. Re-login bằng credentials đã lưu
const zalo = new Zalo()
const api = await zalo.login({ cookie: creds.cookie, imei: creds.imei, userAgent: creds.userAgent })

// 3. KeepAlive mỗi 5 phút (300_000ms) — config được
startKeepAlive(5 * 60 * 1000)  // default

// 4. Retry policy: fail 3 lần với delays [30s, 60s, 120s]
//    Hết retry → tryReLoginFromCredentials()
//    Hết re-login → state = EXPIRED → yêu cầu QR scan lại
```

**Đánh giá:**
- ✅ Đã có full stack: lưu cookie → re-login → keepAlive → retry + reconnect.
- ⚠ **Cookie rotation là điểm yếu chưa giải quyết.** Nếu Zalo server thực sự rotate cookie → hệ thống sẽ expire sớm hơn mong đợi.
- ⚠ Phụ thuộc `keepAlive()` của zca-js — nếu repo ngừng maintain → cần fork hoặc tự viết lại.
- ⚠ `userAgent` cố định — nếu mismatch với session thật → re-login fail.

### 8.2. zalo-bot-js — *OAuth bot token, TTL ngắn hơn*

Dựa trên docs indexed (`zalo-bot-js-getting-started`, `zalo-bot-js-api-reference`):
- SDK thiết kế cho **Zalo OA Bot API** (Official Account), không dùng cho tài khoản cá nhân.
- Auth model: `access_token` (Bot Token) + optional `app_secret` để verify webhook.
- **KHÔNG có cơ chế persist session dài hạn tự động** — SDK chỉ cung cấp core send/listen helpers.

**Token lifecycle (theo Zalo OA spec — `[ASSUMED]` từ WebSearch, cần verify trên docs.zalo.me):**

| Token | TTL | Có refresh? |
|---|---|---|
| `access_token` (Bot) | ~25 giờ (theo `expires_in` ~90000s) | Có, bằng `refresh_token` |
| `refresh_token` | ~3 tháng (90 ngày) | Một lần — dùng xong trả về cặp mới |
| App secret | Vĩnh viễn (cho đến khi rotate) | Không |

→ Để duy trì login dài hạn với zalo-bot-js, **caller phải tự implement** refresh job (cron mỗi 12h kiểm tra `expires_at`, gọi `POST /v4/oa/access_token` với `grant_type=refresh_token`).

**Pattern cần tự build (chưa có sẵn trong SDK):**

```typescript
// Pseudo-code — caller phải tự viết
async function refreshIfNeeded() {
  const expiresAt = await db.getTokenExpiry()
  if (Date.now() > expiresAt - 600_000) {  // refresh 10 phút trước khi hết hạn
    const res = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
      method: 'POST',
      body: new URLSearchParams({
        app_id, app_secret, refresh_token, grant_type: 'refresh_token'
      })
    })
    const { access_token, refresh_token, expires_in } = await res.json()
    await db.saveToken({ access_token, refresh_token, expires_at: Date.now() + expires_in * 1000 })
  }
}
```

**Đánh giá:**
- ✅ Token TTL rõ ràng, có cơ chế refresh official từ Zalo.
- ⚠ SDK không có auto-refresh — phải tự build.
- ⚠ Nếu `refresh_token` không được dùng trong 3 tháng → bị thu hồi → buộc re-authorize qua OA admin (tức là mất quyền gửi message hoàn toàn cho đến khi admin re-connect).

### 8.3. zalo-node-sdk — *Wrapper OpenAPI, cùng token model với zalo-bot-js*

Dựa trên `zalo-node-sdk-readme-master` (indexed):
- Cùng base với zalo-bot-js: dùng Zalo Login + OA OpenAPI.
- Cung cấp helper `getLoginUrl()` + `getAccessToken(code)` cho OAuth flow.
- Không có auto-refresh built-in → caller phải tự quản lý.

**Cảnh báo cụ thể (theo WebSearch synthesis):**
- Stale refresh token (unused 3 tháng) → HTTP 401 `invalid_grant` → cần OA admin callback flow.
- Token gắn với OA ID, không phải user.
- App secret rotation → toàn bộ token hiện tại invalid → cần re-issue.

### 8.4. Bảng so sánh khả năng duy trì đăng nhập

| Tiêu chí | zca-js (unofficial) | zalo-bot-js | zalo-node-sdk |
|---|---|---|---|
| Cơ chế auth | Cookie + imei + UA | OA access_token + refresh_token | Zalo Login token + OA token |
| TTL native | ~24-48h (cookie) | 25h (access) / 90d (refresh) | 25h (access) / 90d (refresh) |
| Có API keepAlive/refresh built-in | ✅ `api.keepAlive()` | ❌ (caller tự build) | ❌ (caller tự build) |
| Auto re-login khi restart | ✅ (project đã có) | ⚠ phải tự build | ⚠ phải tự build |
| Cookie/token rotation tự động | ⚠ Không rõ (Zalo server-side) | ✅ refresh_token flow | ✅ refresh_token flow |
| Risk bị Zalo ban | **Cao** | Thấp | Thấp |
| Cần code thêm bao nhiêu để indefinite | ~200 LOC (đã có trong project) | ~100 LOC (refresh scheduler + DB) | ~100 LOC |

### 8.5. Khuyến nghị cụ thể cho từng scenario

**Scenario A: Bot nội bộ HR gửi broadcast vào Zalo group (hiện tại của BaoCom)**
- → **Tiếp tục dùng zca-js** + pattern keepAlive đã implement trong `bot.ts`.
- **Action item cần làm ngay**: kiểm tra `keepAlive()` response có trả về cookie mới không — bằng cách log diff `JSON.stringify(oldCreds) vs JSON.stringify(newCreds)` mỗi 5 phút.
- Nếu cookie KHÔNG rotate → solution hiện tại đã đủ indefinite.
- Nếu cookie CÓ rotate → cần monkey-patch `api.keepAlive()` để parse response và update `credentials.json` trước khi save.

**Scenario B: Chuyển sang Zalo OA Bot chính thức (long-term)**
- → Dùng **zalo-bot-js** + tự build refresh scheduler.
- Lưu `{ access_token, refresh_token, expires_at }` trong DB (Postgres).
- Cron job mỗi 1h check expiry; refresh 10 phút trước khi hết hạn.
- Setup monitoring cho 401 `invalid_grant` → alert admin re-authorize qua OA portal.

**Scenario C: Cần cả 2 (HR group + official OA)**
- Hybrid: zalo-bot-js cho OA chính thức (gửi notification critical), zca-js cho group chat nội bộ (broadcast meal menu, holiday...).
- Tách 2 process / 2 module để tránh nhiễu state.

### 8.6. Verification cần làm để chốt phương án

1. **Test thực tế cookie rotation của zca-js:**
   ```bash
   # Patch tạm trong bot.ts
   const oldCookie = JSON.stringify(loadCredentials()?.cookie)
   await api.keepAlive()
   const newCookie = JSON.stringify(loadCredentials()?.cookie)
   console.log('Cookie rotated?', oldCookie !== newCookie)
   ```
   Chạy mỗi 5 phút trong 48h, ghi log, xem có rotate không.

2. **Verify OA token TTL chính thức** trên https://developers.zalo.me/docs/api/oa/access-token (chưa fetch được do rate-limit, cần retry).

3. **Đánh giá risk Zalo detect automation**: nếu `keepAlive` quá đều (đúng 5 phút mỗi lần) có thể flag là bot → cần random jitter ±30s.