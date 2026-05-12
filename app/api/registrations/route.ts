import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (req: NextRequest, userId: string) => {
  const { searchParams } = req.nextUrl
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const where: { userId: string; date?: { gte: Date; lte: Date } } = { userId }

  if (startDate && endDate) {
    where.date = { gte: new Date(startDate), lte: new Date(endDate) }
  }

  const registrations = await prisma.registration.findMany({
    where,
    orderBy: { date: 'asc' }
  })

  return NextResponse.json({ registrations })
})

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  const { date, status } = await req.json()

  if (!date || !status) {
    return NextResponse.json({ error: 'Missing date or status' }, { status: 400 })
  }

  if (!['eating', 'not_eating'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const dateObj = new Date(date)

  const registration = await prisma.registration.upsert({
    where: { userId_date: { userId, date: dateObj } },
    update: { status },
    create: { userId, date: dateObj, status }
  })

  return NextResponse.json({ registration })
})
