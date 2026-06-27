import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/authMiddleware', () => ({
  withAdmin: (handler: unknown) => (...args: unknown[]) =>
    (handler as (...a: unknown[]) => unknown)(...args),
}))

const readRecentMock = vi.fn()
vi.mock('@/lib/zalo/send-log', () => ({
  readRecent: readRecentMock,
}))

describe('GET /api/zalo/auto-send/recent', () => {
  beforeEach(() => {
    readRecentMock.mockReset()
  })

  it('returns last N entries with default limit=10', async () => {
    readRecentMock.mockReturnValue([
      { timestamp: '2026-06-26T08:00:00Z', kind: 'auto', status: 'success', threadId: '1', preview: 'a' },
    ])
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/zalo/auto-send/recent')
    const res = await GET(req as unknown as Parameters<typeof GET>[0], { params: Promise.resolve({}) })
    const body = await res.json()
    expect(body.entries).toHaveLength(1)
    expect(readRecentMock).toHaveBeenCalledWith(10)
  })

  it('honors limit query param up to max 50', async () => {
    readRecentMock.mockReturnValue([])
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/zalo/auto-send/recent?limit=25')
    const res = await GET(req as unknown as Parameters<typeof GET>[0], { params: Promise.resolve({}) })
    await res.json()
    expect(readRecentMock).toHaveBeenCalledWith(25)
  })

  it('clamps limit > 50 to 50', async () => {
    readRecentMock.mockReturnValue([])
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/zalo/auto-send/recent?limit=999')
    const res = await GET(req as unknown as Parameters<typeof GET>[0], { params: Promise.resolve({}) })
    await res.json()
    expect(readRecentMock).toHaveBeenCalledWith(50)
  })

  it('clamps limit < 1 to 1', async () => {
    readRecentMock.mockReturnValue([])
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/zalo/auto-send/recent?limit=0')
    const res = await GET(req as unknown as Parameters<typeof GET>[0], { params: Promise.resolve({}) })
    await res.json()
    expect(readRecentMock).toHaveBeenCalledWith(1)
  })

  it('returns empty entries array when no history', async () => {
    readRecentMock.mockReturnValue([])
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/zalo/auto-send/recent')
    const res = await GET(req as unknown as Parameters<typeof GET>[0], { params: Promise.resolve({}) })
    const body = await res.json()
    expect(body).toEqual({ entries: [] })
  })
})