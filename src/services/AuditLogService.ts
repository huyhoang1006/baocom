import { prisma } from '@/lib/prisma'

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'USER_DEACTIVATED'
  | 'CUTOFF_UPDATED'
  | 'REGISTRATION_OVERRIDE'
  | 'REPORT_EXPORTED'

export type AuditEntityType = 'user' | 'cutoff' | 'registration' | 'report'

interface AuditLogEntry {
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string
  performedBy: string
  details?: string
}

export class AuditLogService {
  async log(entry: AuditLogEntry): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        performedBy: entry.performedBy,
        details: entry.details
      }
    })
  }

  async getLogs(filters?: {
    performedBy?: string
    entityType?: AuditEntityType
    entityId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }) {
    const where: Record<string, unknown> = {}

    if (filters?.performedBy) where.performedBy = filters.performedBy
    if (filters?.entityType) where.entityType = filters.entityType
    if (filters?.entityId) where.entityId = filters.entityId
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters?.startDate) (where.createdAt as Record<string, Date>).gte = filters.startDate
      if (filters?.endDate) (where.createdAt as Record<string, Date>).lte = filters.endDate
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 100
    })
  }
}