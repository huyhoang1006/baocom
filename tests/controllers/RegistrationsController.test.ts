import { describe, it, expect, beforeEach } from 'vitest'
import { RegistrationsController } from '@/controllers/RegistrationsController'
import { NextRequest } from 'next/server'

describe('RegistrationsController', () => {
  let controller: RegistrationsController

  beforeEach(() => {
    controller = new RegistrationsController()
  })

  describe('getAll', () => {
    it('should return user registrations', async () => {
      const req = new NextRequest('http://localhost/api/registrations')
      const response = await controller.getAll(req, 'test-user-id')
      expect(response.status).toBe(200)
    })
  })

  describe('create', () => {
    it('should return 400 for missing fields', async () => {
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'POST',
        body: JSON.stringify({})
      })
      const response = await controller.create(req, 'test-user-id')
      expect(response.status).toBe(400)
    })
  })

  describe('update', () => {
    it('should return 404 for non-existent registration', async () => {
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'eating' })
      })
      const response = await controller.update('non-existent-id', req, 'test-user', 'user')
      expect(response.status).toBe(404)
    })
  })
})