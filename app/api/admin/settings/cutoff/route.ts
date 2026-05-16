import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { upsertCutoffConfig } from '@/lib/cutoffConfig'

export const GET = withAdmin(async () => {
  const { getCutoffConfig } = await import('@/lib/cutoffConfig')
  const config = await getCutoffConfig()
  return NextResponse.json({ cutoffHour: config.cutoffHour, cutoffMinute: config.cutoffMinute })
})

export const PUT = withAdmin(async (req: NextRequest, userId: string) => {
  let body: { cutoffHour: number; cutoffMinute: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.cutoffHour !== 'number' || typeof body.cutoffMinute !== 'number') {
    return NextResponse.json({ error: 'Missing cutoffHour or cutoffMinute' }, { status: 400 })
  }

  const hour = body.cutoffHour
  const minute = body.cutoffMinute
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return NextResponse.json({ error: 'Invalid cutoff time: hour must be 0-23, minute must be 0-59' }, { status: 400 })
  }

  await upsertCutoffConfig(hour, minute, userId)
  return NextResponse.json({ success: true, cutoffHour: hour, cutoffMinute: minute })
})
