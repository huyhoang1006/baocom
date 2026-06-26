import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import {
  getAll, setGroupId, setAutoSendEnabled, setCron, setTemplate,
  setSendMode, setManualDate, type SendMode,
} from '@/lib/zalo/config'

export const GET = withAdmin(async () => {
  const config = await getAll()
  return NextResponse.json(config)
})

export const PATCH = withAdmin(async (req: NextRequest) => {
  let body: {
    groupId?: string
    autoSendEnabled?: boolean
    cron?: string
    template?: string
    mode?: SendMode
    manualDate?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    if (body.groupId !== undefined) await setGroupId(body.groupId)
    if (body.autoSendEnabled !== undefined) await setAutoSendEnabled(body.autoSendEnabled)
    if (body.cron !== undefined) await setCron(body.cron)
    if (body.template !== undefined) await setTemplate(body.template)
    if (body.mode !== undefined) await setSendMode(body.mode)
    if (body.manualDate !== undefined) {
      await setManualDate(body.manualDate ? new Date(body.manualDate) : null)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi cập nhật config'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const config = await getAll()
  return NextResponse.json(config)
})
