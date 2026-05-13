import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { AdminStatsController } from '@/controllers/AdminStatsController'

const controller = new AdminStatsController()

export const GET = withAuth(async () => {
  return controller.getTodayStats()
})