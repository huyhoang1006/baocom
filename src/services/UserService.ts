import { prisma } from '@/lib/prisma'
import { UserRepository } from '@/repositories/UserRepository'
import { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from '@/dto/UserDTO'
import { hashPassword } from '@/lib/auth'
import { generateUsername, generatePassword, generateUniqueUsername } from '@/lib/utils'
import { parseLocalDate } from '@/lib/registrationWindow'

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
      ...(data.departmentId ? { department: { connect: { id: data.departmentId } } } : {})
    })

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      credentials: {
        username: user.username,
        password // Plain text - only returned on creation
      }
    }
  }

  async update(id: string, data: UpdateUserDTO) {
    // Validate role if provided
    if (data.role && !['admin', 'employee'].includes(data.role)) {
      throw new Error('Invalid role: must be "admin" or "employee"')
    }

    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name
    if (data.role) updateData.role = data.role
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
    if (data.password) updateData.password = await hashPassword(data.password)
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId
    if (data.workEndDate !== undefined) {
      // parseLocalDate: coi 'YYYY-MM-DD' là nửa đêm giờ VN; null để bỏ đánh dấu
      updateData.workEndDate = data.workEndDate ? parseLocalDate(data.workEndDate) : null
    }

    return this.userRepository.update(id, updateData)
  }

  async delete(id: string) {
    return this.userRepository.delete(id)
  }

  async count() {
    return this.userRepository.count({ role: 'employee', isActive: true })
  }
}