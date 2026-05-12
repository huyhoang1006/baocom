import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (req: NextRequest) => {
  const dateStr = req.nextUrl.pathname.split('/').pop()!
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

export const PUT = withAdmin(async (req: NextRequest) => {
  const dateStr = req.nextUrl.pathname.split('/').pop()!
  const date = new Date(dateStr)
  const { mealIds } = await req.json()

  if (!mealIds || !Array.isArray(mealIds)) {
    return NextResponse.json({ error: 'Missing mealIds' }, { status: 400 })
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
