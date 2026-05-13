# Rate Limiting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add brute force protection to login endpoint by tracking failed attempts per IP and locking out after 5 failures within 15 minutes.

**Architecture:** In-memory rate limiter using Map<string, IPState> where IPState tracks attempts and lockout expiry. Single-instance deployment with automatic cleanup of expired entries.

**Tech Stack:** TypeScript, Next.js App Router, native Map (no external deps)

---

## File Structure

```
src/lib/rateLimiter.ts           # Core rate limiter class
app/api/auth/login/route.ts     # Apply rate limiter in login POST
tests/lib/rateLimiter.test.ts   # Unit tests
```

---

## Task 1: Create rateLimiter.ts with InMemoryRateLimiter class

**Files:**
- Create: `src/lib/rateLimiter.ts`

- [ ] **Step 1: Write the failing test**

Create test file `tests/lib/rateLimiter.test.ts`:

```typescript
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
    const state = limiter.getState('192.168.1.1')
    expect(state?.attempts).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/rateLimiter.test.ts -v`
Expected: FAIL with "Module not found: @/lib/rateLimiter"

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/rateLimiter.ts`:

```typescript
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
    const now = Date.now()
    const state = this.store.get(ip)

    if (!state) {
      this.store.set(ip, { attempts: 1, lockedUntil: null, lastAttempt: now })
      return
    }

    if (state.lockedUntil && now < state.lockedUntil) {
      return // Already locked
    }

    state.attempts++
    state.lastAttempt = now

    if (state.attempts >= this.options.maxAttempts) {
      state.lockedUntil = now + this.options.lockoutMs
    }
  }

  recordSuccess(ip: string): void {
    this.store.delete(ip)
  }

  checkLimit(ip: string): { allowed: boolean; retryAfter?: number } {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/rateLimiter.test.ts -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/rateLimiter.ts tests/lib/rateLimiter.test.ts
git commit -m "feat: add InMemoryRateLimiter for login protection"
```

---

## Task 2: Apply rate limiter in login route

**Files:**
- Modify: `app/api/auth/login/route.ts:1-48`

- [ ] **Step 1: Read current route.ts**

Read the file to understand current implementation.

- [ ] **Step 2: Modify login route to check rate limit first**

Replace the POST handler:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'
import { loginRateLimiter } from '@/lib/rateLimiter'

export async function POST(request: Request) {
  try {
    // Get client IP
    const ip = loginRateLimiter.getClientIP(request as unknown as NextRequest)

    // Check if already locked
    const limitCheck = loginRateLimiter.checkLimit(ip)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again after 15 minutes.', retryAfter: limitCheck.retryAfter },
        { status: 429 }
      )
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || !user.isActive) {
      loginRateLimiter.recordFailedAttempt(ip)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      loginRateLimiter.recordFailedAttempt(ip)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Success - reset attempts
    loginRateLimiter.recordSuccess(ip)

    const token = signToken(user.id, user.role)

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

Need to add NextResponse import:

```typescript
import { NextRequest, NextResponse } from 'next/server'
```

- [ ] **Step 3: Run existing tests to ensure nothing breaks**

Run: `npm test -- -v`
Expected: All tests PASS

- [ ] **Step 4: Test manually with curl**

```bash
# Login attempt 1-5 should work (or 401 for wrong password)
for i in 1 2 3 4 5; do
  curl -s http://localhost:3000/api/auth/login -X POST -H 'Content-Type: application/json' -d '{"username":"admin","password":"wrong"}' | grep -o '"error"'
done

# 6th attempt should return 429
curl -s http://localhost:3000/api/auth/login -X POST -H 'Content-Type: application/json' -d '{"username":"admin","password":"wrong"}'
```

Expected output on 6th attempt: `{"error":"Too many failed attempts...","retryAfter":900}`

- [ ] **Step 5: Commit**

```bash
git add app/api/auth/login/route.ts
git commit -m "feat: apply rate limiter to login endpoint"
```

---

## Acceptance Criteria Verification

- [ ] Run `npm test` - all tests pass
- [ ] Manual test shows 429 after 5 failed attempts
- [ ] Successful login resets the counter

---

## Notes

- The rate limiter uses in-memory Map - works for single-instance Next.js deployment
- For multi-instance deployment (load balancer), consider Redis-based solution
- Cleanup interval removes expired entries every 60 seconds