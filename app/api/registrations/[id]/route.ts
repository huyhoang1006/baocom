import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const PATCH = withAuth(async (req: NextRequest, userId: string, role: string) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  const { status, note } = await req.json()

  const registration = await prisma.registration.findUnique({ where: { id } })

  if (!registration) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (role !== 'admin' && registration.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updateData: { status?: string; note?: string } = {}
  if (status && ['eating', 'not_eating'].includes(status)) {
    updateData.status = status
  }
  if (note !== undefined) {
    updateData.note = note
  }

  const updated = await prisma.registration.update({ where: { id }, data: updateData })
  return NextResponse.json({ registration: updated })
})

export const DELETE = withAdmin(async (req: NextRequest) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  await prisma.registration.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
