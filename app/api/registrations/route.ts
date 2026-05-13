import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { RegistrationsController } from '@/controllers/RegistrationsController'

const controller = new RegistrationsController()

export const GET = withAuth(async (req: NextRequest, userId: string) => {
  return controller.getAll(req, userId)
})

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  return controller.create(req, userId)
})