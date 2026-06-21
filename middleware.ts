import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// In-memory rate limit map (IP → recent attempt timestamps)
const loginAttempts = new Map<string, number[]>()

function isRateLimited(ip: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now()
  const attempts = (loginAttempts.get(ip) || []).filter(t => now - t < windowMs)
  attempts.push(now)
  loginAttempts.set(ip, attempts)
  return attempts.length > max
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate-limit /api/auth/login POST attempts
  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 1 minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
    return NextResponse.next()
  }

  // Existing /admin/* auth logic
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/auth/login'],
}
