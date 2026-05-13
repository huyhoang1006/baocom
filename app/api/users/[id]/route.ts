import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { UsersController } from '@/controllers/UsersController'

const controller = new UsersController()

export const GET = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  return controller.getOne(id)
})

export const PATCH = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  return controller.update(id, req)
})

export const DELETE = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  return controller.delete(id)
})