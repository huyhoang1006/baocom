import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/authMiddleware', () => ({
  withAdmin: (handler: unknown) => (...args: unknown[]) =>
    (handler as (...a: unknown[]) => unknown)(...args),
}))

const keepAliveStatusMock = vi.fn()
const debugKeepAliveNowMock = vi.fn()
const stopKeepAliveMock = vi.fn()
const startKeepAliveMock = vi.fn()
const statusMock = vi.fn()

vi.mock('@/lib/zalo/bot', () => ({
  bot: {
    keepAliveStatus: keepAliveStatusMock,
    debugKeepAliveNow: debugKeepAliveNowMock,
    stopKeepAlive: stopKeepAliveMock,
    startKeepAlive: startKeepAliveMock,
    status: statusMock,
  },
}))

vi.mock('@/lib/zalo/errors', () => ({
  classifyZaloError: (err: unknown) => ({
    kind: 'unknown',
    userMessage: err instanceof Error ? err.message : 'Lỗi',
    httpStatus: 500,
  }),
}))

function makeReq(body?: unknown): NextRequest {
  return new Request('http://localhost/api/zalo/debug/keepalive', {
    method: body === undefined ? 'GET' : 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as unknown as NextRequest
}

describe('GET/POST /api/zalo/debug/keepalive', () => {
  beforeEach(() => {
    keepAliveStatusMock.mockReset()
    debugKeepAliveNowMock.mockReset()
    stopKeepAliveMock.mockReset()
    startKeepAliveMock.mockReset()
    statusMock.mockReset()
    keepAliveStatusMock.mockReturnValue({ active: true, intervalMs: 1800000 })
    statusMock.mockReturnValue({ state: 'CONNECTED', account: { displayName: 'Bot Zalo' } })
  })

  it('GET returns compact bot status and keepAlive status', async () => {
    const { GET } = await import('./route')
    const res = await GET(makeReq(), { params: Promise.resolve({}) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.keepAlive).toEqual({ active: true, intervalMs: 1800000 })
    expect(body.bot).toEqual({
      state: 'CONNECTED',
      account: { displayName: 'Bot Zalo' },
      lastConnectedAt: undefined,
      lastError: undefined,
      hasQr: false,
    })
  })

  it('POST restart + intervalMs restarts keepAlive', async () => {
    const { POST } = await import('./route')
    const res = await POST(makeReq({ restart: true, intervalMs: 30000 }), { params: Promise.resolve({}) })
    expect(res.status).toBe(200)
    expect(stopKeepAliveMock).toHaveBeenCalledTimes(2)
    expect(startKeepAliveMock).toHaveBeenCalledWith(30000)
  })

  it('POST triggerNow returns keepAlive result', async () => {
    debugKeepAliveNowMock.mockResolvedValue({ config_vesion: 123 })
    const { POST } = await import('./route')
    const res = await POST(makeReq({ triggerNow: true }), { params: Promise.resolve({}) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.result).toEqual({ config_vesion: 123 })
  })

  it('POST rejects invalid intervalMs', async () => {
    const { POST } = await import('./route')
    const res = await POST(makeReq({ intervalMs: 999 }), { params: Promise.resolve({}) })
    expect(res.status).toBe(400)
  })
})