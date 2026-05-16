import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { UserService } from '@/services/UserService'
import { RegistrationService } from '@/services/RegistrationService'
import { toDateKey } from '@/lib/registrationWindow'

export class AdminStatsController {
  private userService: UserService
  private registrationService: RegistrationService

  constructor() {
    this.userService = new UserService()
    this.registrationService = new RegistrationService()
  }

  async getTodayStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return this.getStatsForDate(today)
  }

  async getStatsForDate(date: Date) {
    const dateKey = toDateKey(date)
    const totalEmployees = await this.userService.count()
    const { eating, notEating, total: registered } = await this.registrationService.countByStatus(date)
    const notRegistered = totalEmployees - registered
    const absences = await this.registrationService.getAbsencesByDate(date)

    return NextResponse.json({
      stats: {
        totalEmployees,
        eating,
        notEating,
        registered,
        notRegistered,
        registrationRate: totalEmployees > 0 ? Math.round((registered / totalEmployees) * 100) : 0
      },
      dateKey,
      absences: absences.map(a => ({
        name: a.user?.name,
        username: a.user?.username,
      })),
    })
  }
}