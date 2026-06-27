'use client'

import { useZaloBot } from '../../admin/zalo-bot/ZaloBotContext'

export function MiniHistory() {
  const { recentEntries } = useZaloBot()
  const last = recentEntries[0] ?? null

  if (!last) return null

  const icon = last.status === 'success' ? '✅' : '❌'
  const label = last.kind === 'auto' ? 'auto' : 'tay'

  return (
    <p className="text-xs text-ink-muted-48 text-center py-2">
      {icon} Lần gửi gần nhất ({label}): <span className="truncate">{last.preview}</span>
    </p>
  )
}