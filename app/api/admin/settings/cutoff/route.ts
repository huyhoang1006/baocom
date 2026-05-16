import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { AdminSettingsController } from '@/controllers/AdminSettingsController'

const controller = new AdminSettingsController()

export const GET = withAdmin(async (req: NextRequest) => {
  return controller.getCutoff(req)
})

export const PUT = withAdmin(async (req: NextRequest, userId: string) => {
  return controller.updateCutoff(req, userId)
})
