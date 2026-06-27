'use client'

import { RecentTab } from '../../../components/zalo-bot/RecentTab'
import { MiniHistory } from '../../../components/zalo-bot/MiniHistory'

export function HistoryTabClient() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">📜 Lịch sử gửi</h1>
        <p className="text-sm text-ink-muted-48 mt-1">
          Các lần gửi gần nhất (auto + manual) đến group Zalo.
        </p>
      </header>
      <RecentTab />
      <MiniHistory />
    </div>
  )
}