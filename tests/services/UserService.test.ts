import { describe, it, expect, beforeEach } from 'vitest'
import { UserService } from '@/services/UserService'

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    userService = new UserService()
  })

  it('should find all active users', async () => {
    const users = await userService.findAll()
    expect(Array.isArray(users)).toBe(true)
  })

  it('should throw error when username already exists', async () => {
    await expect(
      userService.create({
        username: 'admin',
        password: 'test123',
        name: 'Test User'
      })
    ).rejects.toThrow('Username already exists')
  })

  it('should create user with hashed password', async () => {
    const newUser = await userService.create({
      username: 'testuser_' + Date.now(),
      password: 'password123',
      name: 'Test User'
    })
    expect(newUser.username).toBeDefined()
    expect(newUser.password).not.toBe('password123')
  })
})