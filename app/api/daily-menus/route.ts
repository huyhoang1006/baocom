import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { withAuth } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async () => {
  const menus = await prisma.dailyMenu.findMany({
    include: {
      meals: {
        include: { meal: true },
        orderBy: { sortOrder: 'asc' }
      }
    },
    orderBy: { date: 'asc' },
    take: 14 // Next 2 weeks
  })
  return NextResponse.json({ menus })
})

export const POST = withAdmin(async (req: NextRequest) => {
  let date: string, mealIds: number[]
  try {
    const body = await req.json()
    date = body.date
    mealIds = body.mealIds
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!date || !mealIds || !Array.isArray(mealIds)) {
    return NextResponse.json({ error: 'Missing date or mealIds' }, { status: 400 })
  }

  const dateObj = new Date(date)

  // Validate mealIds exist and are active
  const meals = await prisma.meal.findMany({ where: { id: { in: mealIds }, isActive: true } })
  if (meals.length !== mealIds.length) {
    return NextResponse.json({ error: 'One or more mealIds are invalid or inactive' }, { status: 400 })
  }

  // Create or update daily menu
  const dailyMenu = await prisma.dailyMenu.upsert({
    where: { date: dateObj },
    update: {},
    create: { date: dateObj }
  })

  // Delete existing meal associations
  await prisma.dailyMenuMeal.deleteMany({ where: { dailyMenuId: dailyMenu.id } })

  // Create new associations
  for (let i = 0; i < mealIds.length; i++) {
    await prisma.dailyMenuMeal.create({
      data: { dailyMenuId: dailyMenu.id, mealId: mealIds[i], sortOrder: i }
    })
  }

  const updated = await prisma.dailyMenu.findUnique({
    where: { id: dailyMenu.id },
    include: {
      meals: {
        include: { meal: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  return NextResponse.json({ dailyMenu: updated })
})
