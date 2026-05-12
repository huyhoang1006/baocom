import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function withAuth<T extends { params: Promise<{ id: string }> }>(handler: (req: NextRequest, userId: string, role: string, context: T) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: T) => {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return handler(req, payload.userId, payload.role, context!)
  }
}

export function withAdmin<T extends { params: Promise<{ id: string }> }>(handler: (req: NextRequest, userId: string, context: T) => Promise<NextResponse>) {
  return withAuth(async (req, userId, role, ctx) => {
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return handler(req, userId, ctx)
  })
}