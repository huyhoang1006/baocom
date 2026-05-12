import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'

export const PATCH = withAdmin(async (req: NextRequest, userId: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const { date, description, isActive } = await req.json()

  const updateData: { date?: Date; description?: string | null; isActive?: boolean } = {}
  if (date) updateData.date = new Date(date)
  if (description !== undefined) updateData.description = description
  if (typeof isActive === 'boolean') updateData.isActive = isActive

  const holiday = await prisma.holiday.update({ where: { id }, data: updateData })
  return NextResponse.json({ holiday })
})

export const DELETE = withAdmin(async (req: NextRequest, userId: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  await prisma.holiday.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
})