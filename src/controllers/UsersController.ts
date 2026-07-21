import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/UserService'
import { CreateUserDTO, UpdateUserDTO, ChangePasswordDTO } from '@/dto/UserDTO'

export class UsersController {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  async getAll() {
    const users = await this.userService.findAll()
    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        departmentId: u.departmentId
      }))
    })
  }

  async getOne(id: string) {
    const user = await this.userService.findOne(id)
    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        departmentId: user.departmentId
      }
    })
  }

  async create(req: NextRequest) {
    let body: CreateUserDTO
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
    }

    try {
      const result = await this.userService.create(body)
      return NextResponse.json({
        user: {
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          role: result.user.role,
          departmentId: result.user.departmentId
        },
        // Mật khẩu sinh ngẫu nhiên chỉ trả về DUY NHẤT lúc tạo (qua HTTPS, chỉ admin)
        // để admin bàn giao cho nhân viên. Không có endpoint nào trả lại sau đó.
        credentials: {
          username: result.credentials.username,
          password: result.credentials.password
        }
      }, { status: 201 })
    } catch (error) {
      if (error instanceof Error && error.message === 'Username already exists') {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
      }
      throw error
    }
  }

  async update(id: string, body: UpdateUserDTO) {
    try {
      const user = await this.userService.update(id, body)
      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId
        }
      })
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  async changePassword(req: NextRequest, userId: string) {
    let body: ChangePasswordDTO
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json({ error: 'Missing currentPassword or newPassword' }, { status: 400 })
    }

    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, { status: 400 })
    }

    try {
      const result = await this.userService.changePassword(userId, body.currentPassword, body.newPassword)
      const response = NextResponse.json({ success: true })
      response.cookies.set('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && req.headers.get('x-forwarded-proto') === 'https',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      })
      return response
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Current password is incorrect') {
          return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 400 })
        }
        if (error.message === 'User not found') {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
      }
      throw error
    }
  }

  async delete(id: string) {
    await this.userService.delete(id)
    return NextResponse.json({ success: true })
  }
}
