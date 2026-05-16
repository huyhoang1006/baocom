import { NextRequest, NextResponse } from 'next/server'
import { SettingsService } from '@/services/SettingsService'

export class AdminSettingsController {
  private settingsService: SettingsService

  constructor() {
    this.settingsService = new SettingsService()
  }

  async getCutoff(req: NextRequest) {
    const config = await this.settingsService.getCutoffConfig()
    return NextResponse.json({ cutoffHour: config.cutoffHour, cutoffMinute: config.cutoffMinute })
  }

  async updateCutoff(req: NextRequest, userId: string) {
    let body: { cutoffHour: number; cutoffMinute: number }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body.cutoffHour !== 'number' || typeof body.cutoffMinute !== 'number') {
      return NextResponse.json({ error: 'Missing cutoffHour or cutoffMinute' }, { status: 400 })
    }

    try {
      const result = await this.settingsService.updateCutoffConfig(body.cutoffHour, body.cutoffMinute, userId)
      return NextResponse.json({ success: true, ...result })
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }
  }
}
