import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAdmin } from '@/lib/authMiddleware'
import { HolidaysController } from '@/controllers/HolidaysController'

const controller = new HolidaysController()

export const GET = withAdmin(async (req: NextRequest) => {
  return controller.getAll()
})

export const POST = withAdmin(async (req: NextRequest) => {
  return controller.create(req)
})