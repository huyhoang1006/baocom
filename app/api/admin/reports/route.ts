import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { AdminReportsController } from '@/controllers/AdminReportsController'

const controller = new AdminReportsController()

export const GET = withAdmin(async (req: NextRequest) => {
  return controller.getReport(req)
})