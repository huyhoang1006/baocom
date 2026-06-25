import { Zalo, LoginQRCallbackEventType, type API as ZaloAPI } from 'zca-js'
import { loadCredentials, saveCredentials, clearCredentials } from './credentials'
import { classifyZaloError } from './errors'
import type {
  BotState, BotStatus, GroupInfo,
  QRCodeGeneratedEvent, QRCodeScannedEvent, GotLoginInfoEvent,
} from './types'

export type BotEvents =
  | { type: 'qr'; qr: QRCodeGeneratedEvent }
  | { type: 'scanned'; scanned: QRCodeScannedEvent }
  | { type: 'login'; login: GotLoginInfoEvent }
  | { type: 'state'; state: BotState }

export interface InitQROptions {
  onEvent: (e: BotEvents) => void
}

const ThreadType = { Group: 1, User: 2 } as const

class ZaloBot {
  private state: BotState = 'DISCONNECTED'
  private zalo: Zalo | null = null
  private api: ZaloAPI | null = null
  private account: { displayName: string; avatar?: string } | null = null
  private lastError: BotStatus['lastError'] = undefined
  private lastConnectedAt: string | null = null
  private onEvent: ((e: BotEvents) => void) | null = null
  private loginInFlight: Promise<ZaloAPI> | null = null
  private expiredLoginFailures = 0

  /** Reset all state — for tests only */
  reset() {
    this.state = 'DISCONNECTED'
    this.zalo = null
    this.api = null
    this.account = null
    this.lastError = undefined
    this.lastConnectedAt = null
    this.onEvent = null
    this.loginInFlight = null
    this.expiredLoginFailures = 0
  }

  /** TEST-ONLY helper: simulate a GotLoginInfo event without waiting for real QR scan */
  simulateGotLoginInfo(payload: GotLoginInfoEvent) {
    void this.handleGotLoginInfo(payload)
  }

  status(): BotStatus {
    return {
      state: this.state,
      account: this.account ?? undefined,
      qr: this._currentQr ?? undefined,
      lastError: this.lastError,
      lastConnectedAt: this.lastConnectedAt ?? undefined,
    }
  }

  private _currentQr: { image: string; token: string } | null = null

  async initQR({ onEvent }: InitQROptions): Promise<void> {
    this.state = 'CONNECTING'
    this.lastError = undefined
    this._currentQr = null
    this.onEvent = onEvent

    this.zalo = new Zalo({ selfListen: false, logging: false })

    // Start loginQR but DON'T await — it blocks until QR is confirmed or aborted
    // We let it run in background; events flow through onEvent
    this.zalo
      .loginQR({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) baocom-bot/1.0' }, (event) => {
        switch (event.type) {
          case LoginQRCallbackEventType.QRCodeGenerated:
            this._currentQr = {
              image: event.data.image,
              token: event.data.token,
            }
            onEvent({
              type: 'qr',
              qr: { image: event.data.image, token: event.data.token },
            })
            break
          case LoginQRCallbackEventType.QRCodeScanned:
            onEvent({
              type: 'scanned',
              scanned: {
                display_name: event.data.display_name,
                avatar: event.data.avatar,
              },
            })
            break
          case LoginQRCallbackEventType.GotLoginInfo:
            void this.handleGotLoginInfo({
              cookie: event.data.cookie,
              imei: event.data.imei,
              userAgent: event.data.userAgent,
            })
            break
          case LoginQRCallbackEventType.QRCodeDeclined:
            this.state = 'DISCONNECTED'
            this.lastError = {
              kind: 'fatal',
              message: 'Bạn đã từ chối đăng nhập.',
              at: new Date().toISOString(),
            }
            onEvent({ type: 'state', state: this.state })
            break
          case LoginQRCallbackEventType.QRCodeExpired:
            this._currentQr = null
            // Don't change state — UI should re-trigger QR
            break
        }
      })
      .then((api) => {
        // loginQR resolves when fully logged in (after scan + confirm)
        this.api = api
        this.state = 'CONNECTED'
        this.expiredLoginFailures = 0
        this.lastConnectedAt = new Date().toISOString()
        this.account = { displayName: 'Bot Zalo' }
        onEvent({ type: 'state', state: this.state })
      })
      .catch((err) => {
        const c = classifyZaloError(err)
        this.lastError = { kind: c.kind, message: c.userMessage, at: new Date().toISOString() }
        this.state = 'DISCONNECTED'
        onEvent({ type: 'state', state: this.state })
      })
  }

  private async handleGotLoginInfo(payload: GotLoginInfoEvent) {
    try {
      saveCredentials({
        cookie: payload.cookie,
        imei: payload.imei,
        userAgent: payload.userAgent,
      })
      this.onEvent?.({ type: 'login', login: payload })
      // The API instance is set when loginQR().then() resolves
    } catch (err) {
      const c = classifyZaloError(err)
      this.lastError = { kind: c.kind, message: c.userMessage, at: new Date().toISOString() }
    }
  }

  async ensureLoggedIn(): Promise<ZaloAPI> {
    if (this.api && this.state === 'CONNECTED') return this.api
    if (this.loginInFlight) return this.loginInFlight

    this.loginInFlight = (async () => {
      const creds = loadCredentials()
      if (!creds) {
        const err = new Error('BOT_NOT_SETUP')
        ;(err as Error & { code: number }).code = 503
        throw err
      }
      try {
        const zalo = new Zalo({ selfListen: false, logging: false })
        const api = await zalo.login({
          cookie: creds.cookie as never,
          imei: creds.imei,
          userAgent: creds.userAgent,
        })
        this.zalo = zalo
        this.api = api
        this.state = 'CONNECTED'
        this.expiredLoginFailures = 0
        return api
      } catch (err) {
        const classified = classifyZaloError(err)
        if (classified.kind === 'expired' || classified.kind === 'auth') {
          this.expiredLoginFailures++
          if (this.expiredLoginFailures >= 2) {
            this.state = 'EXPIRED'
            this.lastError = {
              kind: classified.kind,
              message: classified.userMessage,
              at: new Date().toISOString(),
            }
          }
        }
        throw err
      } finally {
        this.loginInFlight = null
      }
    })()

    return this.loginInFlight
  }

  async send(text: string, threadId: string): Promise<{ msgId: string; sentAt: string }> {
    if (!threadId) {
      throw new Error('threadId required')
    }
    if (text.length === 0 || text.length > 2000) {
      throw new Error('text phải có độ dài 1-2000 ký tự')
    }
    const api = await this.ensureLoggedIn()
    const result = await api.sendMessage({ msg: text }, threadId, ThreadType.Group)
    return {
      msgId: String((result as unknown as { msgId?: string }).msgId ?? `sent-${Date.now()}`),
      sentAt: new Date().toISOString(),
    }
  }

  async listGroups(): Promise<GroupInfo[]> {
    const api = await this.ensureLoggedIn()
    const groups = await api.getAllGroups()
    return groups.map((g) => ({
      groupId: String((g as unknown as { groupId: string }).groupId),
      name: String((g as unknown as { name: string }).name),
      memberCount: (g as unknown as { memberCount?: number }).memberCount,
      avatar: (g as unknown as { avatar?: string }).avatar,
    }))
  }

  async logout(): Promise<void> {
    if (this.api) {
      try {
        await this.api.logout()
      } catch {
        /* ignore */
      }
    }
    clearCredentials()
    this.api = null
    this.zalo = null
    this.account = null
    this.state = 'DISCONNECTED'
    this._currentQr = null
  }
}

// Singleton — survives hot-reload
const globalForBot = globalThis as unknown as { __zaloBot?: ZaloBot }
export const bot = globalForBot.__zaloBot ?? new ZaloBot()
if (!globalForBot.__zaloBot) globalForBot.__zaloBot = bot

export { ThreadType }
