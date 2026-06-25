import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// Hoist the mock instance so vi.mock factory can close over it
const { mockZaloInstance } = vi.hoisted(() => ({
  mockZaloInstance: {
    current: null as null | {
      login: ReturnType<typeof vi.fn>
      loginQR: ReturnType<typeof vi.fn>
    },
  },
  mockApi: {
    current: null as null | {
      sendMessage: ReturnType<typeof vi.fn>
      getAllGroups: ReturnType<typeof vi.fn>
      logout: ReturnType<typeof vi.fn>
    },
  },
}))

let tmpDir: string
vi.mock('@/lib/zalo/paths', () => ({
  get dataDir() { return tmpDir },
  get credentialsPath() { return join(tmpDir, 'zalo-bot-credentials.json') },
  get errorLogPath() { return join(tmpDir, 'zalo-bot-errors.log') },
}))

vi.mock('zca-js', () => {
  return {
    Zalo: class MockZalo {
      login = (...args: unknown[]) => mockZaloInstance.current!.login(...(args as [unknown]))
      loginQR = (...args: unknown[]) => mockZaloInstance.current!.loginQR(...(args as [unknown, (event: unknown) => unknown]))
    },
    LoginQRCallbackEventType: {
      QRCodeGenerated: 0,
      QRCodeExpired: 1,
      QRCodeScanned: 2,
      QRCodeDeclined: 3,
      GotLoginInfo: 4,
    },
  }
})

import { bot } from '@/lib/zalo/bot'

describe('zalo bot state machine', () => {
  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'zalo-bot-'))
    const sendMessage = vi.fn(async () => ({ msgId: 'm1' }))
    const getAllGroups = vi.fn(async () => [{ groupId: '111', name: 'Mock' }])
    const logout = vi.fn(async () => {})

    let qrCallback: ((event: unknown) => unknown) | null = null
    mockZaloInstance.current = {
      login: vi.fn(async () => ({ sendMessage, getAllGroups, logout })),
      loginQR: vi.fn(async (_opts: unknown, cb: (event: unknown) => unknown) => {
        qrCallback = cb
        // Emit QRCodeGenerated synchronously
        cb({
          type: 0, // QRCodeGenerated
          data: { code: 'c', image: 'data:image/png;base64,FAKE', token: 'tok', options: {} },
          actions: {},
        })
        // Stash callback so test can trigger GotLoginInfo
        ;(mockZaloInstance.current as unknown as { _cb: unknown })._cb = cb
        return new Promise(() => {}) // never resolves — loginQR stays pending
      }),
    }
    bot.reset()
  })

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true })
  })

  it('starts DISCONNECTED', () => {
    expect(bot.status().state).toBe('DISCONNECTED')
  })

  it('initQR transitions to CONNECTING and emits QR event', async () => {
    let receivedQr: { image: string; token: string } | null = null
    await bot.initQR({
      onEvent: (e) => {
        if (e.type === 'qr') receivedQr = e.qr
      },
    })
    // Allow microtasks to flush
    await new Promise((r) => setTimeout(r, 20))
    expect(receivedQr?.image).toContain('FAKE')
    expect(bot.status().state).toBe('CONNECTING')
    expect(bot.status().qr?.image).toContain('FAKE')
  })

  it('trigger GotLoginInfo transitions to CONNECTED and saves credentials', async () => {
    const events: string[] = []
    await bot.initQR({
      onEvent: (e) => { events.push(e.type) },
    })
    await new Promise((r) => setTimeout(r, 20))
    // Simulate GotLoginInfo
    bot.simulateGotLoginInfo({ cookie: ['c=1'], imei: 'abc', userAgent: 'UA/1' })
    await new Promise((r) => setTimeout(r, 50))
    expect(events).toContain('login')
    expect(existsSync(join(tmpDir, 'zalo-bot-credentials.json'))).toBe(true)
  })

  it('ensureLoggedIn returns api after first login, dedup in-flight', async () => {
    // Pre-seed credentials
    writeFileSync(
      join(tmpDir, 'zalo-bot-credentials.json'),
      JSON.stringify({ cookie: ['c=1'], imei: 'abc', userAgent: 'UA', savedAt: new Date().toISOString() })
    )
    const [a, b] = await Promise.all([bot.ensureLoggedIn(), bot.ensureLoggedIn()])
    expect(a).toBe(b)
    expect(mockZaloInstance.current!.login).toHaveBeenCalledTimes(1)
  })

  it('logout clears credentials and transitions to DISCONNECTED', async () => {
    writeFileSync(
      join(tmpDir, 'zalo-bot-credentials.json'),
      JSON.stringify({ cookie: ['c=1'], imei: 'abc', userAgent: 'UA', savedAt: new Date().toISOString() })
    )
    await bot.ensureLoggedIn()
    expect(bot.status().state).toBe('CONNECTED')
    await bot.logout()
    expect(bot.status().state).toBe('DISCONNECTED')
    expect(existsSync(join(tmpDir, 'zalo-bot-credentials.json'))).toBe(false)
  })

  it('send with valid threadId calls api.sendMessage', async () => {
    writeFileSync(
      join(tmpDir, 'zalo-bot-credentials.json'),
      JSON.stringify({ cookie: ['c=1'], imei: 'abc', userAgent: 'UA', savedAt: new Date().toISOString() })
    )
    await bot.ensureLoggedIn()
    const result = await bot.send('hello', '111')
    expect(result.msgId).toBe('m1')
  })

  it('send without threadId throws', async () => {
    writeFileSync(
      join(tmpDir, 'zalo-bot-credentials.json'),
      JSON.stringify({ cookie: ['c=1'], imei: 'abc', userAgent: 'UA', savedAt: new Date().toISOString() })
    )
    await bot.ensureLoggedIn()
    await expect(bot.send('hello', '')).rejects.toThrow(/threadId/)
  })
})
