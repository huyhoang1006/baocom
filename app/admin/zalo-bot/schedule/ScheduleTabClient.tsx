'use client'

import { useZaloBot } from '../ZaloBotContext'
import { RequireConnected } from '../RequireConnected'
import { ScheduleTab } from '../../../components/zalo-bot/ScheduleTab'

export function ScheduleTabClient() {
  const { refresh, showToast } = useZaloBot()

  return (
    <RequireConnected>
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold">⏰ Hẹn giờ</h1>
          <p className="text-sm text-ink-muted-48 mt-1">
            Cấu hình auto-send theo lịch, chỉnh template và xem preview.
          </p>
        </header>
        <ScheduleTab onUpdate={refresh} showToast={showToast} />
      </div>
    </RequireConnected>
  )
}