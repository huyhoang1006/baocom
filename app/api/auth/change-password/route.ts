import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { UsersController } from '@/controllers/UsersController'

const controller = new UsersController()

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  return controller.changePassword(req, userId)
})