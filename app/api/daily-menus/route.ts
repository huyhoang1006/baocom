import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAdmin } from '@/lib/authMiddleware'
import { DailyMenusController } from '@/controllers/DailyMenusController'

const controller = new DailyMenusController()

export const GET = withAuth(async (req: NextRequest) => {
  return controller.getAll(req)
})

export const POST = withAdmin(async (req: NextRequest) => {
  return controller.create(req)
})