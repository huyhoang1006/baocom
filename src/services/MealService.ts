import { prisma } from '@/lib/prisma'
import { MealRepository } from '@/repositories/MealRepository'
import { CreateMealDTO, UpdateMealDTO, MealType } from '@/dto/MealDTO'

export class MealService {
  private mealRepository: MealRepository

  constructor() {
    this.mealRepository = new MealRepository(prisma)
  }

  async findAll(type?: MealType) {
    const where: Record<string, unknown> = { isActive: true }
    if (type) where.type = type
    return this.mealRepository.findAll(where)
  }

  async findOne(id: string) {
    return this.mealRepository.findOne(id)
  }

  async create(data: CreateMealDTO) {
    if (!['main', 'vegetable', 'dessert'].includes(data.type)) {
      throw new Error('Invalid meal type')
    }
    return this.mealRepository.create(data)
  }

  async update(id: string, data: UpdateMealDTO) {
    if (data.type && !['main', 'vegetable', 'dessert'].includes(data.type)) {
      throw new Error('Invalid meal type')
    }
    return this.mealRepository.update(id, data)
  }

  async delete(id: string) {
    return this.mealRepository.delete(id)
  }

  async validateMealIds(mealIds: string[]) {
    if (!mealIds || !Array.isArray(mealIds)) {
      throw new Error('Invalid mealIds')
    }
    const meals = await this.mealRepository.findAll({ id: { in: mealIds }, isActive: true })
    if (meals.length !== mealIds.length) {
      throw new Error('One or more mealIds are invalid or inactive')
    }
    return true
  }
}