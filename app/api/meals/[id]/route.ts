import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const GET = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const meal = await prisma.meal.findUnique({ where: { id } })
  if (!meal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ meal })
})

export const PATCH = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
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

export const DELETE = withAdmin(async (req: NextRequest, userId: string, role: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  await prisma.meal.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
})