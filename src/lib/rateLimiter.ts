import { NextRequest } from 'next/server'

interface IPState {
  attempts: number
  lockedUntil: number | null
  lastAttempt: number
}

interface RateLimiterOptions {
  maxAttempts: number
  windowMs: number
  lockoutMs: number
}

export class InMemoryRateLimiter {
  private store: Map<string, IPState> = new Map()
  private options: RateLimiterOptions
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor(options: RateLimiterOptions) {
    this.options = options
    this.startCleanup()
  }

  getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    return ip
  }

  isLocked(ip: string): boolean {
    const state = this.store.get(ip)
    if (!state?.lockedUntil) return false
    return Date.now() < state.lockedUntil
  }

  recordFailedAttempt(ip: string): void {
    // Bypass rate limiting in test environment
    if (process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT_BYPASS === 'true') {
      return
    }

    const now = Date.now()
    const state = this.store.get(ip)

    if (!state) {
      this.store.set(ip, { attempts: 1, lockedUntil: null, lastAttempt: now })
      return
    }

    if (state.lockedUntil && now < state.lockedUntil) {
      return // Already locked
    }

    // Check if past window - reset attempts instead of incrementing
    if (now - state.lastAttempt > this.options.windowMs) {
      state.attempts = 1
    } else {
      state.attempts++
    }
    state.lastAttempt = now

    if (state.attempts >= this.options.maxAttempts) {
      state.lockedUntil = now + this.options.lockoutMs
    }
  }

  recordSuccess(ip: string): void {
    // Bypass rate limiting in test environment
    if (process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT_BYPASS === 'true') {
      return
    }
    this.store.delete(ip)
  }

  checkLimit(ip: string): { allowed: boolean; retryAfter?: number } {
    // Bypass rate limiting in test environment
    if (process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT_BYPASS === 'true') {
      return { allowed: true }
    }

    const state = this.store.get(ip)

    if (!state) {
      return { allowed: true }
    }

    if (state.lockedUntil && Date.now() < state.lockedUntil) {
      const retryAfter = Math.ceil((state.lockedUntil - Date.now()) / 1000)
      return { allowed: false, retryAfter }
    }

    if (state.attempts >= this.options.maxAttempts) {
      state.lockedUntil = Date.now() + this.options.lockoutMs
      return { allowed: false, retryAfter: Math.ceil(this.options.lockoutMs / 1000) }
    }

    return { allowed: true }
  }

  getState(ip: string): IPState | undefined {
    return this.store.get(ip)
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [ip, state] of this.store.entries()) {
        if (state.lockedUntil && now >= state.lockedUntil) {
          this.store.delete(ip)
        }
        if (!state.lockedUntil && now - state.lastAttempt > this.options.windowMs) {
          this.store.delete(ip)
        }
      }
    }, 60 * 1000) // Cleanup every minute
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// Singleton instance with config
export const loginRateLimiter = new InMemoryRateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 15 * 60 * 1000
})