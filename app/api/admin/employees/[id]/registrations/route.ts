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

  return NextResponse.json({
    user: { id: user.id, name: user.name, username: user.username },
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