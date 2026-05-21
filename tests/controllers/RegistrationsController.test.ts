// Helper: get tomorrow's date at 23:00+07:00 (cutoff moment for next day registration)
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { RegistrationsController } from '@/controllers/RegistrationsController'
function tomorrowAtCutoff(): Date {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  tomorrow.setHours(23, 0, 0, 0)
  return tomorrow
}

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

    it('returns dateKey for fetched registrations', async () => {
      const service = (controller as unknown as { registrationService: { findAll: ReturnType<typeof vi.fn> } }).registrationService
      service.findAll = vi.fn().mockResolvedValue([
        {
          id: 'reg-1',
          userId: 'test-user-id',
          date: new Date('2026-05-18T00:00:00.000Z'),
          status: 'eating',
          note: null,
          createdAt: new Date('2026-05-15T00:00:00.000Z'),
          updatedAt: new Date('2026-05-15T00:00:00.000Z'),
          user: { name: 'Nguyen Van A', username: 'nguyenvana' },
        },
      ])

      const req = new NextRequest('http://localhost/api/registrations')
      const response = await controller.getAll(req, 'test-user-id')
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.registrations[0].dateKey).toBe('2026-05-18')
      expect(body.registrations[0].status).toBe('eating')
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

    it('returns dateKey for created registrations', async () => {
      const service = (controller as unknown as { registrationService: { create: ReturnType<typeof vi.fn> } }).registrationService
      service.create = vi.fn().mockResolvedValue({
        id: 'reg-2',
        userId: 'test-user-id',
        date: new Date('2026-05-18T00:00:00.000Z'),
        status: 'eating',
        note: null,
        createdAt: new Date('2026-05-15T00:00:00.000Z'),
        updatedAt: new Date('2026-05-15T00:00:00.000Z'),
      })
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-05-18', status: 'eating' }),
      })

      const response = await controller.create(req, 'test-user-id', new Date('2026-05-15T10:00:00+07:00'))
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.registration.dateKey).toBe('2026-05-18')
      expect(body.registration.status).toBe('eating')
    })

    it('returns 400 for invalid date format', async () => {
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ date: '2026/05/18', status: 'eating' })
      })
      const response = await controller.create(req, 'test-user-id', new Date('2026-05-15T10:00:00+07:00'))
      expect(response.status).toBe(400)
    })

    it('returns 400 for invalid status value', async () => {
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-05-18', status: 'unknown' })
      })
      const response = await controller.create(req, 'test-user-id', new Date('2026-05-15T10:00:00+07:00'))
      expect(response.status).toBe(400)
    })

    it('returns 400 for missing date (status only)', async () => {
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ status: 'eating' })
      })
      const response = await controller.create(req, 'test-user-id', new Date('2026-05-15T10:00:00+07:00'))
      expect(response.status).toBe(400)
    })

    it('returns 400 for locked registration date', async () => {
      // Test locked date: May 25, 2026 (Monday) - cutoff is day before at 23:00
      // Using explicit Vietnam timezone date to avoid timezone ambiguity
      const cutoff = new Date('2026-05-24T23:00:00+07:00')
      const req = new NextRequest('http://localhost/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-05-25', status: 'not_eating' })
      })

      const response = await controller.create(req, 'test-user-id', cutoff)
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
