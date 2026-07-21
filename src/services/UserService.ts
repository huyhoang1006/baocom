import { prisma } from '@/lib/prisma'
import { UserRepository } from '@/repositories/UserRepository'
import { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from '@/dto/UserDTO'
import { hashPassword, verifyPassword, signToken } from '@/lib/auth'
import { generateUsername, generateUniqueUsername } from '@/lib/utils'
import { parseLocalDate } from '@/lib/registrationWindow'

// Mật khẩu mặc định cố định cho tài khoản tạo mới.
// Yêu cầu nghiệp vụ: người dùng không tự đổi mật khẩu, hệ thống chỉ dùng nội bộ
// công ty nên đặt mật khẩu dễ nhớ, cố định. Admin có thể đổi sau ở màn hình sửa.
const DEFAULT_NEW_USER_PASSWORD = '123456'

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

    // Mật khẩu: dùng giá trị admin nhập (nếu có), mặc định là 123456
    const password = data.password || DEFAULT_NEW_USER_PASSWORD
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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne(userId)
    if (!user) throw new Error('User not found')

    const isValid = await verifyPassword(currentPassword, user.password)
    if (!isValid) throw new Error('Current password is incorrect')

    const hashedPassword = await hashPassword(newPassword)

    // Increment tokenVersion to invalidate other sessions
    const updatedUser = await this.userRepository.update(userId, {
      password: hashedPassword,
      tokenVersion: { increment: 1 }
    })

    const token = await signToken(updatedUser.id, updatedUser.role, updatedUser.tokenVersion)
    return { token }
  }
}