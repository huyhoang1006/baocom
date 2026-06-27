'use client'

import { useZaloBot } from '../../admin/zalo-bot/ZaloBotContext'

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'vừa xong'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} phút trước`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} giờ trước`
  return `${Math.floor(hr / 24)} ngày trước`
}

export function RecentTab() {
  const { recentEntries, recentLoading } = useZaloBot()
  const entries = recentEntries

  if (recentLoading && entries.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-muted-48">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        Đang tải lịch sử…
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-2">📭</div>
        <p className="text-sm text-ink-muted-48">Chưa có lịch sử gửi nào.</p>
        <p className="text-xs text-ink-muted-48 mt-1">
          Lịch sử sẽ xuất hiện sau khi bạn gửi tin nhắn đầu tiên.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div
          key={`${e.timestamp}-${e.threadId}`}
          className="flex items-start gap-3 p-2 rounded border border-hairline bg-canvas"
        >
          <span className="text-lg shrink-0">{e.status === 'success' ? '✅' : '❌'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{e.kind === 'auto' ? 'Auto-send' : 'Gửi tay'}</span>
              <span className="text-ink-muted-48 ml-2">→ thread {e.threadId}</span>
            </p>
            <p className="text-xs text-ink-muted-48 truncate">{e.preview}</p>
            {e.error && <p className="text-xs text-red-600 mt-1">{e.error}</p>}
          </div>
          <span className="text-xs text-ink-muted-48 shrink-0 whitespace-nowrap">
            {formatRelative(e.timestamp)}
          </span>
        </div>
      ))}
    </div>
  )
}