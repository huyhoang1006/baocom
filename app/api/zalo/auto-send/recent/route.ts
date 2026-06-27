import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { readRecent } from '@/lib/zalo/send-log'

export const GET = withAdmin(async (req: NextRequest) => {
  const url = new URL(req.url)
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '10'), 1), 50)
  const entries = readRecent(limit)
  return NextResponse.json({ entries })
})