import { PrismaClient, Meal } from '@prisma/client'
import { BaseRepository } from './BaseRepository'
import { Prisma } from '@prisma/client'

export class MealRepository extends BaseRepository<
  Meal,
  Prisma.MealCreateInput,
  Prisma.MealUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findAll(where?: Prisma.MealWhereInput): Promise<Meal[]> {
    return this.prisma.meal.findMany({ where, orderBy: { name: 'asc' } })
  }

  async findOne(id: string): Promise<Meal | null> {
    return this.prisma.meal.findUnique({ where: { id } })
  }

  async create(data: Prisma.MealCreateInput): Promise<Meal> {
    return this.prisma.meal.create({ data })
  }

  async update(id: string, data: Prisma.MealUpdateInput): Promise<Meal> {
    return this.prisma.meal.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.meal.update({
      where: { id },
      data: { isActive: false }
    })
  }
}