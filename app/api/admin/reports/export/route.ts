import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { AdminReportsController } from '@/controllers/AdminReportsController'
import { AuditLogService } from '@/services/AuditLogService'

const controller = new AdminReportsController()
const auditService = new AuditLogService()

export const GET = withAdmin(async (req: NextRequest, userId: string) => {
  const { searchParams } = req.nextUrl
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  const result = await controller.exportXlsx(req)

  await auditService.log({
    action: 'REPORT_EXPORTED',
    entityType: 'report',
    performedBy: userId,
    details: `XLSX export for period ${startDate} to ${endDate}`
  })

  return result
})
