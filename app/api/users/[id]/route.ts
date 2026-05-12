import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export const GET = withAdmin(async (req: NextRequest, userId: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, name: true, role: true, createdAt: true }
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ user })
})

export const PATCH = withAdmin(async (req: NextRequest, userId: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  let body: { name?: string; password?: string; role?: string; isActive?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updateData: { name?: string; password?: string; role?: string; isActive?: boolean } = {}
  if (body.name) updateData.name = body.name
  if (body.password) updateData.password = await hashPassword(body.password)
  if (body.role) updateData.role = body.role
  if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive

  const user = await prisma.user.update({ where: { id }, data: updateData })
  return NextResponse.json({ user: { id: user.id, username: user.username, name: user.name, role: user.role } })
})

export const DELETE = withAdmin(async (req: NextRequest, userId: string, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  // Soft delete
  await prisma.user.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
})