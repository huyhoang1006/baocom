import { PrismaClient, Holiday } from '@prisma/client'
import { BaseRepository } from './BaseRepository'
import { Prisma } from '@prisma/client'

export class HolidayRepository extends BaseRepository<
  Holiday,
  Prisma.HolidayCreateInput,
  Prisma.HolidayUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findAll(): Promise<Holiday[]> {
    return this.prisma.holiday.findMany({
      where: { isActive: true },
      orderBy: { date: 'asc' }
    })
  }

  async findOne(id: string): Promise<Holiday | null> {
    return this.prisma.holiday.findUnique({ where: { id } })
  }

  async create(data: Prisma.HolidayCreateInput): Promise<Holiday> {
    return this.prisma.holiday.create({ data })
  }

  async update(id: string, data: Prisma.HolidayUpdateInput): Promise<Holiday> {
    return this.prisma.holiday.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.holiday.update({
      where: { id },
      data: { isActive: false }
    })
  }
}