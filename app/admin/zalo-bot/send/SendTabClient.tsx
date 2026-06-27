'use client'

import { useZaloBot } from '../ZaloBotContext'
import { RequireConnected } from '../RequireConnected'
import { SendTab } from '../../../components/zalo-bot/SendTab'

export function SendTabClient() {
  const { status, refresh, showToast } = useZaloBot()

  return (
    <RequireConnected>
      {status && (
        <div className="space-y-4">
          <header>
            <h1 className="text-2xl font-semibold">📤 Gửi ngay</h1>
            <p className="text-sm text-ink-muted-48 mt-1">Soạn và gửi thông báo thủ công vào group Zalo.</p>
          </header>
          <SendTab status={status} onUpdate={refresh} showToast={showToast} />
        </div>
      )}
    </RequireConnected>
  )
}