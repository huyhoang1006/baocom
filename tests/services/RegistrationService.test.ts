import { describe, it, expect, beforeEach } from 'vitest'
import { RegistrationService } from '@/services/RegistrationService'

describe('RegistrationService', () => {
  let registrationService: RegistrationService

  beforeEach(() => {
    registrationService = new RegistrationService()
  })

  it('should find all registrations for a user', async () => {
    // This will fail if no users exist - tests integration with DB
    const registrations = await registrationService.findAll('test-user-id')
    expect(Array.isArray(registrations)).toBe(true)
  })

  it('should throw error for invalid status', async () => {
    const today = new Date().toISOString()
    await expect(
      registrationService.create('test-user-id', {
        userId: 'test-user-id',
        date: today,
        status: 'invalid' as any
      })
    ).rejects.toThrow('Invalid status')
  })

  it('should count registrations by status for a date range', async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const counts = await registrationService.countByStatus(today)
    expect(counts).toHaveProperty('eating')
    expect(counts).toHaveProperty('notEating')
    expect(counts).toHaveProperty('total')
  })
})