import { prisma } from '@/lib/prisma'
import { getCutoffConfig, upsertCutoffConfig } from '@/lib/cutoffConfig'

export class SettingsService {
  async getCutoffConfig() {
    return getCutoffConfig()
  }

  async updateCutoffConfig(hour: number, minute: number, userId: string) {
    if (hour < 0 || hour > 23) throw new Error('Invalid hour (0-23)')
    if (minute < 0 || minute > 59) throw new Error('Invalid minute (0-59)')
    await upsertCutoffConfig(hour, minute, userId)
    return { hour, minute }
  }
}