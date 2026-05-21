import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { AdminStatsController } from '@/controllers/AdminStatsController'

const controller = new AdminStatsController()

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json({ error: 'Missing required query param: date' }, { status: 400 })
  }
  if (!DATE_REGEX.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
  }

  const dateObj = new Date(date + 'T00:00:00+07:00')
  return controller.getStatsForDate(dateObj)
})