import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/authMiddleware', () => ({
  withAdmin: (handler: unknown) => (...args: unknown[]) =>
    (handler as (...a: unknown[]) => unknown)(...args),
}))

const renderPreviewMock = vi.fn()
const isAutoSendEnabledMock = vi.fn()
const getCronMock = vi.fn()

vi.mock('@/lib/zalo/auto-send', () => ({
  renderPreview: renderPreviewMock,
  runNow: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  restartWithNewCron: vi.fn(),
  pickTargetDate: vi.fn().mockResolvedValue(new Date(2026, 5, 23)),
  formatDateKey: (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`,
  dayNameVi: () => 'T3',
}))

vi.mock('@/lib/zalo/config', () => ({
  isAutoSendEnabled: isAutoSendEnabledMock,
  getCron: getCronMock,
  getSendMode: vi.fn().mockResolvedValue('auto'),
  getManualDate: vi.fn().mockResolvedValue(null),
}))

function makeReq(url: string): NextRequest {
  return new Request(url) as unknown as NextRequest
}

async function callGet(url: string) {
  const { GET } = await import('./route')
  const req = makeReq(url)
  return GET(req, { params: Promise.resolve({}) })
}

describe('GET /api/zalo/auto-send', () => {
  beforeEach(() => {
    renderPreviewMock.mockReset()
    isAutoSendEnabledMock.mockReset()
    getCronMock.mockReset()
  })

  describe('?preview=true', () => {
    it('returns preview string with generatedAt when renderPreview succeeds', async () => {
      renderPreviewMock.mockResolvedValue('🍱 Báo cơm 26/06/2026\n\n(Chưa có ai đăng ký)\n\n📋 - Phở')
      const res = await callGet('http://localhost/api/zalo/auto-send?preview=true')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(typeof body.preview).toBe('string')
      expect(body.preview).toContain('Báo cơm')
      expect(typeof body.generatedAt).toBe('string')
      expect(() => new Date(body.generatedAt).toISOString()).not.toThrow()
    })

    it('returns 503 with error message when renderPreview throws', async () => {
      renderPreviewMock.mockRejectedValue(new Error('DB down'))
      const res = await callGet('http://localhost/api/zalo/auto-send?preview=true')
      expect(res.status).toBe(503)
      const body = await res.json()
      expect(body.error).toBe('DB down')
    })

    it('returns 503 with default message when renderPreview throws non-Error', async () => {
      renderPreviewMock.mockRejectedValue('plain string')
      const res = await callGet('http://localhost/api/zalo/auto-send?preview=true')
      expect(res.status).toBe(503)
      const body = await res.json()
      expect(body.error).toBe('Lỗi render preview')
    })
  })

  describe('regression: plain GET (no params)', () => {
    it('returns enabled + cron + new fields', async () => {
      isAutoSendEnabledMock.mockResolvedValue(true)
      getCronMock.mockResolvedValue('0 8 * * 1-5')
      const res = await callGet('http://localhost/api/zalo/auto-send')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.enabled).toBe(true)
      expect(body.cron).toBe('0 8 * * 1-5')
      expect(body.mode).toBe('auto')
      expect(body.targetDate).toBeDefined()
      expect(body.targetDayName).toBeDefined()
      expect(renderPreviewMock).not.toHaveBeenCalled()
    })

    it('returns disabled=false when config absent', async () => {
      isAutoSendEnabledMock.mockResolvedValue(false)
      getCronMock.mockResolvedValue('0 8 * * 1-5')
      const res = await callGet('http://localhost/api/zalo/auto-send')
      const body = await res.json()
      expect(body.enabled).toBe(false)
    })
  })

  describe('?preview=false should not invoke preview', () => {
    it('treats preview=false as plain GET', async () => {
      isAutoSendEnabledMock.mockResolvedValue(false)
      getCronMock.mockResolvedValue('0 8 * * 1-5')
      const res = await callGet('http://localhost/api/zalo/auto-send?preview=false')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.enabled).toBe(false)
      expect(body.cron).toBe('0 8 * * 1-5')
      expect(renderPreviewMock).not.toHaveBeenCalled()
    })
  })
})