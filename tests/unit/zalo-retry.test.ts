import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '@/lib/zalo/retry'

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, { max: 3, delays: [10, 20, 40] })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries up to max on retryable failures, then throws', async () => {
    const err = new Error('boom')
    const fn = vi.fn().mockRejectedValue(err)
    await expect(
      withRetry(fn, { max: 3, delays: [1, 1, 1], shouldRetry: () => true })
    ).rejects.toThrow('boom')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('stops early when shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fatal'))
    await expect(
      withRetry(fn, { max: 5, delays: [1, 1, 1, 1, 1], shouldRetry: () => false })
    ).rejects.toThrow('fatal')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('uses delay array in order', async () => {
    const delays: number[] = []
    const originalSetTimeout = global.setTimeout
    global.setTimeout = ((cb: () => void, ms: number) => {
      delays.push(ms)
      return originalSetTimeout(cb, ms)
    }) as typeof setTimeout
    try {
      const fn = vi.fn().mockRejectedValue(new Error('retry me'))
      await expect(
        withRetry(fn, { max: 3, delays: [50, 100, 200], shouldRetry: () => true })
      ).rejects.toThrow('retry me')
      expect(delays).toEqual([50, 100])
    } finally {
      global.setTimeout = originalSetTimeout
    }
  })
})
