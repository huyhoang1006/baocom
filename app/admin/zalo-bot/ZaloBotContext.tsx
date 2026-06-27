'use client'

import { createContext, useContext } from 'react'
import type { BotStatus } from '@/lib/zalo/types'
import type { ToastType } from '../../components/zalo-bot/Toast'

export type ShowToastFn = (
  type: ToastType,
  message: string,
  opts?: { description?: string; autoHideMs?: number; action?: { label: string; onClick: () => void } }
) => void

export interface SendLogEntry {
  timestamp: string
  kind: 'auto' | 'manual'
  status: 'success' | 'fail'
  threadId: string
  preview: string
  error?: string
}

export interface ZaloBotContextValue {
  /** Bot status từ polling — null trong lúc fetch đầu hoặc khi error */
  status: BotStatus | null
  /** True khi initial fetch chưa xong */
  isLoading: boolean
  /** True khi fetch đầu fail (network/HTTP error) */
  error: string | null
  /** Trigger re-fetch status ngay (không đợi interval) */
  refresh: () => Promise<void>
  /** Toast helper — dùng mọi nơi trong zalo-bot section */
  showToast: ShowToastFn
  /** Bump counter mỗi khi SendTab gửi thành công; RecentTab listen để refresh. */
  sendTick: number
  /** Bump sendTick — gọi từ SendTab sau khi POST /api/zalo/send thành công. */
  bumpSendTick: () => void
  /** Recent send log entries (limit 20) — shared giữa MiniHistory và RecentTab. */
  recentEntries: SendLogEntry[]
  /** True khi đang fetch recentEntries lần đầu */
  recentLoading: boolean
  /** Force re-fetch recentEntries */
  refreshRecent: () => Promise<void>
}

const ZaloBotContext = createContext<ZaloBotContextValue | null>(null)

export function ZaloBotProvider({
  value,
  children,
}: {
  value: ZaloBotContextValue
  children: React.ReactNode
}) {
  return <ZaloBotContext.Provider value={value}>{children}</ZaloBotContext.Provider>
}

/** Hook truy cập status + helpers. Throw nếu dùng ngoài provider (test sẽ thấy ngay). */
export function useZaloBot(): ZaloBotContextValue {
  const ctx = useContext(ZaloBotContext)
  if (!ctx) {
    throw new Error('useZaloBot must be used within <ZaloBotProvider>')
  }
  return ctx
}