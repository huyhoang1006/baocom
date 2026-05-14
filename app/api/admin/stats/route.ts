import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { AdminStatsController } from '@/controllers/AdminStatsController'

const controller = new AdminStatsController()

export const GET = withAdmin(async () => {
  return controller.getTodayStats()
})