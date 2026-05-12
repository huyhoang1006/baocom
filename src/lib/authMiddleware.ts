import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function withAuth(handler: (req: NextRequest, userId: string, role: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return handler(req, payload.userId, payload.role)
  }
}

export function withAdmin(handler: (req: NextRequest, userId: string) => Promise<NextResponse>) {
  return withAuth(async (req, userId, role) => {
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return handler(req, userId)
  })
}