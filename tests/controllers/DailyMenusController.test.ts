import { describe, it, expect, beforeEach } from 'vitest'
import { DailyMenusController } from '@/controllers/DailyMenusController'
import { NextRequest } from 'next/server'

describe('DailyMenusController', () => {
  let controller: DailyMenusController

  beforeEach(() => {
    controller = new DailyMenusController()
  })

  describe('getAll', () => {
    it('should return daily menus', async () => {
      const req = new NextRequest('http://localhost/api/daily-menus')
      const response = await controller.getAll(req)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.menus).toBeDefined()
    })
  })

  describe('create', () => {
    it('should return 400 for missing fields', async () => {
      const req = new NextRequest('http://localhost/api/daily-menus', {
        method: 'POST',
        body: JSON.stringify({})
      })
      const response = await controller.create(req)
      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid mealIds', async () => {
      const req = new NextRequest('http://localhost/api/daily-menus', {
        method: 'POST',
        body: JSON.stringify({
          date: new Date().toISOString(),
          mealIds: ['invalid-id']
        })
      })
      const response = await controller.create(req)
      expect(response.status).toBe(400)
    })
  })
})