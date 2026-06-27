import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { DepartmentController } from '@/controllers/DepartmentController'

const controller = new DepartmentController()

export const GET = withAdmin(async (_req: NextRequest, _userId: string, _role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  return controller.getOne(id)
})

export const PATCH = withAdmin(async (req: NextRequest, _userId: string, _role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  return controller.update(id, body)
})

export const DELETE = withAdmin(async (_req: NextRequest, _userId: string, _role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  return controller.delete(id)
})
