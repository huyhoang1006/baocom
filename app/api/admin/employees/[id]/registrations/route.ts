import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { UserService } from '@/services/UserService'
import { RegistrationService } from '@/services/RegistrationService'

const userService = new UserService()
const registrationService = new RegistrationService()

export const GET = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const { searchParams } = req.nextUrl
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  // Verify user exists
  const user = await userService.findOne(id)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { registrations, stats } = await registrationService.findAllByUser(id, startDate, endDate)

  const workEndDate = (user as { workEndDate?: Date | null }).workEndDate
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      workEndDate: workEndDate ? workEndDate.toISOString().split('T')[0] : null,
    },
    registrations: registrations.map(r => ({
      id: r.id,
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
      overrides: r.overrides.map(o => ({
        originalStatus: o.originalStatus,
        newStatus: o.newStatus,
        note: o.note,
        performedAt: o.performedAt.toISOString(),
        performedBy: user.name  // Admin who made the change
      }))
    })),
    stats
  })
})

// Admin đặt/sửa trạng thái báo cơm cho nhân viên (mọi ngày, kể cả đã khóa)
export const POST = withAdmin(async (req: NextRequest, adminId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  let body: { date?: string; status?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!body.date || !body.status) {
    return NextResponse.json({ error: 'Missing date or status' }, { status: 400 })
  }

  const user = await userService.findOne(id)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    const registration = await registrationService.adminSetStatus(id, body.date, body.status, adminId, body.note)
    return NextResponse.json({ registration: { id: registration.id, status: registration.status } }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Invalid status' || error.message.startsWith('Invalid date'))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }
})