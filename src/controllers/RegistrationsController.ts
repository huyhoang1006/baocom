import { NextRequest, NextResponse } from 'next/server'
import { RegistrationService } from '@/services/RegistrationService'
import { CreateRegistrationDTO, UpdateRegistrationDTO } from '@/dto/RegistrationDTO'
import { toDateKey } from '@/lib/registrationWindow'

export class RegistrationsController {
  private registrationService: RegistrationService

  constructor() {
    this.registrationService = new RegistrationService()
  }

  private withDateKey<T extends { date: Date }>(registration: T): T & { dateKey: string } {
    return {
      ...registration,
      dateKey: toDateKey(registration.date),
    }
  }

  async getAll(req: NextRequest, userId: string) {
    const { searchParams } = req.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const registrations = await this.registrationService.findAll(userId, startDate || undefined, endDate || undefined)
    return NextResponse.json({ registrations: registrations.map((registration) => this.withDateKey(registration)) })
  }

  async getOne(id: string, userId?: string, role?: string) {
    const registration = await this.registrationService.findOne(id)
    if (!registration) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    // IDOR check: non-admin cannot access other users' registrations
    if (role !== 'admin' && registration.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ registration })
  }

  async create(req: NextRequest, userId: string, now = new Date()) {
    let body: CreateRegistrationDTO
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.date || !body.status) {
      return NextResponse.json({ error: 'Missing date or status' }, { status: 400 })
    }

    try {
      const registration = await this.registrationService.create(userId, body, now)
      return NextResponse.json({ registration: this.withDateKey(registration) }, { status: 201 })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid status') {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }
        if (error.message === 'Ngay nay da khoa bao com' || error.message === 'Ngay nay khong nam trong lich bao com') {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }
      throw error
    }
  }

  async update(id: string, req: NextRequest, userId: string, role: string) {
    let body: UpdateRegistrationDTO & { overrideNote?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { overrideNote, ...updateData } = body

    try {
      const registration = await this.registrationService.update(id, userId, role, updateData, overrideNote)
      return NextResponse.json({ registration })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Registration not found') {
          return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        if (error.message === 'Forbidden') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        if (error.message === 'Ngay nay da khoa bao com' || error.message === 'Ngay nay khong nam trong lich bao com') {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }
      throw error
    }
  }

  async delete(id: string, userId?: string, role?: string) {
    // IDOR check: non-admin cannot delete other users' registrations
    const registration = await this.registrationService.findOne(id)
    if (registration && role !== 'admin' && registration.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    try {
      await this.registrationService.delete(id)
      return NextResponse.json({ success: true })
    } catch (error) {
      if (error instanceof Error && error.message === 'Registration not found') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      throw error
    }
  }
}
