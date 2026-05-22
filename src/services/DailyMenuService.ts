import { prisma } from '@/lib/prisma'
import { DailyMenuRepository } from '@/repositories/DailyMenuRepository'
import { CreateDailyMenuDTO } from '@/dto/DailyMenuDTO'
import { MealService } from './MealService'

export class DailyMenuService {
  private dailyMenuRepository: DailyMenuRepository
  private mealService: MealService

  constructor() {
    this.dailyMenuRepository = new DailyMenuRepository(prisma)
    this.mealService = new MealService()
  }

  async findAll(take?: number) {
    return this.dailyMenuRepository.findAllWithLimit(take)
  }

  async findByDate(date: string) {
    return this.dailyMenuRepository.findByDate(new Date(date))
  }

  async create(data: CreateDailyMenuDTO) {
    await this.mealService.validateMealIds(data.mealIds)
    return this.dailyMenuRepository.upsertWithMeals(new Date(data.date), data.mealIds)
  }

  async delete(id: string) {
    return this.dailyMenuRepository.delete(id)
  }

  async deleteMealFromDate(date: string, mealId: string) {
    return this.dailyMenuRepository.deleteMealFromDate(new Date(date), mealId)
  }
}