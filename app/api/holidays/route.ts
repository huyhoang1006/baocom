import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async () => {
  const holidays = await prisma.holiday.findMany({
    where: { isActive: true },
    orderBy: { date: 'asc' }
  })
  return NextResponse.json({ holidays })
})

export const POST = withAdmin(async (req: NextRequest) => {
  const { date, description } = await req.json()

  if (!date) {
    return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  }

  const dateObj = new Date(date)

  const holiday = await prisma.holiday.create({
    data: { date: dateObj, description: description || null }
  })

  return NextResponse.json({ holiday })
})