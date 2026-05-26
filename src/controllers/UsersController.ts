import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/UserService'
import { CreateUserDTO, UpdateUserDTO } from '@/dto/UserDTO'

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
        createdAt: u.createdAt
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
        createdAt: user.createdAt
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
          role: result.user.role
        },
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
          role: user.role
        }
      })
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  async delete(id: string) {
    await this.userService.delete(id)
    return NextResponse.json({ success: true })
  }
}