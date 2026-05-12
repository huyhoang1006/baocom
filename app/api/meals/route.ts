import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { withAuth } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async () => {
  const meals = await prisma.meal.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json({ meals })
})

export const POST = withAdmin(async (req: NextRequest) => {
  const { name, type } = await req.json()

  if (!name || !type) {
    return NextResponse.json({ error: 'Missing name or type' }, { status: 400 })
  }

  if (!['main', 'vegetable', 'dessert'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const meal = await prisma.meal.create({ data: { name, type } })
  return NextResponse.json({ meal })
})