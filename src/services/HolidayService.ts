import { prisma } from '@/lib/prisma'
import { HolidayRepository } from '@/repositories/HolidayRepository'
import { CreateHolidayDTO, UpdateHolidayDTO } from '@/dto/HolidayDTO'

export class HolidayService {
  private holidayRepository: HolidayRepository

  constructor() {
    this.holidayRepository = new HolidayRepository(prisma)
  }

  async findAll() {
    return this.holidayRepository.findAll({ isActive: true })
  }

  async findOne(id: string) {
    return this.holidayRepository.findOne(id)
  }

  async create(data: CreateHolidayDTO) {
    return this.holidayRepository.create({
      date: new Date(data.date),
      description: data.description
    })
  }

  async update(id: string, data: UpdateHolidayDTO) {
    const updateData: Record<string, unknown> = {}
    if (data.date) updateData.date = new Date(data.date)
    if (data.description !== undefined) updateData.description = data.description
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive

    return this.holidayRepository.update(id, updateData)
  }

  async delete(id: string) {
    return this.holidayRepository.delete(id)
  }
}