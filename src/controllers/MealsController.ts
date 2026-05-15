import { NextRequest, NextResponse } from 'next/server'
import { MealService } from '@/services/MealService'
import { CreateMealDTO, UpdateMealDTO, MealType } from '@/dto/MealDTO'

export class MealsController {
  private mealService: MealService

  constructor() {
    this.mealService = new MealService()
  }

  async getAll(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const type = searchParams.get('type') as MealType | null
    const meals = await this.mealService.findAll(type || undefined)
    return NextResponse.json({ meals })
  }

  async getOne(id: string) {
    const meal = await this.mealService.findOne(id)
    if (!meal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ meal })
  }

  async create(req: NextRequest) {
    let body: CreateMealDTO
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.name || !body.type) {
      return NextResponse.json({ error: 'Missing name or type' }, { status: 400 })
    }

    try {
      const meal = await this.mealService.create(body)
      return NextResponse.json({ meal }, { status: 201 })
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid meal type') {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
      }
      throw error
    }
  }

  async update(id: string, req: NextRequest) {
    let body: UpdateMealDTO
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    try {
      const meal = await this.mealService.update(id, body)
      return NextResponse.json({ meal })
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  async delete(id: string) {
    await this.mealService.delete(id)
    return NextResponse.json({ success: true })
  }

  async findOrCreate(req: NextRequest) {
    let body: { name: string; type: MealType }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.name || !body.type) {
      return NextResponse.json({ error: 'Missing name or type' }, { status: 400 })
    }

    if (!['main', 'vegetable', 'dessert'].includes(body.type)) {
      return NextResponse.json({ error: 'Invalid meal type' }, { status: 400 })
    }

    const meal = await this.mealService.findOrCreateByName(body.name, body.type)
    return NextResponse.json({ meal }, { status: 200 })
  }
}