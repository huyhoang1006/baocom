import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/authMiddleware', () => ({
  withAdmin: (handler: unknown) => (...args: unknown[]) =>
    (handler as (...a: unknown[]) => unknown)(...args),
}))

const botSendMock = vi.fn()
vi.mock('@/lib/zalo/bot', () => ({
  bot: { send: botSendMock },
}))

const getGroupIdMock = vi.fn()
vi.mock('@/lib/zalo/config', () => ({
  getGroupId: getGroupIdMock,
}))

const appendSendMock = vi.fn()
vi.mock('@/lib/zalo/send-log', () => ({
  appendSend: appendSendMock,
}))

function makeReq(body: unknown): NextRequest {
  return new Request('http://localhost/api/zalo/send', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as unknown as NextRequest
}

async function callPost(body: unknown) {
  const { POST } = await import('./route')
  const req = makeReq(body)
  return POST(req, { params: Promise.resolve({}) })
}

describe('POST /api/zalo/send', () => {
  beforeEach(() => {
    botSendMock.mockReset()
    getGroupIdMock.mockReset()
    appendSendMock.mockReset()
    getGroupIdMock.mockResolvedValue('5506436216265422412')
  })

  it('logs manual send to send-log on success', async () => {
    botSendMock.mockResolvedValue({ ok: true, msgId: 'm-123' })
    const res = await callPost({ text: 'Hello UAT' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true, msgId: 'm-123' })
    expect(appendSendMock).toHaveBeenCalledTimes(1)
    expect(appendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'manual',
        status: 'success',
        threadId: '5506436216265422412',
        preview: 'Hello UAT',
      })
    )
  })

  it('trims text and rejects empty', async () => {
    const res = await callPost({ text: '   ' })
    expect(res.status).toBe(400)
    expect(appendSendMock).not.toHaveBeenCalled()
    expect(botSendMock).not.toHaveBeenCalled()
  })

  it('rejects text > 2000 chars', async () => {
    const res = await callPost({ text: 'x'.repeat(2001) })
    expect(res.status).toBe(400)
    expect(appendSendMock).not.toHaveBeenCalled()
  })

  it('returns 400 when no groupId available', async () => {
    getGroupIdMock.mockResolvedValue(null)
    const res = await callPost({ text: 'Hello' })
    expect(res.status).toBe(400)
    expect(appendSendMock).not.toHaveBeenCalled()
  })

  it('uses body.threadId over configured groupId', async () => {
    botSendMock.mockResolvedValue({ ok: true, msgId: 'm-456' })
    const res = await callPost({ text: 'Hi', threadId: 'custom-thread' })
    expect(res.status).toBe(200)
    expect(appendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: 'custom-thread' })
    )
  })

  it('truncates preview to 100 chars', async () => {
    botSendMock.mockResolvedValue({ ok: true, msgId: 'm-789' })
    const longText = 'a'.repeat(150)
    const res = await callPost({ text: longText })
    expect(res.status).toBe(200)
    expect(appendSendMock.mock.calls[0]?.[0]?.preview).toHaveLength(100)
  })

  it('does NOT log on send failure (error path)', async () => {
    const err = new Error('Zalo API timeout')
    botSendMock.mockRejectedValue(err)
    const res = await callPost({ text: 'Hello' })
    // unknown error → 500 (not 503 which is for 'expired' kind)
    expect(res.status).toBeGreaterThanOrEqual(500)
    expect(appendSendMock).not.toHaveBeenCalled()
  })
})