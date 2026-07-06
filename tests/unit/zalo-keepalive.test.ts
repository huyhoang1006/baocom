import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock zca-js trước khi import bot
const mockLogin = vi.fn()

class MockZalo {
  login = mockLogin
}

vi.mock('zca-js', () => ({
  Zalo: MockZalo,
  LoginQRCallbackEventType: {
    QRCodeGenerated: 0,
    QRCodeScanned: 1,
    GotLoginInfo: 2,
    QRCodeDeclined: 3,
    QRCodeExpired: 4,
  },
}))

// Mock credentials module
const mockLoadCredentials = vi.fn()
const mockSaveCredentials = vi.fn()
const mockClearCredentials = vi.fn()

vi.mock('@/lib/zalo/credentials', () => ({
  loadCredentials: () => mockLoadCredentials(),
  saveCredentials: (...args: unknown[]) => mockSaveCredentials(...args),
  clearCredentials: () => mockClearCredentials(),
}))

// Mock zalo paths to avoid filesystem writes during tests
vi.mock('@/lib/zalo/paths', () => ({
  credentialsPath: '/tmp/test-credentials.json',
  errorLogPath: '/tmp/test-errors.log',
  dataDir: '/tmp',
}))

// Import sau khi mock
async function importBot() {
  const mod = await import('@/lib/zalo/bot')
  return mod.bot
}

describe('ZaloBot keepAlive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('giữ interval mặc định 15 phút (900000ms)', async () => {
    const bot = await importBot()
    bot.reset()

    const api = { keepAlive: vi.fn().mockResolvedValue({ config_vesion: 1 }) }
    // @ts-expect-error - inject for test
    bot.api = api
    // @ts-expect-error - inject for test
    bot.state = 'CONNECTED'

    bot.startKeepAlive()

    expect((bot as unknown as { keepAliveIntervalMs: number }).keepAliveIntervalMs).toBe(15 * 60 * 1000)

    bot.stopKeepAlive()
  })

  it('giữ threshold 5 lần và delays [30s, 60s, 120s, 240s, 480s]', async () => {
    const bot = await importBot()
    bot.reset()

    const ZaloBotClass = Object.getPrototypeOf(bot).constructor as { KEEPALIVE_FAILURE_THRESHOLD: number; KEEPALIVE_RETRY_DELAYS_MS: number[]; KEEPALIVE_WARNING_THRESHOLD: number }

    expect(ZaloBotClass.KEEPALIVE_FAILURE_THRESHOLD).toBe(5)
    expect(ZaloBotClass.KEEPALIVE_WARNING_THRESHOLD).toBe(3)
    expect(ZaloBotClass.KEEPALIVE_RETRY_DELAYS_MS).toEqual([30_000, 60_000, 120_000, 240_000, 480_000])
  })

  it('reset failureCount khi keepAlive thành công', async () => {
    const bot = await importBot()
    bot.reset()

    const api = { keepAlive: vi.fn().mockResolvedValue({ config_vesion: 1 }) }
    // @ts-expect-error - inject for test
    bot.api = api
    // @ts-expect-error - inject for test
    bot.state = 'CONNECTED'

    // Đặt failureCount = 2 trước
    // @ts-expect-error - inject for test
    bot.keepAliveFailureCount = 2

    await bot.debugKeepAliveNow()

    expect((bot as unknown as { keepAliveFailureCount: number }).keepAliveFailureCount).toBe(0)
  })

  it('SESSION_MAX_AGE_MS = 4 giờ', async () => {
    const bot = await importBot()
    bot.reset()

    const ZaloBotClass = Object.getPrototypeOf(bot).constructor as { SESSION_MAX_AGE_MS: number }
    expect(ZaloBotClass.SESSION_MAX_AGE_MS).toBe(4 * 60 * 60 * 1000)
  })

  it('startKeepAlive ghi nhận sessionStartedAt', async () => {
    const bot = await importBot()
    bot.reset()

    const api = { keepAlive: vi.fn().mockResolvedValue({ config_vesion: 1 }) }
    // @ts-expect-error - inject for test
    bot.api = api
    // @ts-expect-error - inject for test
    bot.state = 'CONNECTED'

    const before = Date.now()
    bot.startKeepAlive()
    const after = Date.now()

    const startedAt = (bot as unknown as { sessionStartedAt: number | null }).sessionStartedAt
    expect(startedAt).not.toBeNull()
    expect(startedAt!).toBeGreaterThanOrEqual(before)
    expect(startedAt!).toBeLessThanOrEqual(after)

    bot.stopKeepAlive()
  })

  it('tryReLoginFromCredentials set state = RECONNECTING trước khi login', async () => {
    const bot = await importBot()
    bot.reset()

    const stateChanges: string[] = []
    // @ts-expect-error - inject for test
    bot.onEvent = (e: { type: string; state?: string }) => {
      if (e.type === 'state' && e.state) stateChanges.push(e.state)
    }

    mockLoadCredentials.mockReturnValue({
      cookie: 'test-cookie',
      imei: 'test-imei',
      userAgent: 'test-ua',
    })
    mockLogin.mockResolvedValue({ keepAlive: vi.fn() })

    // @ts-expect-error - access private method for test
    await bot.tryReLoginFromCredentials()

    expect(stateChanges).toContain('RECONNECTING')
    expect(stateChanges).toContain('CONNECTED')
  })

  it('tryReLoginFromCredentials set sessionStartedAt khi thành công', async () => {
    const bot = await importBot()
    bot.reset()

    mockLoadCredentials.mockReturnValue({
      cookie: 'test-cookie',
      imei: 'test-imei',
      userAgent: 'test-ua',
    })
    mockLogin.mockResolvedValue({ keepAlive: vi.fn() })

    const before = Date.now()
    // @ts-expect-error - access private method for test
    await bot.tryReLoginFromCredentials()
    const after = Date.now()

    const startedAt = (bot as unknown as { sessionStartedAt: number | null }).sessionStartedAt
    expect(startedAt).not.toBeNull()
    expect(startedAt!).toBeGreaterThanOrEqual(before)
    expect(startedAt!).toBeLessThanOrEqual(after)
  })

  it('sessionStatus trả về đúng shape', async () => {
    const bot = await importBot()
    bot.reset()

    // @ts-expect-error - inject for test
    bot.sessionStartedAt = Date.now() - 3600_000 // 1 giờ trước

    const status = bot.sessionStatus()
    expect(status).toHaveProperty('startedAt')
    expect(status).toHaveProperty('ageMs')
    expect(status).toHaveProperty('maxAgeMs')
    expect(status).toHaveProperty('nextRecycleAt')
    expect(status).toHaveProperty('recycleCount')
    expect(status.maxAgeMs).toBe(4 * 60 * 60 * 1000)
    expect(status.ageMs).toBeGreaterThan(0)
    expect(status.recycleCount).toBe(0)
  })

  it('recycleSession skip nếu loginInFlight', async () => {
    const bot = await importBot()
    bot.reset()

    // @ts-expect-error - inject for test
    bot.loginInFlight = Promise.resolve({})

    // @ts-expect-error - access private method for test
    const result = await bot.recycleSession()
    expect(result).toBe(false)
  })

  it('recycleSession tăng recycleCount khi thành công', async () => {
    const bot = await importBot()
    bot.reset()

    mockLoadCredentials.mockReturnValue({
      cookie: 'test-cookie',
      imei: 'test-imei',
      userAgent: 'test-ua',
    })
    mockLogin.mockResolvedValue({ keepAlive: vi.fn() })

    // @ts-expect-error - access private method for test
    const result = await bot.recycleSession()
    expect(result).toBe(true)
    expect((bot as unknown as { recycleCount: number }).recycleCount).toBe(1)
    expect((bot as unknown as { sessionStartedAt: number | null }).sessionStartedAt).not.toBeNull()
  })

  it('ensureLoggedIn handle RECONNECTING state', async () => {
    const bot = await importBot()
    bot.reset()

    const mockApi = { keepAlive: vi.fn() }
    // @ts-expect-error - inject for test
    bot.api = mockApi
    // @ts-expect-error - inject for test
    bot.state = 'RECONNECTING'

    const result = await bot.ensureLoggedIn()
    expect(result).toBe(mockApi)
  })
})

