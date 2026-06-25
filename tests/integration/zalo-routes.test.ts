import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const { mockZaloInstance, mockApiState } = vi.hoisted(() => ({
  mockZaloInstance: { current: null as null | { login: ReturnType<typeof vi.fn>; loginQR: ReturnType<typeof vi.fn> } },
  mockApiState: { current: null as null | { sendMessage: ReturnType<typeof vi.fn>; getAllGroups: ReturnType<typeof vi.fn>; getGroupInfo?: ReturnType<typeof vi.fn> } },
}))

let tmpDir: string
vi.mock('@/lib/zalo/paths', () => ({
  get dataDir() { return tmpDir },
  get credentialsPath() { return join(tmpDir, 'zalo-bot-credentials.json') },
  get errorLogPath() { return join(tmpDir, 'zalo-bot-errors.log') },
}))

vi.mock('zca-js', () => {
  const loginFn = (creds: unknown) =>
    (mockZaloInstance.current!.login as unknown as (c: unknown) => unknown)(creds)
  return {
    Zalo: class MockZalo {
      login = loginFn
      loginQR = (opts: unknown, cb: (event: unknown) => unknown) =>
        (mockZaloInstance.current!.loginQR as unknown as (o: unknown, c: (event: unknown) => unknown) => unknown)(opts, cb)
    },
    LoginQRCallbackEventType: {
      QRCodeGenerated: 0, QRCodeExpired: 1, QRCodeScanned: 2, QRCodeDeclined: 3, GotLoginInfo: 4,
    },
  }
})

import { prisma } from '@/lib/prisma'
import { bot } from '@/lib/zalo/bot'

describe('zalo API routes (smoke)', () => {
  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'zalo-routes-'))

    mockApiState.current = {
      sendMessage: vi.fn(async () => ({ msgId: 'mock-1' })),
      getAllGroups: vi.fn(async () => ({ gridVerMap: { '111': 'v1' } })),
      getGroupInfo: vi.fn(async (id: string) => ({
        gridInfoMap: { [id]: { name: `Group ${id}`, totalMember: 5 } },
      })),
    }
    mockZaloInstance.current = {
      login: vi.fn(async () => mockApiState.current),
      loginQR: vi.fn(async (_o: unknown, _cb: unknown) => new Promise(() => {})),
    }
    bot.reset()
    await prisma.zaloConfig.deleteMany()

    // Pre-seed valid credentials
    writeFileSync(
      join(tmpDir, 'zalo-bot-credentials.json'),
      JSON.stringify({ cookie: ['c=1'], imei: 'abc', userAgent: 'UA', savedAt: new Date().toISOString() })
    )
  })

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true })
  })

  it('bot.send uses sendMessage with the configured groupId', async () => {
    await prisma.zaloConfig.create({ data: { key: 'zalo.groupId', value: '111' } })
    const result = await bot.send('hello', '111')
    expect(result.msgId).toBe('mock-1')
    expect(mockApiState.current!.sendMessage).toHaveBeenCalledWith({ msg: 'hello' }, '111', 1)
  })

  it('bot.send without threadId throws', async () => {
    await expect(bot.send('hello', '')).rejects.toThrow(/threadId/)
  })

  it('bot.listGroups returns groups from gridVerMap', async () => {
    await bot.ensureLoggedIn()
    const groups = await bot.listGroups()
    expect(groups).toHaveLength(1)
    expect(groups[0].groupId).toBe('111')
    expect(groups[0].name).toBe('Group 111')
  })

  it('config helpers work end-to-end with prisma', async () => {
    const { setGroupId, getGroupId, isAutoSendEnabled, setAutoSendEnabled, getCron, setCron, getTemplate, getAll } = await import('@/lib/zalo/config')
    await setGroupId('9876543210')
    expect(await getGroupId()).toBe('9876543210')

    expect(await isAutoSendEnabled()).toBe(false)
    await setAutoSendEnabled(true)
    expect(await isAutoSendEnabled()).toBe(true)

    expect(await getCron()).toBe('0 8 * * 1-5')
    await setCron('*/10 * * * *')
    expect(await getCron()).toBe('*/10 * * * *')

    expect(await getTemplate()).toBe('🍱 Báo cơm {date}\n{menu}')
    const all = await getAll()
    expect(all.groupId).toBe('9876543210')
    expect(all.autoSendEnabled).toBe(true)
    expect(all.cron).toBe('*/10 * * * *')
  })
})
