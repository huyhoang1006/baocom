import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { runNow, start, stop, restartWithNewCron } from '@/lib/zalo/auto-send'
import { getCron, isAutoSendEnabled } from '@/lib/zalo/config'

export const GET = withAdmin(async () => {
  return NextResponse.json({
    enabled: await isAutoSendEnabled(),
    cron: await getCron(),
  })
})

export const POST = withAdmin(async (req: NextRequest) => {
  let body: { runNow?: boolean; start?: boolean; stop?: boolean; restart?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }

  if (body.runNow) {
    const result = await runNow()
    return NextResponse.json(result, { status: result.ok ? 200 : 503 })
  }
  if (body.stop) {
    stop()
    return NextResponse.json({ ok: true, action: 'stopped' })
  }
  if (body.restart) {
    await restartWithNewCron()
    return NextResponse.json({ ok: true, action: 'restarted' })
  }
  // Default: start
  await start()
  return NextResponse.json({ ok: true, action: 'started' })
})
