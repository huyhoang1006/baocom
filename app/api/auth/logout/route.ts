import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (_req, userId) => {
  // Bump tokenVersion → all existing JWT tokens for this user become invalid
  // The authMiddleware checks: user.tokenVersion !== payload.tokenVersion → 401
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } }
  })

  const response = NextResponse.json({ success: true })
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })
  return response
})
