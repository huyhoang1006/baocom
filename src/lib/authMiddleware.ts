import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SimpleHandler = (req: NextRequest, userId: string, role: string, ...args: any[]) => Promise<NextResponse>
type NextHandler = (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<Response>

export function withAuth(handler: SimpleHandler): NextHandler {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return handler(req, payload.userId, payload.role, ctx)
  }
}

export function withAdmin(handler: SimpleHandler): NextHandler {
  return withAuth(async (req: NextRequest, userId: string, role: string, ctx?: { params: Promise<Record<string, string>> }) => {
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return handler(req, userId, role, ctx)
  })
}