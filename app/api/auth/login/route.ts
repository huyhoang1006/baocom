import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'

export async function POST(request: Request) {
  // Parse JSON body — separate try/catch so malformed JSON returns 400
  // instead of being swallowed by the outer try/catch (BUG-011 fix).
  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { username, password } = body

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing username or password' }, { status: 400 })
  }

  // Validate username length to prevent abuse
  if (username.length > 255) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    })

    // Always call verifyPassword to maintain constant time regardless of user existence
    const isValid = user ? await verifyPassword(password, user.password) : false
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check isActive after password verification
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Success
    const token = await signToken(user.id, user.role, user.tokenVersion)

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