import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { runNow, start, stop, restartWithNewCron, renderPreview, pickTargetDate, formatDateKey, dayNameVi } from '@/lib/zalo/auto-send'
import { getCron, isAutoSendEnabled, getSendMode, getManualDate } from '@/lib/zalo/config'

export const GET = withAdmin(async (req: NextRequest) => {
  const url = new URL(req.url)
  if (url.searchParams.get('preview') === 'true') {
    try {
      const preview = await renderPreview()
      return NextResponse.json({
        preview,
        generatedAt: new Date().toISOString(),
      })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Lỗi render preview' },
        { status: 503 }
      )
    }
  }
  const target = await pickTargetDate()
  return NextResponse.json({
    enabled: await isAutoSendEnabled(),
    cron: await getCron(),
    mode: await getSendMode(),
    manualDate: await getManualDate(),
    targetDate: formatDateKey(target),
    targetDayName: dayNameVi(target),
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
