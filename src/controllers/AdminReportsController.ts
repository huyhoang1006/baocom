import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { RegistrationService } from '@/services/RegistrationService'
import { toDateKey } from '@/lib/registrationWindow'

export class AdminReportsController {
  private registrationService: RegistrationService

  constructor() {
    this.registrationService = new RegistrationService()
  }

  async getReport(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeSundays = searchParams.get('includeSundays') === 'true'

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const registrations = await this.registrationService.findByDateRange(startDate!, endDate!)

    // Filter out Sundays from results (no lunch service on Sundays)
    const filtered = registrations.filter(r => {
      const day = new Date(r.date).getDay()
      return day !== 0 || includeSundays
    })

    // Group by date for stats
    const dateGroups: Record<string, number> = {}
    filtered.forEach(r => {
      const dateKey = toDateKey(new Date(r.date))
      dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1
    })

    const reportData = filtered.map((r, idx) => ({
      stt: idx + 1,
      name: r.user?.name,
      phone: r.user?.username,
      date: new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    }))

    return NextResponse.json({
      reportData,
      stats: {
        total: reportData.length,
        byDate: dateGroups
      }
    })
  }
}