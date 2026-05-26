import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SimpleHandler = (req: NextRequest, userId: string, role: string, ...args: any[]) => Promise<NextResponse>
type NextHandler = (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<Response>

export function withAuth(handler: SimpleHandler): NextHandler {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Validate tokenVersion against DB to enforce token rotation
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tokenVersion: true, isActive: true }
    })
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'Account disabled' }, { status: 403 })
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