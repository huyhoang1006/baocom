import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ date: string }> }) => {
  const { date: dateStr } = await context.params
  const date = new Date(dateStr)

  const menu = await prisma.dailyMenu.findUnique({
    where: { date },
    include: {
      meals: {
        include: { meal: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  return NextResponse.json({ dailyMenu: menu })
})

export const PUT = withAdmin(async (req: NextRequest, userId: string, context: { params: Promise<{ date: string }> }) => {
  const { date: dateStr } = await context.params
  const date = new Date(dateStr)
  let mealIds: number[]
  try {
    const body = await req.json()
    mealIds = body.mealIds
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!mealIds || !Array.isArray(mealIds)) {
    return NextResponse.json({ error: 'Missing mealIds' }, { status: 400 })
  }

  // Validate mealIds exist
  const meals = await prisma.meal.findMany({ where: { id: { in: mealIds }, isActive: true } })
  if (meals.length !== mealIds.length) {
    return NextResponse.json({ error: 'One or more mealIds are invalid' }, { status: 400 })
  }

  const dailyMenu = await prisma.dailyMenu.upsert({
    where: { date },
    update: {},
    create: { date }
  })

  await prisma.dailyMenuMeal.deleteMany({ where: { dailyMenuId: dailyMenu.id } })

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
