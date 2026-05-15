import { prisma } from '@/lib/prisma'
import { HolidayRepository } from '@/repositories/HolidayRepository'
import { CreateHolidayDTO, UpdateHolidayDTO } from '@/dto/HolidayDTO'
import { Prisma } from '@prisma/client'

export class HolidayService {
  private holidayRepository: HolidayRepository

  constructor() {
    this.holidayRepository = new HolidayRepository(prisma)
  }

  async findAll() {
    return this.holidayRepository.findAll()
  }

  async findOne(id: string) {
    return this.holidayRepository.findOne(id)
  }

  async create(data: CreateHolidayDTO) {
    const existing = await prisma.holiday.findFirst({
      where: { date: new Date(data.date) }
    })
    if (existing) {
      throw new Error('Date already exists')
    }
    return this.holidayRepository.create({
      date: new Date(data.date),
      description: data.description || '',
      isActive: true
    })
  }

  async update(id: string, data: UpdateHolidayDTO) {
    const updateData: Prisma.HolidayUpdateInput = {}
    if (data.date) updateData.date = new Date(data.date)
    if (data.description !== undefined) updateData.description = data.description
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    return this.holidayRepository.update(id, updateData)
  }

  async delete(id: string) {
    return this.holidayRepository.delete(id)
  }
}