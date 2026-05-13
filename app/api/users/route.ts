import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAdmin } from '@/lib/authMiddleware'
import { UsersController } from '@/controllers/UsersController'

const controller = new UsersController()

export const GET = withAdmin(async (req: NextRequest) => {
  return controller.getAll()
})

export const POST = withAdmin(async (req: NextRequest) => {
  return controller.create(req)
})