import { describe, it, expect, beforeEach } from 'vitest'
import { UsersController } from '@/controllers/UsersController'
import { NextRequest } from 'next/server'

describe('UsersController', () => {
  let controller: UsersController

  beforeEach(() => {
    controller = new UsersController()
  })

  describe('getAll', () => {
    it('should return all users', async () => {
      const response = await controller.getAll()
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.users).toBeDefined()
      expect(Array.isArray(data.users)).toBe(true)
    })
  })

  describe('getOne', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await controller.getOne('non-existent-id')
      expect(response.status).toBe(404)
    })
  })

  describe('create', () => {
    it('should return 400 for missing fields', async () => {
      const req = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({})
      })
      const response = await controller.create(req)
      expect(response.status).toBe(400)
    })

    it('should return 409 for duplicate username', async () => {
      const req = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin',
          password: 'password',
          name: 'Admin'
        })
      })
      const response = await controller.create(req)
      expect(response.status).toBe(409)
    })
  })
})