# Remove Login Rate Limiter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xóa bỏ hoàn toàn tính năng khóa IP (rate limit lockout) khi đăng nhập thất bại nhiều lần.

**Architecture:** Xóa file rateLimiter.ts và chỉnh sửa login route để remove all rate limiter logic. Không ảnh hưởng đến các API khác hoặc JWT authentication.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma

---

## Task 1: Delete src/lib/rateLimiter.ts

**Files:**
- Delete: `src/lib/rateLimiter.ts`

- [ ] **Step 1: Verify the file exists and check for any other imports**

```bash
grep -r "rateLimiter\|loginRateLimiter\|RateLimiter" --include="*.ts" --include="*.tsx" .
```

Expected: Only `app/api/auth/login/route.ts` should reference it (plus tests).

- [ ] **Step 2: Delete the file**

```bash
rm src/lib/rateLimiter.ts
git add src/lib/rateLimiter.ts
git commit -m "chore: remove login rate limiter module"
```

---

## Task 2: Delete tests/lib/rateLimiter.test.ts

**Files:**
- Delete: `tests/lib/rateLimiter.test.ts`

- [ ] **Step 1: Verify the test file exists**

```bash
ls -la tests/lib/rateLimiter.test.ts
```

- [ ] **Step 2: Delete the file**

```bash
rm tests/lib/rateLimiter.test.ts
git add tests/lib/rateLimiter.test.ts
git commit -m "chore: remove rate limiter tests"
```

---

## Task 3: Modify app/api/auth/login/route.ts

**Files:**
- Modify: `app/api/auth/login/route.ts`

**Current state (lines to remove):**
```typescript
import { loginRateLimiter } from '@/lib/rateLimiter'
// ...
const bypassRateLimit = process.env.RATE_LIMIT_BYPASS === 'true'
let ip: string | undefined

if (!bypassRateLimit) {
  ip = loginRateLimiter.getClientIP(request as unknown as NextRequest)
  const limitCheck = loginRateLimiter.checkLimit(ip)
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Please try again after 15 minutes.', retryAfter: limitCheck.retryAfter },
      { status: 429 }
    )
  }
}
// ... after failed login ...
if (!bypassRateLimit) loginRateLimiter.recordFailedAttempt(ip!)
// ... after successful login ...
if (!bypassRateLimit) loginRateLimiter.recordSuccess(ip!)
```

- [ ] **Step 1: Read the current file to identify exact lines**

```bash
cat -n app/api/auth/login/route.ts
```

- [ ] **Step 2: Edit to remove rate limiter import**

Replace:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'
import { loginRateLimiter } from '@/lib/rateLimiter'
import { loginRateLimiter } from '@/lib/rateLimiter'
```

With:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'
```

- [ ] **Step 3: Remove bypassRateLimit and ip variable declaration**

Remove these lines:
```typescript
const bypassRateLimit = process.env.RATE_LIMIT_BYPASS === 'true'
let ip: string | undefined
```

- [ ] **Step 4: Remove the rate limit check block**

Remove this entire block:
```typescript
if (!bypassRateLimit) {
  ip = loginRateLimiter.getClientIP(request as unknown as NextRequest)
  const limitCheck = loginRateLimiter.checkLimit(ip)
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Please try again after 15 minutes.', retryAfter: limitCheck.retryAfter },
      { status: 429 }
    )
  }
}
```

- [ ] **Step 5: Remove failed attempt recording after invalid password**

Remove:
```typescript
if (!isValid) {
  if (!bypassRateLimit) loginRateLimiter.recordFailedAttempt(ip!)
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
```

Replace with:
```typescript
if (!isValid) {
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
```

- [ ] **Step 6: Remove failed attempt recording after inactive user**

Remove:
```typescript
if (!user || !user.isActive) {
  if (!bypassRateLimit) loginRateLimiter.recordFailedAttempt(ip!)
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
```

Replace with:
```typescript
if (!user || !user.isActive) {
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
```

- [ ] **Step 7: Remove success recording**

Remove:
```typescript
if (!bypassRateLimit) loginRateLimiter.recordSuccess(ip!)
```

- [ ] **Step 8: Commit the changes**

```bash
git add app/api/auth/login/route.ts
git commit -m "chore: remove rate limiter from login route"
```

---

## Task 4: Modify BUSINESS_RULES.md

**Files:**
- Modify: `BUSINESS_RULES.md`

**Current state (lines 589-596):**
```xml
  <constant name="LOGIN_RATE_LIMIT_WINDOW">
    <value>15 minutes</value>
    <location>src/lib/rateLimiter.ts</location>
  </constant>
  <constant name="LOGIN_RATE_LIMIT_MAX">
    <value>5 attempts</value>
    <location>src/lib/rateLimiter.ts</location>
  </constant>
```

- [ ] **Step 1: Read the file to find exact lines**

```bash
grep -n "LOGIN_RATE_LIMIT" BUSINESS_RULES.md
```

- [ ] **Step 2: Edit to remove the two constants**

Remove this entire block:
```xml
  <constant name="LOGIN_RATE_LIMIT_WINDOW">
    <value>15 minutes</value>
    <location>src/lib/rateLimiter.ts</location>
  </constant>
  <constant name="LOGIN_RATE_LIMIT_MAX">
    <value>5 attempts</value>
    <location>src/lib/rateLimiter.ts</location>
  </constant>
```

- [ ] **Step 3: Also update login_flow to remove rate limit mention**

Find and update this line in BUSINESS_RULES.md:
```xml
<action>Rate limit check (15-minute lockout after failed attempts)</action>
```

To:
```xml
<action>Find user by username in database</action>
```

And remove:
```xml
<note>Rate limiting: login attempts limited per IP address</note>
```

- [ ] **Step 4: Commit the changes**

```bash
git add BUSINESS_RULES.md
git commit -m "chore: remove rate limiter constants from BUSINESS_RULES"
```

---

## Task 5: Modify CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Current state (line ~313):**
```
- **Global state:** Shared Prisma singleton in `src/lib/prisma.ts`; login rate limiter singleton imported by `app/api/auth/login/route.ts` from `src/lib/rateLimiter.ts`.
```

- [ ] **Step 1: Edit to remove rate limiter reference**

Replace:
```
- **Global state:** Shared Prisma singleton in `src/lib/prisma.ts`; login rate limiter singleton imported by `app/api/auth/login/route.ts` from `src/lib/rateLimiter.ts`.
```

With:
```
- **Global state:** Shared Prisma singleton in `src/lib/prisma.ts`.
```

- [ ] **Step 2: Commit the changes**

```bash
git add CLAUDE.md
git commit -m "chore: remove rate limiter from global state docs"
```

---

## Task 6: Verification

- [ ] **Step 1: Run linter to ensure no import errors**

```bash
npm run lint
```

Expected: No errors related to `rateLimiter` or `loginRateLimiter`.

- [ ] **Step 2: Verify tests pass (rate limiter tests should be gone)**

```bash
npm test -- --run
```

Expected: Test suite runs without rate limiter test errors.

- [ ] **Step 3: Test login API still works**

```bash
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | head -c 200
```

Expected: Returns `{"user":{"id":"..."}}` with 200 status.

- [ ] **Step 4: Test login with invalid credentials still returns 401**

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"wrongpassword"}'
```

Expected: `401`

- [ ] **Step 5: Verify no remaining references to rateLimiter**

```bash
grep -r "rateLimiter\|loginRateLimiter\|RateLimiter" --include="*.ts" --include="*.tsx" --include="*.md" . 2>/dev/null | grep -v node_modules | grep -v ".next"
```

Expected: No results (empty output).

- [ ] **Step 6: Push to remote**

```bash
git pull --rebase
git push
git status
```

Expected: "up to date with origin"

---

## Summary of Files Changed

| Action | File |
|--------|------|
| DELETE | `src/lib/rateLimiter.ts` |
| DELETE | `tests/lib/rateLimiter.test.ts` |
| MODIFY | `app/api/auth/login/route.ts` |
| MODIFY | `BUSINESS_RULES.md` |
| MODIFY | `CLAUDE.md` |