import { prisma } from '@/lib/prisma'
import { UserRepository } from '@/repositories/UserRepository'
import { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from '@/dto/UserDTO'
import { hashPassword } from '@/lib/auth'
import { generateUsername, generatePassword, generateUniqueUsername } from '@/lib/utils'

export interface CreateUserResult {
  user: UserResponseDTO
  credentials: {
    username: string
    password: string
  }
}

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

  async create(data: CreateUserDTO): Promise<CreateUserResult> {
    // Generate username if not provided
    let username = data.username
    if (!username) {
      const baseUsername = generateUsername(data.name)
      const existingUsernames = await this.userRepository.findByUsernamePattern(baseUsername)
      username = generateUniqueUsername(baseUsername, existingUsernames)
    } else {
      // Check duplicate if provided
      const existing = await this.userRepository.findByUsername(username)
      if (existing) {
        throw new Error('Username already exists')
      }
    }

    // Generate password if not provided
    const password = data.password || generatePassword()
    const hashedPassword = await hashPassword(password)

    const user = await this.userRepository.create({
      username,
      password: hashedPassword,
      name: data.name,
      role: data.role || 'employee',
      phone: data.phone,
      email: data.email,
      department: data.department
    })

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        phone: user.phone ?? undefined,
        email: user.email ?? undefined,
        department: user.department ?? undefined
      },
      credentials: {
        username: user.username,
        password // Plain text - only returned on creation
      }
    }
  }

  async update(id: string, data: UpdateUserDTO) {
    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name
    if (data.role) updateData.role = data.role
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
    if (data.password) updateData.password = await hashPassword(data.password)
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.email !== undefined) updateData.email = data.email
    if (data.department !== undefined) updateData.department = data.department

    return this.userRepository.update(id, updateData)
  }

  async delete(id: string) {
    return this.userRepository.delete(id)
  }

  async count() {
    return this.userRepository.count({ role: 'employee', isActive: true })
  }
}