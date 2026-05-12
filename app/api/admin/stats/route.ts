import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAdmin(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const registrations = await prisma.registration.findMany({
    where: { date: { gte: today, lt: tomorrow } }
  })

  const totalEmployees = await prisma.user.count({
    where: { role: 'employee', isActive: true }
  })

  const eating = registrations.filter(r => r.status === 'eating').length
  const notEating = registrations.filter(r => r.status === 'not_eating').length
  const registered = registrations.length
  const notRegistered = totalEmployees - registered

  return NextResponse.json({
    stats: {
      totalEmployees,
      eating,
      notEating,
      registered,
      notRegistered,
      registrationRate: totalEmployees > 0 ? Math.round((registered / totalEmployees) * 100) : 0
    }
  })
})
