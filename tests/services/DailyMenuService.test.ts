import { describe, it, expect, beforeEach } from 'vitest'
import { DailyMenuService } from '@/services/DailyMenuService'

describe('DailyMenuService', () => {
  let dailyMenuService: DailyMenuService

  beforeEach(() => {
    dailyMenuService = new DailyMenuService()
  })

  it('should find all daily menus', async () => {
    const menus = await dailyMenuService.findAll()
    expect(Array.isArray(menus)).toBe(true)
  })

  it('should find daily menu by date', async () => {
    const today = new Date().toISOString().split('T')[0]
    const menu = await dailyMenuService.findByDate(today)
    // May be null if no menu exists for today
    expect(menu === null || menu.id).toBeTruthy()
  })

  it('should throw error for invalid mealIds', async () => {
    await expect(
      dailyMenuService.create({
        date: new Date().toISOString(),
        mealIds: ['invalid-id']
      })
    ).rejects.toThrow()
  })
})