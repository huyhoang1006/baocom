import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAdmin } from '@/lib/authMiddleware'
import { MealsController } from '@/controllers/MealsController'

const controller = new MealsController()

export const GET = withAuth(async (req: NextRequest) => {
  return controller.getAll(req)
})

export const POST = withAdmin(async (req: NextRequest) => {
  return controller.create(req)
})