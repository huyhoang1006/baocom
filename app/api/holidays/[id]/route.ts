import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAdmin } from '@/lib/authMiddleware'
import { HolidaysController } from '@/controllers/HolidaysController'

const controller = new HolidaysController()

export const GET = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  return controller.getOne(params.id)
})

export const PATCH = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  return controller.update(params.id, req)
})

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  return controller.delete(params.id)
})