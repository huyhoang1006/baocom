import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryRateLimiter } from '@/lib/rateLimiter'

describe('InMemoryRateLimiter', () => {
  let limiter: InMemoryRateLimiter

  beforeEach(() => {
    limiter = new InMemoryRateLimiter({
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      lockoutMs: 15 * 60 * 1000
    })
  })

  it('should allow requests under threshold', () => {
    const result = limiter.checkLimit('192.168.1.1')
    expect(result.allowed).toBe(true)
  })

  it('should track failed attempts', () => {
    limiter.recordFailedAttempt('192.168.1.1')
    const state = limiter.getState('192.168.1.1')
    expect(state?.attempts).toBe(1)
  })

  it('should lock IP after max attempts', () => {
    for (let i = 0; i < 5; i++) {
      limiter.recordFailedAttempt('192.168.1.1')
    }
    const result = limiter.checkLimit('192.168.1.1')
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBe(900)
  })

  it('should reset attempts on success', () => {
    limiter.recordFailedAttempt('192.168.1.1')
    limiter.recordFailedAttempt('192.168.1.1')
    limiter.recordSuccess('192.168.1.1')
    // Success deletes the entry entirely
    const state = limiter.getState('192.168.1.1')
    expect(state).toBeUndefined()
  })

  it('should reset attempts after window expiry', () => {
    limiter.recordFailedAttempt('192.168.1.1')
    limiter.recordFailedAttempt('192.168.1.1')
    // Simulate time passing beyond window (16 minutes ago)
    const state = limiter.getState('192.168.1.1')
    state!.lastAttempt = Date.now() - (16 * 60 * 1000)
    // Next attempt should reset to 1, not increment to 3
    limiter.recordFailedAttempt('192.168.1.1')
    const newState = limiter.getState('192.168.1.1')
    expect(newState?.attempts).toBe(1)
  })
})