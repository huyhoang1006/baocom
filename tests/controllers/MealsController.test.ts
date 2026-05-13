import { describe, it, expect, beforeEach } from 'vitest'
import { MealsController } from '@/controllers/MealsController'
import { NextRequest } from 'next/server'

describe('MealsController', () => {
  let controller: MealsController

  beforeEach(() => {
    controller = new MealsController()
  })

  describe('getAll', () => {
    it('should return all meals', async () => {
      const req = new NextRequest('http://localhost/api/meals')
      const response = await controller.getAll(req)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.meals).toBeDefined()
      expect(Array.isArray(data.meals)).toBe(true)
    })
  })

  describe('getOne', () => {
    it('should return 404 for non-existent meal', async () => {
      const response = await controller.getOne('non-existent-id')
      expect(response.status).toBe(404)
    })
  })

  describe('create', () => {
    it('should return 400 for missing fields', async () => {
      const req = new NextRequest('http://localhost/api/meals', {
        method: 'POST',
        body: JSON.stringify({})
      })
      const response = await controller.create(req)
      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid type', async () => {
      const req = new NextRequest('http://localhost/api/meals', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Meal', type: 'invalid' })
      })
      const response = await controller.create(req)
      expect(response.status).toBe(400)
    })
  })
})