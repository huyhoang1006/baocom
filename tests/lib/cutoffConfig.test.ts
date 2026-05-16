import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCutoffConfig, upsertCutoffConfig, invalidateCutoffCache } from '@/lib/cutoffConfig'

// Mock prisma
const mockPrisma = {
  cutoffConfig: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
}
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

describe('cutoffConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invalidateCutoffCache()
  })

  afterEach(() => {
    invalidateCutoffCache()
  })

  describe('getCutoffConfig', () => {
    it('returns cached config within TTL', async () => {
      mockPrisma.cutoffConfig.findUnique.mockResolvedValue({
        id: 'global',
        cutoffHour: 22,
        cutoffMinute: 30,
      })

      const first = await getCutoffConfig()
      const second = await getCutoffConfig()

      expect(first.cutoffHour).toBe(22)
      expect(second.cutoffHour).toBe(22)
      // Should only query once due to cache
      expect(mockPrisma.cutoffConfig.findUnique).toHaveBeenCalledTimes(1)
    })

    it('returns default values (hour: 23, minute: 0) when no config exists', async () => {
      mockPrisma.cutoffConfig.findUnique.mockResolvedValue(null)

      const config = await getCutoffConfig()

      expect(config.cutoffHour).toBe(23)
      expect(config.cutoffMinute).toBe(0)
    })

    it('returns configured values from DB', async () => {
      mockPrisma.cutoffConfig.findUnique.mockResolvedValue({
        id: 'global',
        cutoffHour: 20,
        cutoffMinute: 45,
      })

      const config = await getCutoffConfig()

      expect(config.cutoffHour).toBe(20)
      expect(config.cutoffMinute).toBe(45)
    })

    it('invalidates cache after upsert', async () => {
      // First call - cached
      mockPrisma.cutoffConfig.findUnique.mockResolvedValue({
        id: 'global',
        cutoffHour: 10,
        cutoffMinute: 0,
      })
      await getCutoffConfig()

      // Upsert invalidates cache
      mockPrisma.cutoffConfig.upsert.mockResolvedValue(undefined)
      mockPrisma.cutoffConfig.findUnique.mockResolvedValue({
        id: 'global',
        cutoffHour: 21,
        cutoffMinute: 30,
      })
      await upsertCutoffConfig(21, 30, 'admin-id')

      // Next call should hit DB again
      const config = await getCutoffConfig()
      expect(config.cutoffHour).toBe(21)
      expect(config.cutoffMinute).toBe(30)
      expect(mockPrisma.cutoffConfig.findUnique).toHaveBeenCalledTimes(2)
    })
  })

  describe('upsertCutoffConfig', () => {
    it('calls upsert with correct parameters', async () => {
      mockPrisma.cutoffConfig.upsert.mockResolvedValue(undefined)

      await upsertCutoffConfig(22, 30, 'admin-user-123')

      expect(mockPrisma.cutoffConfig.upsert).toHaveBeenCalledWith({
        where: { id: 'global' },
        create: {
          id: 'global',
          cutoffHour: 22,
          cutoffMinute: 30,
          updatedBy: 'admin-user-123',
        },
        update: {
          cutoffHour: 22,
          cutoffMinute: 30,
          updatedBy: 'admin-user-123',
        },
      })
    })

    it('calls invalidateCutoffCache after upsert', async () => {
      mockPrisma.cutoffConfig.upsert.mockResolvedValue(undefined)

      await upsertCutoffConfig(23, 0, 'admin-id')

      // After upsert, cache should be cleared
      const config = await getCutoffConfig()
      expect(config.cutoffHour).toBe(23) // from DB
    })
  })
})