import { prisma } from '@/lib/prisma'
import { RegistrationRepository } from '@/repositories/RegistrationRepository'
import { CreateRegistrationDTO, UpdateRegistrationDTO, RegistrationStatus } from '@/dto/RegistrationDTO'

export class RegistrationService {
  private registrationRepository: RegistrationRepository

  constructor() {
    this.registrationRepository = new RegistrationRepository(prisma)
  }

  async findAll(userId: string, startDate?: string, endDate?: string) {
    const where: Record<string, unknown> = { userId }
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) }
    }
    return this.registrationRepository.findAll(where)
  }

  async findOne(id: string) {
    return this.registrationRepository.findOne(id)
  }

  async create(userId: string, data: CreateRegistrationDTO) {
    if (!['eating', 'not_eating'].includes(data.status)) {
      throw new Error('Invalid status')
    }
    return this.registrationRepository.upsert(userId, new Date(data.date), data.status)
  }

  async update(id: string, userId: string, role: string, data: UpdateRegistrationDTO) {
    const registration = await this.registrationRepository.findOne(id)
    if (!registration) {
      throw new Error('Registration not found')
    }
    if (role !== 'admin' && registration.userId !== userId) {
      throw new Error('Forbidden')
    }

    const updateData: Record<string, unknown> = {}
    if (data.status && ['eating', 'not_eating'].includes(data.status)) {
      updateData.status = data.status
    }
    if (data.note !== undefined) {
      updateData.note = data.note
    }

    return this.registrationRepository.update(id, updateData)
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
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    const [eating, notEating, total] = await Promise.all([
      this.registrationRepository.count({ date: { gte: date, lt: nextDay }, status: 'eating' }),
      this.registrationRepository.count({ date: { gte: date, lt: nextDay }, status: 'not_eating' }),
      this.registrationRepository.count({ date: { gte: date, lt: nextDay } })
    ])

    return { eating, notEating, total }
  }
}