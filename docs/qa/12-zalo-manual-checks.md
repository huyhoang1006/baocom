# Zalo Bot — Manual QA Checklist

> **Status:** Phase 1 + 2 manual checks. Run after implementing Tasks 1–25.

## Pre-requisites

- Dev server running: `npm run dev`
- Logged in as admin at `/admin/zalo-bot`
- Have a personal Zalo account ready (use a SECONDARY account, not your main HR one)
- A group Zalo where the bot account is a member

## Scenarios

### S1: First-time QR setup

- [ ] Open `/admin/zalo-bot`
- [ ] Click "Bắt đầu quét QR"
- [ ] QR image appears within 5s
- [ ] Open Zalo on phone → scan QR
- [ ] Page shows "Đã quét, vui lòng confirm" within 2s
- [ ] Confirm on phone
- [ ] Within 5s, page shows "Đã kết nối"
- [ ] Status card shows list of groups (or manual groupId input if not yet discovered)
- [ ] Select a group → confirm "Đã chọn group" appears

### S2: Disconnect/reconnect with cached credentials

- [ ] After S1 success, restart `npm run dev`
- [ ] Open `/admin/zalo-bot`
- [ ] Within 5s, status shows "Đã kết nối" WITHOUT QR (credentials loaded from file)
- [ ] Check `data/zalo-bot-credentials.json` exists with chmod 600 (POSIX only)

### S3: Cookie expired

- [ ] Delete `data/zalo-bot-credentials.json`
- [ ] Refresh page → status shows "Bot chưa được kết nối"
- [ ] Click "Bắt đầu quét QR" → QR flow again

### S4: Wrong group (bot not member)

- [ ] PATCH `/api/zalo/config` with a random groupId not in bot's groups
- [ ] POST `/api/zalo/send` → error message clear (zalo-js code 120/121 = "Bot hết hạn" or "Bot không trong group")

### S5: Cron test

- [ ] Set cron to `* * * * *` (every minute)
- [ ] Wait 1 minute
- [ ] Check group Zalo for the message
- [ ] Set cron back to `0 8 * * 1-5`

### S6: Concurrent sends

- [ ] Open 2 admin tabs at `/admin/zalo-bot`
- [ ] Compose same message in both, click Send simultaneously
- [ ] Both succeed (2 messages in group, no errors)

### S7: Multi-device conflict

- [ ] Open Zalo Web on browser, log in with bot account
- [ ] In admin, click Send → may receive BOT_EXPIRED
- [ ] Click "Kết nối lại" → QR flow

### S8: Validation

- [ ] POST `/api/zalo/send` with text 2001 chars → 400
- [ ] PATCH `/api/zalo/config` with cron "not-a-cron" → 400
- [ ] PATCH `/api/zalo/config` with groupId "abc" → 400
- [ ] POST `/api/zalo/send` with empty text → 400

### S9: Auth

- [ ] Log out → try GET `/api/zalo/status` → 401
- [ ] Login as employee (non-admin) → try GET `/api/zalo/status` → 403
- [ ] Employee tries to access `/admin/zalo-bot` → redirected to `/login`

### S10: Auto-send manual trigger

- [ ] Configure groupId + enable auto-send + set cron `* * * * *`
- [ ] Wait 1 minute → check group Zalo
- [ ] Click "Gửi ngay (test)" in AutoSendCard → toast confirms
- [ ] Check group Zalo for immediate message

## Expected artifacts

- `data/zalo-bot-credentials.json` (chmod 600 on POSIX, gitignored)
- `data/zalo-bot-errors.log` (JSON-lines, errors only, gitignored)
- DB row `ZaloConfig` với các key theo spec

## Known limitations (Out of Scope, Phase 2)

- Worker process riêng (hiện tại dùng in-process node-cron — không scale across instances)
- Inbound message listener (bot chỉ gửi, không nhận)
- Rich message (sticker, image)
- Multi-bot
- i18n (Tiếng Việt cứng)
