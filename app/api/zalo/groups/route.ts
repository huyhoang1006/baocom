import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { bot } from '@/lib/zalo/bot'
import { classifyZaloError } from '@/lib/zalo/errors'

export const GET = withAdmin(async () => {
  try {
    const groups = await bot.listGroups()
    return NextResponse.json({ groups })
  } catch (err) {
    const c = classifyZaloError(err)
    return NextResponse.json({ error: c.userMessage, kind: c.kind }, { status: c.httpStatus })
  }
})
