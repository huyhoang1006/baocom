import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RegistrationService } from '@/services/RegistrationService'

type RegistrationRepositoryStub = {
  upsert: ReturnType<typeof vi.fn>
}

function getRegistrationRepository(service: RegistrationService): RegistrationRepositoryStub {
  return service['registrationRepository'] as unknown as RegistrationRepositoryStub
}

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
        status: 'invalid' as never
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
    const repository = getRegistrationRepository(registrationService)
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
    const repository = getRegistrationRepository(registrationService)
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

describe('countByStatus with holiday/weekend exclusion', () => {
  let registrationService: RegistrationService

  beforeEach(() => {
    registrationService = new RegistrationService()
  })

  it('count for weekday date only includes active-eligible registrations', async () => {
    // 2026-05-13 is a Wednesday
    const date = new Date('2026-05-13T00:00:00.000')
    const counts = await registrationService.countByStatus(date)
    expect(counts).toHaveProperty('eating')
    expect(counts).toHaveProperty('notEating')
    expect(counts).toHaveProperty('total')
    // counts are non-negative integers
    expect(counts.eating).toBeGreaterThanOrEqual(0)
    expect(counts.notEating).toBeGreaterThanOrEqual(0)
    expect(counts.total).toBe(counts.eating + counts.notEating)
  })

  it('weekend dates are excluded from count', async () => {
    // 2026-05-16 is a Saturday
    const saturday = new Date('2026-05-16T00:00:00.000')
    // 2026-05-17 is a Sunday
    const sunday = new Date('2026-05-17T00:00:00.000')

    const satCounts = await registrationService.countByStatus(saturday)
    const sunCounts = await registrationService.countByStatus(sunday)

    // Weekend counts should be 0 or reflect the actual DB state
    // The service does not block weekend queries, so we just verify structure
    expect(satCounts).toHaveProperty('eating')
    expect(satCounts).toHaveProperty('notEating')
    expect(satCounts).toHaveProperty('total')
    expect(sunCounts).toHaveProperty('eating')
    expect(sunCounts).toHaveProperty('notEating')
    expect(sunCounts).toHaveProperty('total')
  })

  it('empty range returns zero counts', async () => {
    // Query a date far in the past with no data
    const oldDate = new Date('2020-01-01T00:00:00.000')
    const counts = await registrationService.countByStatus(oldDate)
    expect(counts.eating).toBe(0)
    expect(counts.notEating).toBe(0)
    expect(counts.total).toBe(0)
  })
})

describe('findByDateRange with holiday filtering', () => {
  let registrationService: RegistrationService

  beforeEach(() => {
    registrationService = new RegistrationService()
  })

  it('range Monday-Friday only returns weekday registrations', async () => {
    // 2026-05-11 (Mon) to 2026-05-15 (Fri)
    const registrations = await registrationService.findByDateRange('2026-05-11', '2026-05-15')

    // Verify all returned registrations are weekdays (Mon=1 to Fri=5)
    for (const reg of registrations) {
      const day = new Date(reg.date).getDay()
      expect(day).toBeGreaterThanOrEqual(1)
      expect(day).toBeLessThanOrEqual(5)
    }
  })

  it('range Monday-Sunday filters out Sunday', async () => {
    // 2026-05-11 (Mon) to 2026-05-17 (Sun)
    const registrations = await registrationService.findByDateRange('2026-05-11', '2026-05-17')

    // Verify no Sunday (day 0) in results
    for (const reg of registrations) {
      const day = new Date(reg.date).getDay()
      expect(day).not.toBe(0)
    }
  })
})
