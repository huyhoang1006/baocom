import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'
import { loginRateLimiter } from '@/lib/rateLimiter'

export async function POST(request: Request) {
  try {
    // Get client IP and check rate limit (skip entirely if RATE_LIMIT_BYPASS is set)
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

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 })
    }

    // Validate username length to prevent abuse
    if (username.length > 255) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    // Always call verifyPassword to maintain constant time regardless of user existence
    const isValid = user ? await verifyPassword(password, user.password) : false
    if (!isValid) {
      if (!bypassRateLimit) loginRateLimiter.recordFailedAttempt(ip!)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check isActive after password verification
    if (!user || !user.isActive) {
      if (!bypassRateLimit) loginRateLimiter.recordFailedAttempt(ip!)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Success - reset attempts
    if (!bypassRateLimit) loginRateLimiter.recordSuccess(ip!)

    const token = await signToken(user.id, user.role)

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
      secure: process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') === 'https',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}