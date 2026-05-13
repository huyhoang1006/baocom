import { describe, it, expect, beforeEach } from 'vitest'
import { MealService } from '@/services/MealService'

describe('MealService', () => {
  let mealService: MealService

  beforeEach(() => {
    mealService = new MealService()
  })

  it('should find all active meals', async () => {
    const meals = await mealService.findAll()
    expect(Array.isArray(meals)).toBe(true)
  })

  it('should find meals by type', async () => {
    const meals = await mealService.findAll('main')
    expect(Array.isArray(meals)).toBe(true)
    meals.forEach(meal => {
      expect(meal.type).toBe('main')
    })
  })

  it('should throw error for invalid meal type', async () => {
    await expect(
      mealService.create({ name: 'Test', type: 'invalid' as any })
    ).rejects.toThrow('Invalid meal type')
  })

  it('should validate mealIds correctly', async () => {
    const meals = await mealService.findAll()
    const validIds = meals.slice(0, 3).map(m => m.id)
    await expect(mealService.validateMealIds(validIds)).resolves.toBe(true)
  })

  it('should throw error for invalid mealIds', async () => {
    await expect(
      mealService.validateMealIds(['invalid-id-1', 'invalid-id-2'])
    ).rejects.toThrow('One or more mealIds are invalid or inactive')
  })
})