import { describe, it, expect, beforeEach, vi } from 'vitest'
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

  it('rejects creating a registration for a locked date', async () => {
    await expect(
      registrationService.create(
        'test-user-id',
        { date: '2026-05-12', status: 'not_eating' },
        new Date('2026-05-11T23:00:00+07:00')
      )
    ).rejects.toThrow('Ngay nay da khoa bao com')
  })

  it('rejects creating a registration for a weekend', async () => {
    await expect(
      registrationService.create(
        'test-user-id',
        { date: '2026-05-16', status: 'not_eating' },
        new Date('2026-05-11T10:00:00+07:00')
      )
    ).rejects.toThrow('Ngay nay khong nam trong lich bao com')
  })

  it('allows creating a registration for a later weekday that is still open', async () => {
    const repository = (registrationService as any).registrationRepository
    repository.upsert = vi.fn().mockResolvedValue({
      id: 'reg-1',
      userId: 'test-user-id',
      date: new Date('2026-05-13T00:00:00+07:00'),
      status: 'not_eating',
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const registration = await registrationService.create(
      'test-user-id',
      { date: '2026-05-13', status: 'not_eating' },
      new Date('2026-05-11T23:00:00+07:00')
    )

    expect(registration.status).toBe('not_eating')
    expect(repository.upsert).toHaveBeenCalledWith('test-user-id', new Date('2026-05-13T00:00:00.000'), 'not_eating')
  })

  it('allows creating a registration in week offset 4', async () => {
    const repository = (registrationService as any).registrationRepository
    repository.upsert = vi.fn().mockResolvedValue({
      id: 'reg-offset-4',
      userId: 'test-user-id',
      date: new Date('2026-06-12T00:00:00.000'),
      status: 'not_eating',
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const registration = await registrationService.create(
      'test-user-id',
      { date: '2026-06-12', status: 'not_eating' },
      new Date('2026-05-15T10:00:00+07:00')
    )

    expect(registration.status).toBe('not_eating')
    expect(repository.upsert).toHaveBeenCalledWith('test-user-id', new Date('2026-06-12T00:00:00.000'), 'not_eating')
  })

  it('rejects creating a registration after week offset 4', async () => {
    await expect(
      registrationService.create(
        'test-user-id',
        { date: '2026-06-15', status: 'not_eating' },
        new Date('2026-05-15T10:00:00+07:00')
      )
    ).rejects.toThrow('Ngay nay khong nam trong lich bao com')
  })
})
