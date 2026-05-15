import { NextRequest, NextResponse } from 'next/server'
import { HolidayService } from '@/services/HolidayService'
import { CreateHolidayDTO, UpdateHolidayDTO } from '@/dto/HolidayDTO'

export class HolidaysController {
  private holidayService: HolidayService

  constructor() {
    this.holidayService = new HolidayService()
  }

  async getAll() {
    const holidays = await this.holidayService.findAll()
    return NextResponse.json({ holidays })
  }

  async getOne(id: string) {
    const holiday = await this.holidayService.findOne(id)
    if (!holiday) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ holiday })
  }

  async create(req: NextRequest) {
    let body: CreateHolidayDTO
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.date) {
      return NextResponse.json({ error: 'Missing date' }, { status: 400 })
    }

    try {
      const holiday = await this.holidayService.create(body)
      return NextResponse.json({ holiday }, { status: 201 })
    } catch (error) {
      if (error instanceof Error && error.message === 'Date already exists') {
        return NextResponse.json({ error: 'Date already exists' }, { status: 400 })
      }
      throw error
    }
  }

  async update(id: string, req: NextRequest) {
    let body: UpdateHolidayDTO
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    try {
      const holiday = await this.holidayService.update(id, body)
      return NextResponse.json({ holiday })
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  async delete(id: string) {
    await this.holidayService.delete(id)
    return NextResponse.json({ success: true })
  }
}