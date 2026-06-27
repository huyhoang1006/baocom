import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { bot } from '@/lib/zalo/bot'
import { getGroupId } from '@/lib/zalo/config'
import { classifyZaloError } from '@/lib/zalo/errors'
import { appendSend } from '@/lib/zalo/send-log'

export const POST = withAdmin(async (req: NextRequest) => {
  let body: { text?: string; threadId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const text = body.text?.trim() ?? ''
  if (text.length === 0 || text.length > 2000) {
    return NextResponse.json({ error: 'text phải có độ dài 1-2000 ký tự' }, { status: 400 })
  }

  const threadId = body.threadId ?? (await getGroupId())
  if (!threadId) {
    return NextResponse.json({ error: 'Chưa chọn group đích' }, { status: 400 })
  }

  try {
    const result = await bot.send(text, threadId)
    appendSend({
      timestamp: new Date().toISOString(),
      kind: 'manual',
      status: 'success',
      threadId,
      preview: text.slice(0, 100),
    })
    return NextResponse.json(result)
  } catch (err) {
    const c = classifyZaloError(err)
    if (c.kind === 'expired') {
      return NextResponse.json({ error: c.userMessage, kind: 'BOT_EXPIRED' }, { status: 503 })
    }
    return NextResponse.json({ error: c.userMessage, kind: c.kind }, { status: c.httpStatus })
  }
})
