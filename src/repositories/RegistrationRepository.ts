import { PrismaClient, Registration } from '@prisma/client'
import { BaseRepository } from './BaseRepository'
import { Prisma } from '@prisma/client'

export class RegistrationRepository extends BaseRepository<
  Registration,
  Prisma.RegistrationCreateInput,
  Prisma.RegistrationUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findAll(where?: Prisma.RegistrationWhereInput): Promise<Registration[]> {
    return this.prisma.registration.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
            isActive: true,
            departmentId: true,
            department: {
              select: { id: true, name: true }
            }
            // Excluded: password, tokenVersion, createdAt, updatedAt
          }
        }
      }
    })
  }

  async findOne(id: string): Promise<Registration | null> {
    return this.prisma.registration.findUnique({ where: { id } })
  }

  async findByUserAndDate(userId: string, date: Date): Promise<Registration | null> {
    return this.prisma.registration.findUnique({
      where: { userId_date: { userId, date } }
    })
  }

  async upsert(userId: string, date: Date, status: string): Promise<Registration> {
    return this.prisma.registration.upsert({
      where: { userId_date: { userId, date } },
      update: { status },
      create: { userId, date, status }
    })
  }

  async create(data: Prisma.RegistrationCreateInput): Promise<Registration> {
    return this.prisma.registration.create({ data })
  }

  async update(id: string, data: Prisma.RegistrationUpdateInput): Promise<Registration> {
    return this.prisma.registration.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.registration.delete({ where: { id } })
  }

  async count(where?: Prisma.RegistrationWhereInput): Promise<number> {
    return this.prisma.registration.count({ where })
  }

  async createOverride(data: {
    registrationId: string
    performedBy: string
    newStatus: string
    note?: string
    originalStatus?: string
  }) {
    return this.prisma.registrationOverride.create({
      data: {
        registrationId: data.registrationId,
        performedBy: data.performedBy,
        newStatus: data.newStatus,
        note: data.note,
        originalStatus: data.originalStatus,
      }
    })
  }

  async findAllByUserWithOverrides(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<Registration & { overrides: Array<{ originalStatus: string | null; newStatus: string; note: string | null; performedAt: Date; performedBy: string }> }>> {
    const where: Prisma.RegistrationWhereInput = { userId }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    return this.prisma.registration.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        overrides: true
      }
    })
  }
}