import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export const GET = withAdmin(async () => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, username: true, name: true, role: true, createdAt: true }
  })
  return NextResponse.json({ users })
})

export const POST = withAdmin(async (req: NextRequest) => {
  const { username, password, name, role } = await req.json()

  if (!username || !password || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: { username, password: hashedPassword, name, role: role || 'employee' }
  })

  return NextResponse.json({ user: { id: user.id, username: user.username, name: user.name, role: user.role } })
})