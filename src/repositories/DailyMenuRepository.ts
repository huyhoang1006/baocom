import { PrismaClient, DailyMenu, DailyMenuMeal } from '@prisma/client'
import { BaseRepository } from './BaseRepository'
import { Prisma } from '@prisma/client'

export class DailyMenuRepository extends BaseRepository<
  DailyMenu,
  Prisma.DailyMenuCreateInput,
  Prisma.DailyMenuUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findAll(where?: Prisma.DailyMenuWhereInput): Promise<DailyMenu[]> {
    return this.prisma.dailyMenu.findMany({
      where,
      include: {
        meals: {
          include: { meal: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { date: 'asc' }
    })
  }

  async findAllWithLimit(take?: number): Promise<DailyMenu[]> {
    return this.prisma.dailyMenu.findMany({
      include: {
        meals: {
          include: { meal: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { date: 'asc' },
      take
    })
  }

  async findOne(id: string): Promise<DailyMenu | null> {
    return this.prisma.dailyMenu.findUnique({
      where: { id },
      include: {
        meals: {
          include: { meal: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })
  }

  async findByDate(date: Date): Promise<DailyMenu | null> {
    return this.prisma.dailyMenu.findUnique({
      where: { date },
      include: {
        meals: {
          include: { meal: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })
  }

  async upsertWithMeals(date: Date, mealIds: string[]): Promise<DailyMenu> {
    return this.prisma.$transaction(async (tx) => {
      const dailyMenu = await tx.dailyMenu.upsert({
        where: { date },
        update: {},
        create: { date }
      })

      await tx.dailyMenuMeal.deleteMany({ where: { dailyMenuId: dailyMenu.id } })

      for (let i = 0; i < mealIds.length; i++) {
        await tx.dailyMenuMeal.create({
          data: { dailyMenuId: dailyMenu.id, mealId: mealIds[i], sortOrder: i }
        })
      }

      return tx.dailyMenu.findUnique({
        where: { id: dailyMenu.id },
        include: {
          meals: {
            include: { meal: true },
            orderBy: { sortOrder: 'asc' }
          }
        }
      })
    }) as Promise<DailyMenu>
  }

  async create(data: Prisma.DailyMenuCreateInput): Promise<DailyMenu> {
    return this.prisma.dailyMenu.create({ data })
  }

  async update(id: string, data: Prisma.DailyMenuUpdateInput): Promise<DailyMenu> {
    return this.prisma.dailyMenu.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.dailyMenu.delete({ where: { id } })
  }
}