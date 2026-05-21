import { prisma } from '@/lib/prisma'
import { RegistrationRepository } from '@/repositories/RegistrationRepository'
import { CreateRegistrationDTO, UpdateRegistrationDTO, RegistrationStatus } from '@/dto/RegistrationDTO'
import { isAllowedRegistrationDate, startOfLocalDay, parseLocalDate } from '@/lib/registrationWindow'

export type RegistrationWithUser = {
  userId: string
  status: string
  id: string
  createdAt: Date
  updatedAt: Date
  date: Date
  note: string | null
  user: { name: string; username: string }
}

export class RegistrationService {
  private registrationRepository: RegistrationRepository

  constructor() {
    this.registrationRepository = new RegistrationRepository(prisma)
  }

  private validateEditableDate(date: Date, now = new Date()) {
    const validation = isAllowedRegistrationDate(date, now)
    if (validation.ok) return

    if (validation.reason === 'LOCKED') {
      throw new Error('Ngay nay da khoa bao com')
    }

    throw new Error('Ngay nay khong nam trong lich bao com')
  }

  async findByDateRange(startDate: string, endDate: string): Promise<RegistrationWithUser[]> {
    const where: Record<string, unknown> = {
      date: { gte: parseLocalDate(startDate), lte: parseLocalDate(endDate) }
    }
    return this.registrationRepository.findAll(where) as Promise<RegistrationWithUser[]>
  }

  async findAll(userId?: string, startDate?: string, endDate?: string): Promise<RegistrationWithUser[]> {
    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) }
    }
    return this.registrationRepository.findAll(where) as Promise<RegistrationWithUser[]>
  }

  async findOne(id: string) {
    return this.registrationRepository.findOne(id)
  }

  async create(userId: string, data: CreateRegistrationDTO, now = new Date()) {
    if (!['eating', 'not_eating'].includes(data.status)) {
      throw new Error('Invalid status')
    }

    const date = parseLocalDate(data.date)
    this.validateEditableDate(date, now)

    return this.registrationRepository.upsert(userId, date, data.status)
  }

  async update(id: string, userId: string, role: string, data: UpdateRegistrationDTO, overrideNote?: string) {
    const registration = await this.registrationRepository.findOne(id)
    if (!registration) {
      throw new Error('Registration not found')
    }
    if (role !== 'admin' && registration.userId !== userId) {
      throw new Error('Forbidden')
    }

    const wasLocked = (() => {
      try {
        this.validateEditableDate(registration.date)
        return false
      } catch {
        return true
      }
    })()

    if (role !== 'admin') {
      this.validateEditableDate(registration.date)
    }

    const updateData: Record<string, unknown> = {}
    if (data.status && ['eating', 'not_eating'].includes(data.status)) {
      updateData.status = data.status
    }
    if (data.note !== undefined) {
      updateData.note = data.note
    }

    const result = await this.registrationRepository.update(id, updateData)

    // Record admin override when changing a locked date
    if (role === 'admin' && wasLocked && overrideNote && data.status) {
      await this.registrationRepository.createOverride({
        registrationId: id,
        performedBy: userId,
        newStatus: data.status,
        note: overrideNote,
        originalStatus: registration.status,
      })
    }

    return result
  }

  async delete(id: string) {
    return this.registrationRepository.delete(id)
  }

  async countByDateRange(start: Date, end: Date, status?: RegistrationStatus) {
    const where: Record<string, unknown> = { date: { gte: start, lte: end } }
    if (status) where.status = status
    return this.registrationRepository.count(where)
  }

  async countByStatus(date: Date) {
    const dayStart = startOfLocalDay(date)
    const nextDay = new Date(dayStart)
    nextDay.setDate(nextDay.getDate() + 1)

    // Only count registrations for active employees
    const where = {
      date: { gte: dayStart, lt: nextDay },
      user: { isActive: true }
    }

    const [eating, notEating, total] = await Promise.all([
      this.registrationRepository.count({ ...where, status: 'eating' }),
      this.registrationRepository.count({ ...where, status: 'not_eating' }),
      this.registrationRepository.count(where)
    ])

    return { eating, notEating, total }
  }

  async getAbsencesByDate(date: Date) {
    const dayStart = startOfLocalDay(date)
    const nextDay = new Date(dayStart)
    nextDay.setDate(nextDay.getDate() + 1)
    return this.registrationRepository.findAll({
      date: { gte: dayStart, lt: nextDay },
      status: 'not_eating',
      user: { isActive: true },
    }) as Promise<RegistrationWithUser[]>
  }

  async ensureDefaultRegistrations(date: Date): Promise<void> {
    const dayStart = startOfLocalDay(date)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    // Get all registrations for that date
    const existingRegs = await this.registrationRepository.findAll({
      date: { gte: dayStart, lt: dayEnd }
    }) as RegistrationWithUser[]

    // Get all active employees
    const { UserService } = await import('@/services/UserService')
    const userService = new UserService()
    const allEmployees = await userService.findAll()
    const registeredUserIds = new Set(existingRegs.map(r => r.userId))

    // Create default "eating" registration for any missing employee
    for (const emp of allEmployees) {
      if (!registeredUserIds.has(emp.id)) {
        await this.registrationRepository.upsert(emp.id, dayStart, 'eating')
      }
    }
  }
}
