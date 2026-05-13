# Rate Limiting for Login Endpoint Design

**Document ID:** BAOCOM-DESIGN-RATE-LIMIT  
**Version:** 1.0  
**Date:** 2026-05-13  
**Status:** Approved

---

## 1. Problem

TC-AUTH-SEC-002: Login endpoint has no brute force attack protection. An attacker can make unlimited login attempts to guess user passwords.

---

## 2. Solution

Implement in-memory rate limiter that tracks failed login attempts per IP address and locks out IPs that exceed the threshold.

---

## 3. Architecture

### InMemoryRateLimiter Class

```typescript
class InMemoryRateLimiter {
  private store: Map<string, { attempts: number; lockedUntil: number | null }>
  private cleanupInterval: NodeJS.Timeout | null

  constructor(options: { maxAttempts: number; windowMs: number; lockoutMs: number })
  getClientIP(request: NextRequest): string
  isLocked(ip: string): boolean
  recordFailedAttempt(ip: string): void
  recordSuccess(ip: string): void
  cleanup(): void  // Remove expired entries
  checkLimit(ip: string): { allowed: boolean; retryAfter?: number }
}
}
```

**Config values:**
- maxAttempts: 5
- windowMs: 15 * 60 * 1000 (15 minutes)
- lockoutMs: 15 * 60 * 1000 (15 minutes)

---

## 4. Data Flow

```
Request → getClientIP() → isLocked(ip)?
  ├── true → return 429 { error, retryAfter }
  └── false → process login
        ├── success → recordSuccess(ip) → reset attempts
        └── failure → recordFailedAttempt(ip)
                         ├── attempts < 5 → return 401
                         └── attempts >= 5 → lock IP 15 min → return 429
```

---

## 5. API Response

### Locked Out Response (429)
```json
{
  "error": "Too many failed attempts. Please try again after 15 minutes.",
  "retryAfter": 900
}
```

### Failed Attempt Response (401) - Unchanged
```json
{
  "error": "Invalid credentials"
}
```

---

## 6. File Structure

```
src/
├── lib/
│   └── rateLimiter.ts      # InMemoryRateLimiter class
app/api/auth/login/
└── route.ts                # Apply rate limiter check
```

---

## 7. Implementation Steps

1. Create `src/lib/rateLimiter.ts` with InMemoryRateLimiter class
2. Create rate limiter instance with config values
3. Import and apply in login route before password verification
4. Return 429 with retryAfter when locked
5. Add unit tests for rate limiter

---

## 8. Acceptance Criteria

- [ ] IP is locked after 5 failed attempts within 15 minutes
- [ ] Locked IP receives 429 response with retryAfter
- [ ] Successful login resets attempt counter
- [ ] Lockout automatically expires after 15 minutes
- [ ] No external dependencies required
- [ ] In-memory store works for single-instance deployment