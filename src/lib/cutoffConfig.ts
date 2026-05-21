import { prisma } from '@/lib/prisma'

interface CutoffConfigData {
  cutoffHour: number
  cutoffMinute: number
}

let cachedConfig: CutoffConfigData | null = null
let cacheExpiry = 0
const CACHE_TTL_MS = 30_000 // 30 seconds

export async function getCutoffConfig(): Promise<CutoffConfigData> {
  const now = Date.now()
  if (cachedConfig && now < cacheExpiry) {
    return cachedConfig
  }

  const config = await prisma.cutoffConfig.findUnique({
    where: { id: 'global' }
  })

  cachedConfig = {
    cutoffHour: config?.cutoffHour ?? 23,
    cutoffMinute: config?.cutoffMinute ?? 0,
  }
  cacheExpiry = now + CACHE_TTL_MS
  return cachedConfig
}

export function invalidateCutoffCache() {
  cachedConfig = null
  cacheExpiry = 0
}

export async function upsertCutoffConfig(
  hour: number,
  minute: number,
  userId: string
): Promise<void> {
  try {
    await prisma.cutoffConfig.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        cutoffHour: hour,
        cutoffMinute: minute,
        updatedBy: userId,
      },
      update: {
        cutoffHour: hour,
        cutoffMinute: minute,
        updatedBy: userId,
      },
    })
  } finally {
    invalidateCutoffCache()
  }
}