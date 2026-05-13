import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAdmin } from '@/lib/authMiddleware'
import { DailyMenusController } from '@/controllers/DailyMenusController'

const controller = new DailyMenusController()

export const GET = withAuth(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ date: string }> }) => {
  const { date: dateStr } = await context.params
  return controller.getByDate(req, dateStr)
})

export const PUT = withAdmin(async (req: NextRequest, userId: string, context: { params: Promise<{ date: string }> }) => {
  const { date: dateStr } = await context.params
  return controller.updateByDate(req, dateStr)
})