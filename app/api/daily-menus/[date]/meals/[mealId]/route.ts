import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { DailyMenusController } from '@/controllers/DailyMenusController'

const controller = new DailyMenusController()

export const DELETE = withAdmin(async (
  req: NextRequest,
  userId: string,
  role: string,
  context: { params: Promise<{ date: string; mealId: string }> }
) => {
  const { date: dateStr, mealId } = await context.params
  return controller.deleteMealFromDate(dateStr, mealId)
})
