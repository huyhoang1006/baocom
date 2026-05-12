import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const PATCH = withAdmin(async (req: NextRequest) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  const { name, type } = await req.json()

  const updateData: { name?: string; type?: string; isActive?: boolean } = {}
  if (name) updateData.name = name
  if (type) {
    if (!['main', 'vegetable', 'dessert'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    updateData.type = type
  }

  const meal = await prisma.meal.update({ where: { id }, data: updateData })
  return NextResponse.json({ meal })
})

export const DELETE = withAdmin(async (req: NextRequest) => {
  const { id } = req.nextUrl.pathname.split('/').pop()!
  await prisma.meal.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
})