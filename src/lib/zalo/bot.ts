import { Zalo, LoginQRCallbackEventType, type API as ZaloAPI } from 'zca-js'
import { loadCredentials, saveCredentials, clearCredentials } from './credentials'
import { classifyZaloError } from './errors'

// NOTE: saveCredentials vẫn được dùng trong handleGotLoginInfo (QR login flow).
// Giữ import để tránh "unused" warning.
import type {
  BotState, BotStatus, GroupInfo,
  QRCodeGeneratedEvent, QRCodeScannedEvent, GotLoginInfoEvent,
} from './types'

export type BotEvents =
  | { type: 'qr'; qr: QRCodeGeneratedEvent }
  | { type: 'scanned'; scanned: QRCodeScannedEvent }
  | { type: 'login'; login: GotLoginInfoEvent }
  | { type: 'state'; state: BotState }
  | { type: 'keepalive-warning'; failures: number }

export interface InitQROptions {
  onEvent: (e: BotEvents) => void
}

const ThreadType = { Group: 1, User: 2 } as const

interface DiscoveredGroup extends GroupInfo {
  // raw version string from gridVerMap, used as freshness hint
  version?: string
}

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
  private _currentQr: { image: string; token: string } | null = null
  private _groupsCache: DiscoveredGroup[] | null = null
  private _groupsCacheAt: number = 0
  private static readonly GROUPS_CACHE_TTL_MS = 5 * 60 * 1000
  private keepAliveTimer: NodeJS.Timeout | null = null
  private keepAliveIntervalMs: number = 5 * 60 * 1000
  private lastKeepAliveAt: string | null = null
  private lastKeepAliveResult: { config_vesion: number } | null = null
  private keepAliveFailureCount: number = 0

  /** Retry delays cho keepAlive khi fail (exponential backoff).
   *  Sau khi fail hết số lần này → bot mới chuyển sang EXPIRED. */
  private static readonly KEEPALIVE_RETRY_DELAYS_MS = [30_000, 60_000, 120_000, 240_000, 480_000]
  private static readonly KEEPALIVE_FAILURE_THRESHOLD = 5
  /** Fail count tại đó ta emit warning (admin biết trước khi EXPIRED) */
  private static readonly KEEPALIVE_WARNING_THRESHOLD = 3
  private keepAliveRetryTimer: NodeJS.Timeout | null = null

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
    this._currentQr = null
    this._groupsCache = null
    this._groupsCacheAt = 0
    this.lastKeepAliveAt = null
    this.lastKeepAliveResult = null
    this.keepAliveFailureCount = 0
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer)
      this.keepAliveTimer = null
    }
    if (this.keepAliveRetryTimer) {
      clearTimeout(this.keepAliveRetryTimer)
      this.keepAliveRetryTimer = null
    }
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

  async initQR({ onEvent }: InitQROptions): Promise<void> {
    this.state = 'CONNECTING'
    this.lastError = undefined
    this._currentQr = null
    this._groupsCache = null
    this.onEvent = onEvent

    this.zalo = new Zalo({ selfListen: false, logging: false })

    // Start loginQR but DON'T await — it blocks until QR is confirmed or aborted
    // We let it run in background; events flow through onEvent
    this.zalo
      .loginQR({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) baocom-bot/1.0' }, (event) => {
        switch (event.type) {
          case LoginQRCallbackEventType.QRCodeGenerated: {
            // zca-js strips the "data:image/png;base64," prefix from qrGenResult.data.image
            // (see node_modules/zca-js/dist/apis/loginQR.js:272). We re-add it so the browser
            // treats the src as an inline data URL instead of a relative path.
            const rawImage = event.data.image as string
            const image = rawImage.startsWith('data:') ? rawImage : `data:image/png;base64,${rawImage}`
            this._currentQr = { image, token: event.data.token }
            onEvent({ type: 'qr', qr: { image, token: event.data.token } })
            break
          }
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
              cookie: event.data.cookie as unknown as string | string[],
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
            break
        }
      })
      .then((api) => {
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

  /** Like initQR, but resolves once QR image is available (or after timeout). */
  async initQRAndWait({ onEvent }: InitQROptions, timeoutMs = 10_000): Promise<void> {
    // Fire initQR in background
    const qrReady = new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (this._currentQr) {
          clearInterval(check)
          resolve()
        }
      }, 200)
      setTimeout(() => { clearInterval(check); resolve() }, timeoutMs)
    })
    await this.initQR({ onEvent })
    await qrReady
  }

  private async handleGotLoginInfo(payload: GotLoginInfoEvent) {
    try {
      saveCredentials({
        cookie: payload.cookie,
        imei: payload.imei,
        userAgent: payload.userAgent,
      })
      this.onEvent?.({ type: 'login', login: payload })
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
    // Handle both real zca-js shape ({ message: { msgId } }) and our mock shape ({ msgId })
    const direct = (result as unknown as { msgId?: string | number }).msgId
    const nested = (result as unknown as { message?: { msgId?: number } | null }).message?.msgId
    const msgId = direct != null ? String(direct) : nested != null ? String(nested) : `sent-${Date.now()}`
    return { msgId, sentAt: new Date().toISOString() }
  }

  /**
   * Discover groups the bot account is in.
   *
   * NOTE: zca-js's getAllGroups() only returns a gridVerMap of {groupId: version}
   * (no name/memberCount). To get names we need to call getGroupInfo() per id.
   * This is expensive for large group lists, so we cache and only fetch on first call.
   */
  async listGroups(): Promise<GroupInfo[]> {
    const api = await this.ensureLoggedIn()
    if (
      this._groupsCache &&
      Date.now() - this._groupsCacheAt < ZaloBot.GROUPS_CACHE_TTL_MS
    ) {
      return this._groupsCache
    }

    const raw = await api.getAllGroups()
    const gridVerMap = (raw as unknown as { gridVerMap?: Record<string, string> }).gridVerMap ?? {}
    const ids = Object.keys(gridVerMap)
    if (ids.length === 0) return []

    // Fetch each group info (best-effort; skip on error)
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const info = await (api as unknown as {
          getGroupInfo: (id: string) => Promise<{
            gridInfoMap?: Record<string, { name?: string; totalMember?: number; avt?: string }>
          }>
        }).getGroupInfo(id)
        const data = info?.gridInfoMap?.[id]
        return {
          groupId: id,
          name: data?.name ?? `Group ${id}`,
          memberCount: data?.totalMember,
          avatar: data?.avt,
          version: gridVerMap[id],
        } as DiscoveredGroup
      })
    )
    this._groupsCache = results
      .filter((r): r is PromiseFulfilledResult<DiscoveredGroup> => r.status === 'fulfilled')
      .map((r) => r.value)
    this._groupsCacheAt = Date.now()
    return this._groupsCache
  }

  /** Force re-fetch danh sách groups, bỏ qua cache TTL. */
  async refreshGroups(): Promise<GroupInfo[]> {
    this._groupsCache = null
    this._groupsCacheAt = 0
    return this.listGroups()
  }

  async logout(): Promise<void> {
    if (this.api) {
      try {
        // API doesn't expose logout(); rely on credentials.clear + state reset
      } catch {
        /* ignore */
      }
    }
    this.stopKeepAlive()
    clearCredentials()
    this.api = null
    this.zalo = null
    this.account = null
    this.state = 'DISCONNECTED'
    this._currentQr = null
    this._groupsCache = null
    this._groupsCacheAt = 0
    this.lastKeepAliveAt = null
    this.lastKeepAliveResult = null
  }

  /**
   * Start keepAlive heartbeat: gọi api.keepAlive() mỗi intervalMs.
   * Mục đích: refresh session Zalo để bot không bị logout khi idle lâu.
   * Fail-safe: nếu keepAlive throw → stop + set EXPIRED → admin reconnect.
   * Singleton-safe: nếu đã chạy thì bỏ qua.
   */
  startKeepAlive(intervalMs?: number): void {
    if (this.keepAliveTimer) return
    if (intervalMs) this.keepAliveIntervalMs = intervalMs
    this.keepAliveTimer = setInterval(() => {
      void this.runKeepAlive()
    }, this.keepAliveIntervalMs)
    console.log(`[zalo-bot] keepAlive started (interval=${this.keepAliveIntervalMs}ms)`)
  }

  stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer)
      this.keepAliveTimer = null
      console.log('[zalo-bot] keepAlive stopped')
    }
    if (this.keepAliveRetryTimer) {
      clearTimeout(this.keepAliveRetryTimer)
      this.keepAliveRetryTimer = null
    }
    this.keepAliveFailureCount = 0
  }

  /** Debug status for runtime verification — safe read-only. */
  keepAliveStatus(): {
    active: boolean
    intervalMs: number
    lastKeepAliveAt?: string
    lastKeepAliveResult?: { config_vesion: number }
  } {
    return {
      active: !!this.keepAliveTimer,
      intervalMs: this.keepAliveIntervalMs,
      lastKeepAliveAt: this.lastKeepAliveAt ?? undefined,
      lastKeepAliveResult: this.lastKeepAliveResult ?? undefined,
    }
  }

  /** Manual trigger for debug endpoint only. */
  async debugKeepAliveNow(): Promise<{ config_vesion: number }> {
    return this.runKeepAlive()
  }

  private async runKeepAlive(): Promise<{ config_vesion: number }> {
    try {
      const api = await this.ensureLoggedIn()
      const result = await api.keepAlive()
      this.lastKeepAliveAt = new Date().toISOString()
      this.lastKeepAliveResult = result
      this.keepAliveFailureCount = 0
      console.log('[zalo-bot] keepAlive OK')
      return result
    } catch (err) {
      this.keepAliveFailureCount++
      const attempt = this.keepAliveFailureCount
      const maxAttempts = ZaloBot.KEEPALIVE_FAILURE_THRESHOLD

      console.error(`[zalo-bot] keepAlive failed (attempt ${attempt}/${maxAttempts}):`, err instanceof Error ? err.message : err)

      // Cảnh báo admin khi đạt warning threshold (trước khi EXPIRED)
      if (attempt === ZaloBot.KEEPALIVE_WARNING_THRESHOLD) {
        this.onEvent?.({ type: 'keepalive-warning', failures: attempt })
      }

      if (attempt < maxAttempts) {
        // Retry với exponential backoff
        const delayMs = ZaloBot.KEEPALIVE_RETRY_DELAYS_MS[attempt - 1] ?? 120_000
        console.log(`[zalo-bot] keepAlive retry in ${delayMs}ms...`)
        this.keepAliveRetryTimer = setTimeout(() => {
          void this.runKeepAlive()
        }, delayMs)
        return { config_vesion: 0 }
      }

      // Hết retry → thử auto re-login từ stored credentials
      console.warn('[zalo-bot] keepAlive retries exhausted, attempting auto re-login...')

      const reconnected = await this.tryReLoginFromCredentials()
      if (reconnected) {
        // Re-login thành công → reset state, schedule lại keepAlive
        this.keepAliveFailureCount = 0
        this.startKeepAlive()
        console.log('[zalo-bot] Auto re-login successful, keepAlive resumed')
        return { config_vesion: 0 }
      }

      // Re-login fail → EXPIRED, yêu cầu QR scan lại
      console.error('[zalo-bot] Auto re-login failed, marking EXPIRED')
      this.stopKeepAlive()
      this.state = 'EXPIRED'
      this.lastError = {
        kind: 'expired',
        message: 'Session hết hạn, cần quét QR lại',
        at: new Date().toISOString(),
      }
      this.onEvent?.({ type: 'state', state: this.state })
      throw err
    }
  }

  /**
   * Thử re-login từ credentials đã lưu.
   * Trả về true nếu thành công, false nếu fail.
   *
   * Chỉ gọi khi:
   * - Credentials tồn tại
   * - Không có login đang in-flight
   */
  private async tryReLoginFromCredentials(): Promise<boolean> {
    if (this.loginInFlight) {
      console.log('[zalo-bot] re-login skipped: another login in flight')
      return false
    }

    const creds = loadCredentials()
    if (!creds) {
      console.log('[zalo-bot] re-login skipped: no stored credentials')
      return false
    }

    try {
      this.loginInFlight = (async () => {
        const zalo = new Zalo({ selfListen: false, logging: false })
        const api = await zalo.login({
          cookie: creds.cookie as never,
          imei: creds.imei,
          userAgent: creds.userAgent,
        })

        // Ghi nhận timestamp re-login thành công
        // (Cookie rotation không expose qua API → dùng creds gốc;
        //  nếu server rotate cookie, lần login sau sẽ fail và buộc QR lại)
        this.zalo = zalo
        this.api = api
        this.state = 'CONNECTED'
        this.expiredLoginFailures = 0
        this.lastConnectedAt = new Date().toISOString()
        this.onEvent?.({ type: 'state', state: this.state })
        console.log('[zalo-bot] re-login OK, state=CONNECTED')
        return api
      })()

      await this.loginInFlight
      return true
    } catch (err) {
      console.error('[zalo-bot] re-login failed:', err instanceof Error ? err.message : err)
      return false
    } finally {
      this.loginInFlight = null
    }
  }
}

// Singleton — survives hot-reload
const globalForBot = globalThis as unknown as { __zaloBot?: ZaloBot }
const existingBot = globalForBot.__zaloBot
// DEV/HMR-safe: nếu class shape đổi (thêm methods mới) thì instance cũ không có method đó.
// Trong trường hợp đó, tạo instance mới để tránh route/runtime 500 sau hot reload.
export const bot =
  existingBot &&
  typeof (existingBot as { keepAliveStatus?: unknown }).keepAliveStatus === 'function' &&
  typeof (existingBot as { debugKeepAliveNow?: unknown }).debugKeepAliveNow === 'function'
    ? existingBot
    : new ZaloBot()
if (globalForBot.__zaloBot !== bot) globalForBot.__zaloBot = bot

export { ThreadType }
