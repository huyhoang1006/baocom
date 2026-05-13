import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { HolidaysController } from '@/controllers/HolidaysController'

const controller = new HolidaysController()

export const PATCH = withAdmin(async (req: NextRequest, userId: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  return controller.update(id, req)
})

export const DELETE = withAdmin(async (req: NextRequest, userId: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  return controller.delete(id)
})