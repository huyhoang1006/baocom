import { prisma } from '@/lib/prisma'
import { UserRepository } from '@/repositories/UserRepository'
import { CreateUserDTO, UpdateUserDTO } from '@/dto/UserDTO'
import { hashPassword } from '@/lib/auth'

export class UserService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository(prisma)
  }

  async findAll() {
    return this.userRepository.findAll({ isActive: true })
  }

  async findOne(id: string) {
    return this.userRepository.findOne(id)
  }

  async create(data: CreateUserDTO) {
    const existing = await this.userRepository.findByUsername(data.username)
    if (existing) {
      throw new Error('Username already exists')
    }

    const hashedPassword = await hashPassword(data.password)
    return this.userRepository.create({
      username: data.username,
      password: hashedPassword,
      name: data.name,
      role: data.role || 'employee'
    })
  }

  async update(id: string, data: UpdateUserDTO) {
    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name
    if (data.role) updateData.role = data.role
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
    if (data.password) updateData.password = await hashPassword(data.password)

    return this.userRepository.update(id, updateData)
  }

  async delete(id: string) {
    return this.userRepository.delete(id)
  }

  async count() {
    return this.userRepository.count({ role: 'employee', isActive: true })
  }
}