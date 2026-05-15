import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { MealsController } from '@/controllers/MealsController'

const controller = new MealsController()

export const POST = withAdmin(async (req: NextRequest) => {
  return controller.findOrCreate(req)
})