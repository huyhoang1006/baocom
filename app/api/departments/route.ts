import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { DepartmentController } from '@/controllers/DepartmentController'

const controller = new DepartmentController()

export const GET = withAdmin(async (req: NextRequest, userId: string, role: string) => {
  return controller.getAll()
})

export const POST = withAdmin(async (req: NextRequest, userId: string, role: string) => {
  return controller.create(req)
})
