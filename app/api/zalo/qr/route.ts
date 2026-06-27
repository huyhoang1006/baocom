import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { bot } from '@/lib/zalo/bot'
import { classifyZaloError } from '@/lib/zalo/errors'

export const POST = withAdmin(async (_req: NextRequest) => {
  // If already connected, return current status
  if (bot.status().state === 'CONNECTED') {
    return NextResponse.json(bot.status())
  }
  try {
    await bot.initQRAndWait({
      onEvent: () => {
        // Events are streamed via /api/zalo/status polling; no SSE for Phase 1
      },
    })
    return NextResponse.json(bot.status())
  } catch (err) {
    const c = classifyZaloError(err)
    return NextResponse.json({ error: c.userMessage, kind: c.kind }, { status: c.httpStatus })
  }
})

export const DELETE = withAdmin(async () => {
  await bot.logout()
  return NextResponse.json({ ok: true, state: bot.status().state })
})
