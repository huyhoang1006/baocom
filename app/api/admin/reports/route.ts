import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const includeSundays = searchParams.get('includeSundays') === 'true'

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  // Sundays are excluded from reports by default (no lunch service)
  // Set includeSundays=true to include Sundays in the report
  const registrations = await prisma.registration.findMany({
    where: {
      date: { gte: start, lte: end },
      status: 'eating',
      ...(!includeSundays ? { date: { not: { equals: new Date() } } } : {})
    },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { date: 'asc' }
  })

  // Filter out Sundays from results (no lunch service on Sundays)
  const filtered = registrations.filter(r => {
    const day = new Date(r.date).getDay()
    return day !== 0 || includeSundays
  })

  // Group by date for stats
  const dateGroups: Record<string, number> = {}
  filtered.forEach(r => {
    const dateKey = new Date(r.date).toISOString().split('T')[0]
    dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1
  })

  const reportData = filtered.map((r, idx) => ({
    stt: idx + 1,
    name: r.user.name,
    phone: r.user.username,
    date: new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }))

  return NextResponse.json({
    reportData,
    stats: {
      total: reportData.length,
      byDate: dateGroups
    }
  })
})
