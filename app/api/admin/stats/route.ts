import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { withAuth } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const totalEmployees = await prisma.user.count({
    where: { role: 'employee', isActive: true }
  })

  const [eating, notEating, registered] = await Promise.all([
    prisma.registration.count({ where: { date: { gte: today, lt: tomorrow }, status: 'eating' } }),
    prisma.registration.count({ where: { date: { gte: today, lt: tomorrow }, status: 'not_eating' } }),
    prisma.registration.count({ where: { date: { gte: today, lt: tomorrow } } })
  ])

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
