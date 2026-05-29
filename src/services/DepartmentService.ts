import { prisma } from '@/lib/prisma'
import { DepartmentRepository } from '@/repositories/DepartmentRepository'
import { CreateDepartmentDTO, UpdateDepartmentDTO, DepartmentResponseDTO } from '@/dto/DepartmentDTO'

export class DepartmentService {
  private departmentRepository: DepartmentRepository

  constructor() {
    this.departmentRepository = new DepartmentRepository(prisma)
  }

  async findAll() {
    return this.departmentRepository.findAll({ isActive: true })
  }

  async findOne(id: string) {
    return this.departmentRepository.findOne(id)
  }

  async create(data: CreateDepartmentDTO) {
    // Check duplicate name
    const existing = await this.departmentRepository.findByName(data.name)
    if (existing) {
      throw new Error('Department name already exists')
    }

    const department = await this.departmentRepository.create({
      name: data.name,
      description: data.description,
    })

    return {
      id: department.id,
      name: department.name,
      description: department.description,
      isActive: department.isActive,
      createdAt: department.createdAt
    }
  }

  async update(id: string, data: UpdateDepartmentDTO) {
    // Check duplicate name if name is being changed
    if (data.name) {
      const existing = await this.departmentRepository.findByName(data.name)
      if (existing && existing.id !== id) {
        throw new Error('Department name already exists')
      }
    }

    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive

    return this.departmentRepository.update(id, updateData)
  }

  async delete(id: string) {
    // Check if department has employees
    const hasEmployees = await this.departmentRepository.hasEmployees(id)
    if (hasEmployees) {
      throw new Error('Cannot delete department with employees')
    }

    return this.departmentRepository.delete(id)
  }
}
