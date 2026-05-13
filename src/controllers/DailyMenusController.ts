import { NextRequest, NextResponse } from 'next/server'
import { DailyMenuService } from '@/services/DailyMenuService'
import { CreateDailyMenuDTO } from '@/dto/DailyMenuDTO'

export class DailyMenusController {
  private dailyMenuService: DailyMenuService

  constructor() {
    this.dailyMenuService = new DailyMenuService()
  }

  async getAll(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const take = searchParams.get('take')
    const menus = await this.dailyMenuService.findAll(take ? parseInt(take) : undefined)
    return NextResponse.json({ menus })
  }

  async getByDate(req: NextRequest, dateStr: string) {
    const menu = await this.dailyMenuService.findByDate(dateStr)
    return NextResponse.json({ dailyMenu: menu })
  }

  async create(req: NextRequest) {
    let body: CreateDailyMenuDTO
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.date || !body.mealIds || !Array.isArray(body.mealIds)) {
      return NextResponse.json({ error: 'Missing date or mealIds' }, { status: 400 })
    }

    try {
      const menu = await this.dailyMenuService.create(body)
      return NextResponse.json({ dailyMenu: menu }, { status: 201 })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid mealIds') {
          return NextResponse.json({ error: 'Invalid mealIds' }, { status: 400 })
        }
        if (error.message.includes('invalid or inactive')) {
          return NextResponse.json({ error: 'One or more mealIds are invalid or inactive' }, { status: 400 })
        }
      }
      throw error
    }
  }

  async updateByDate(req: NextRequest, dateStr: string) {
    let body: { mealIds: string[] }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.mealIds || !Array.isArray(body.mealIds)) {
      return NextResponse.json({ error: 'Missing mealIds' }, { status: 400 })
    }

    try {
      const menu = await this.dailyMenuService.create({ date: dateStr, mealIds: body.mealIds })
      return NextResponse.json({ dailyMenu: menu })
    } catch (error) {
      if (error instanceof Error && error.message.includes('invalid')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }
  }
}