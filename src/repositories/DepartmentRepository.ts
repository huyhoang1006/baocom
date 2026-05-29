import { PrismaClient } from '@prisma/client'
import { BaseRepository } from './BaseRepository'
import { Department, Prisma } from '@prisma/client'

export class DepartmentRepository extends BaseRepository<
  Department,
  Prisma.DepartmentCreateInput,
  Prisma.DepartmentUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findAll(where?: Prisma.DepartmentWhereInput): Promise<Department[]> {
    return this.prisma.department.findMany({ where })
  }

  async findOne(id: string): Promise<Department | null> {
    return this.prisma.department.findUnique({ where: { id } })
  }

  async findByName(name: string): Promise<Department | null> {
    return this.prisma.department.findUnique({ where: { name } })
  }

  async create(data: Prisma.DepartmentCreateInput): Promise<Department> {
    return this.prisma.department.create({ data })
  }

  async update(id: string, data: Prisma.DepartmentUpdateInput): Promise<Department> {
    return this.prisma.department.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.department.delete({ where: { id } })
  }

  async count(where?: Prisma.DepartmentWhereInput): Promise<number> {
    return this.prisma.department.count({ where })
  }

  async hasEmployees(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { departmentId: id } })
    return count > 0
  }
}
