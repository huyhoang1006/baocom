import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { UsersController } from '@/controllers/UsersController'
import { AuditLogService } from '@/services/AuditLogService'
import { UserService } from '@/services/UserService'

const controller = new UsersController()
const auditService = new AuditLogService()
const userService = new UserService()

export const GET = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  return controller.getOne(id)
})

export const PATCH = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  let body: Record<string, unknown> | null = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const result = await controller.update(id, body)

  // Audit role changes
  if (body?.role) {
    await auditService.log({
      action: 'USER_ROLE_CHANGED',
      entityType: 'user',
      entityId: id,
      performedBy: userId,
      details: `Role changed to ${body.role}`
    })
  }

  return result
})

export const DELETE = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  // Get user info before deletion for audit log
  const targetUser = await userService.findOne(id)
  const result = await controller.delete(id)

  await auditService.log({
    action: 'USER_DELETED',
    entityType: 'user',
    entityId: id,
    performedBy: userId,
    details: `User deleted: ${targetUser?.name || id}`
  })

  return result
})