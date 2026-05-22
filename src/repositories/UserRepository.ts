import { PrismaClient } from '@prisma/client'
import { BaseRepository } from './BaseRepository'
import { User, Prisma } from '@prisma/client'

export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findAll(where?: Prisma.UserWhereInput): Promise<User[]> {
    return this.prisma.user.findMany({ where })
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } })
  }

  async findByUsernamePattern(pattern: string): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        username: {
          startsWith: pattern
        }
      },
      select: { username: true }
    })
    return users.map(u => u.username)
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data })
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false }
    })
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where })
  }
}