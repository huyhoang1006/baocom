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

    it('returns 400 for locked registration date', async () => {
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-05-12', status: 'not_eating' })
      })

      const response = await controller.create(req, 'test-user-id', new Date('2026-05-11T23:00:00+07:00'))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toBe('Ngay nay da khoa bao com')
    })

    it('returns 400 for weekend registration date', async () => {
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-05-16', status: 'not_eating' })
      })

      const response = await controller.create(req, 'test-user-id', new Date('2026-05-11T10:00:00+07:00'))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toBe('Ngay nay khong nam trong lich bao com')
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
