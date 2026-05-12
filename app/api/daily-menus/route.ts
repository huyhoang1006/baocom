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
  const { date, mealIds } = await req.json()

  if (!date || !mealIds || !Array.isArray(mealIds)) {
    return NextResponse.json({ error: 'Missing date or mealIds' }, { status: 400 })
  }

  const dateObj = new Date(date)

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
