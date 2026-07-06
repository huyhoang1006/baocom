import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { bot } from '@/lib/zalo/bot'
import { classifyZaloError } from '@/lib/zalo/errors'

function readIntervalMs(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const ms = Math.trunc(value)
  if (ms < 1_000 || ms > 24 * 60 * 60 * 1000) return null
  return ms
}

function compactBotStatus() {
  const status = bot.status()
  return {
    state: status.state,
    account: status.account,
    lastConnectedAt: status.lastConnectedAt,
    lastError: status.lastError,
    hasQr: !!status.qr,
  }
}

export const GET = withAdmin(async () => {
  return NextResponse.json({
    bot: compactBotStatus(),
    keepAlive: bot.keepAliveStatus(),
    session: bot.sessionStatus(),
  })
})

export const POST = withAdmin(async (req: NextRequest) => {
  let body: { triggerNow?: boolean; intervalMs?: number; restart?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }

  const intervalMs = readIntervalMs(body.intervalMs)
  if (body.intervalMs !== undefined && intervalMs === null) {
    return NextResponse.json(
      { error: 'intervalMs phải là số từ 1000 đến 86400000 (24h)' },
      { status: 400 }
    )
  }

  if (body.restart) {
    bot.stopKeepAlive()
  }

  if (intervalMs !== null) {
    bot.stopKeepAlive()
    bot.startKeepAlive(intervalMs)
  }

  if (body.triggerNow) {
    try {
      const result = await bot.debugKeepAliveNow()
      return NextResponse.json({
        ok: true,
        result,
        bot: compactBotStatus(),
        keepAlive: bot.keepAliveStatus(),
        session: bot.sessionStatus(),
      })
    } catch (err) {
      const c = classifyZaloError(err)
      return NextResponse.json(
        {
          ok: false,
          error: c.userMessage,
          kind: c.kind,
          bot: compactBotStatus(),
          keepAlive: bot.keepAliveStatus(),
          session: bot.sessionStatus(),
        },
        { status: c.httpStatus }
      )
    }
  }

  return NextResponse.json({
    ok: true,
    bot: bot.status(),
    keepAlive: bot.keepAliveStatus(),
    session: bot.sessionStatus(),
  })
})