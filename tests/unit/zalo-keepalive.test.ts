import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock zca-js trước khi import bot
const mockLogin = vi.fn()

vi.mock('zca-js', () => ({
  Zalo: vi.fn().mockImplementation(() => ({
    login: mockLogin,
  })),
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

  it('giữ interval mặc định 5 phút (300000ms)', async () => {
    const bot = await importBot()
    bot.reset()

    const api = { keepAlive: vi.fn().mockResolvedValue({ config_vesion: 1 }) }
    // @ts-expect-error - inject for test
    bot.api = api
    // @ts-expect-error - inject for test
    bot.state = 'CONNECTED'

    bot.startKeepAlive()

    expect((bot as unknown as { keepAliveIntervalMs: number }).keepAliveIntervalMs).toBe(5 * 60 * 1000)

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
})

