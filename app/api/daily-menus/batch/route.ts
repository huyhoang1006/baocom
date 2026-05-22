import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { DailyMenuService } from '@/services/DailyMenuService'
import { MealService } from '@/services/MealService'
import { prisma } from '@/lib/prisma'

const dailyMenuService = new DailyMenuService()
const mealService = new MealService()

interface BatchMenuItem {
  date: string
  mealIds: string[]
}

export async function POST(req: NextRequest) {
  let body: { menus: BatchMenuItem[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.menus || !Array.isArray(body.menus)) {
    return NextResponse.json({ error: 'Missing menus array' }, { status: 400 })
  }

  if (body.menus.length === 0) {
    return NextResponse.json({ error: 'menus array is empty' }, { status: 400 })
  }

  // Validate all menus first (fail-fast)
  const errors: string[] = []
  for (const menu of body.menus) {
    if (!menu.date || typeof menu.date !== 'string') {
      errors.push('Invalid date')
    }
    if (!Array.isArray(menu.mealIds)) {
      errors.push(`mealIds missing for ${menu.date || 'unknown date'}`)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
  }

  // Collect all unique mealIds for validation
  const allMealIds = body.menus.flatMap(m => m.mealIds)
  const uniqueMealIds = [...new Set(allMealIds)]

  try {
    await mealService.validateMealIds(uniqueMealIds)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }

  try {
    // Process all menus in a single transaction
    await prisma.$transaction(async (tx) => {
      for (const menu of body.menus) {
        const date = new Date(menu.date)
        const dailyMenu = await tx.dailyMenu.upsert({
          where: { date },
          update: {},
          create: { date }
        })

        await tx.dailyMenuMeal.deleteMany({ where: { dailyMenuId: dailyMenu.id } })

        for (let i = 0; i < menu.mealIds.length; i++) {
          await tx.dailyMenuMeal.create({
            data: { dailyMenuId: dailyMenu.id, mealId: menu.mealIds[i], sortOrder: i }
          })
        }
      }
    })

    return NextResponse.json({ success: true, saved: body.menus.length })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    throw error
  }
}