import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { bot } from '@/lib/zalo/bot'

export const GET = withAdmin(async () => {
  return NextResponse.json(bot.status())
})
