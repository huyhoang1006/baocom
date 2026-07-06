'use client'

import { useMemo } from 'react'
import type { BotStatus, BotState } from '@/lib/zalo/types'

interface StatusBarProps {
  status: BotStatus
  onLogout: () => void | Promise<void>
}

interface StateMeta {
  label: string
  dot: string
  tone: string
}

const STATE_META: Record<BotState, StateMeta> = {
  DISCONNECTED: { label: 'Bot chưa kết nối', dot: 'bg-gray-400', tone: 'text-gray-700' },
  CONNECTING: { label: 'Đang kết nối...', dot: 'bg-yellow-400 animate-pulse', tone: 'text-yellow-700' },
  CONNECTED: { label: 'Đã kết nối', dot: 'bg-emerald-500', tone: 'text-emerald-700' },
  RECONNECTING: { label: 'Đang kết nối lại...', dot: 'bg-orange-400 animate-pulse', tone: 'text-orange-700' },
  EXPIRED: { label: 'Bot hết hạn', dot: 'bg-red-500', tone: 'text-red-700' },
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const diffMs = now - new Date(iso).getTime()
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 30) return 'vừa xong'
  if (seconds < 60) return `${seconds} giây trước`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

function StatusIndicator({ state }: { state: BotState }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${STATE_META[state].dot}`}
      aria-hidden="true"
    />
  )
}

function AccountInfo({ status }: { status: BotStatus }) {
  const meta = STATE_META[status.state]
  const relative = useMemo(
    () => (status.lastConnectedAt ? formatRelativeTime(status.lastConnectedAt) : null),
    [status.lastConnectedAt]
  )

  return (
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${meta.tone}`}>
        {meta.label}
        {status.state === 'CONNECTED' && status.account?.displayName
          ? ` — ${status.account.displayName}`
          : ''}
      </p>
      {status.state === 'CONNECTED' && relative && (
        <p className="text-xs text-ink-muted-48 mt-0.5">Hoạt động {relative}</p>
      )}
      {status.state === 'RECONNECTING' && (
        <p className="text-xs text-orange-600 mt-0.5">Đang khôi phục kết nối...</p>
      )}
      {status.state === 'EXPIRED' && status.lastError && (
        <p className="text-xs text-red-600 mt-0.5">{status.lastError.message}</p>
      )}
    </div>
  )
}

function LogoutButton({ onLogout }: { onLogout: () => void | Promise<void> }) {
  return (
    <button
      onClick={() => {
        void onLogout()
      }}
      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 whitespace-nowrap"
    >
      ⏏ Đăng xuất
    </button>
  )
}

export function StatusBar({ status, onLogout }: StatusBarProps) {
  return (
    <div
      role="status"
      className="sticky top-0 z-10 flex items-center gap-3 bg-white border-b border-hairline px-4 py-3"
    >
      <StatusIndicator state={status.state} />
      <AccountInfo status={status} />
      {status.state === 'CONNECTED' && <LogoutButton onLogout={onLogout} />}
    </div>
  )
}