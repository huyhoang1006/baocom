import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { AdminStatsController } from '@/controllers/AdminStatsController'

const controller = new AdminStatsController()

export const GET = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ date: string }> }) => {
  const { date } = await context.params
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }
  // Ensure default registrations exist before returning stats
  await controller.ensureDefaultRegistrations(parsedDate)
  return controller.getStatsForDate(parsedDate)
})
