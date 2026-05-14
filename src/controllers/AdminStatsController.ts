import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { UserService } from '@/services/UserService'
import { RegistrationService } from '@/services/RegistrationService'

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

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const totalEmployees = await this.userService.count()
    const { eating, notEating, total: registered } = await this.registrationService.countByStatus(today)
    const notRegistered = totalEmployees - registered

    return NextResponse.json({
      stats: {
        totalEmployees,
        eatingToday: eating,
        notEatingToday: notEating,
        registered,
        notRegistered,
        registrationRate: totalEmployees > 0 ? Math.round((registered / totalEmployees) * 100) : 0
      }
    })
  }
}