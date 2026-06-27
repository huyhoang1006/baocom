'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { StatusBar } from '../../components/zalo-bot/StatusBar'
import { ToastContainer, useToasts } from '../../components/zalo-bot/Toast'
import { ZaloBotProvider, useZaloBot, type SendLogEntry } from './ZaloBotContext'
import type { BotStatus, BotState } from '@/lib/zalo/types'

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

interface NavItem {
  href: string
  label: string
  /** Optional icon emoji */
  icon: string
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/admin/zalo-bot?tab=dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/zalo-bot?tab=send', label: 'Gửi ngay', icon: '📤' },
  { href: '/admin/zalo-bot?tab=schedule', label: 'Hẹn giờ', icon: '⏰' },
  { href: '/admin/zalo-bot?tab=history', label: 'Lịch sử', icon: '📜' },
] as const

export function ZaloBotLayoutClient({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<BotStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentEntries, setRecentEntries] = useState<SendLogEntry[]>([])
  const [recentLoading, setRecentLoading] = useState(true)
  const { toasts, showToast, dismiss } = useToasts()

  const refresh = useCallback(async () => {
    try {
      const data = await fetchJson<BotStatus>('/api/zalo/status')
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initial = setTimeout(() => { void refresh() }, 0)
    const interval = setInterval(refresh, status?.state === 'CONNECTING' ? 2000 : 10000)
    return () => {
      clearTimeout(initial)
      clearInterval(interval)
    }
  }, [refresh, status?.state])

  const prevStateRef = useRef<BotState | null>(null)
  useEffect(() => {
    if (!status) return
    const prev = prevStateRef.current
    if (prev !== null && prev !== status.state) {
      // State đã thay đổi (không phải initial mount / reload)
      if (status.state === 'CONNECTED') {
        showToast('success', 'Đã kết nối Zalo Bot!')
      } else if (status.state === 'EXPIRED') {
        showToast('error', 'Bot hết hạn', {
          description: 'Cần quét QR lại để tiếp tục.',
          autoHideMs: 0,
        })
      }
    }
    prevStateRef.current = status.state
  }, [status?.state, showToast])

  const handleLogout = useCallback(async () => {
    if (!confirm('Đăng xuất bot? Cần quét QR lại.')) return
    try {
      const res = await fetch('/api/zalo/qr', { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Lỗi logout')
      }
      showToast('info', 'Đã đăng xuất bot')
      await refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi'
      showToast('error', 'Lỗi đăng xuất', { description: msg })
    }
  }, [refresh, showToast])

  const [sendTick, setSendTick] = useState(0)
  const bumpSendTick = useCallback(() => setSendTick((n) => n + 1), [])

  const refreshRecent = useCallback(async () => {
    try {
      const res = await fetch('/api/zalo/auto-send/recent?limit=20', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      setRecentEntries(body.entries ?? [])
    } catch {
      // silent — MiniHistory/RecentTab non-critical
    } finally {
      setRecentLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status?.state !== 'CONNECTED') return
    void refreshRecent()
  }, [status?.state, sendTick, refreshRecent])

  const ctxValue = useMemo(
    () => ({ status, isLoading: loading, error, refresh, showToast, sendTick, bumpSendTick, recentEntries, recentLoading, refreshRecent }),
    [status, loading, error, refresh, showToast, sendTick, bumpSendTick, recentEntries, recentLoading, refreshRecent]
  )

  return (
    <ZaloBotProvider value={ctxValue}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {status && <StatusBar status={status} onLogout={handleLogout} />}

      <TopNav visible={!!status && status.state === 'CONNECTED'} />

      <div className="p-6 space-y-6">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refresh} /> : children}
      </div>
    </ZaloBotProvider>
  )
}

function TopNav({ visible }: { visible: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  if (!visible) return null
  const currentTab = searchParams.get('tab') ?? 'dashboard'
  return (
    <nav
      aria-label="Zalo Bot sections"
      className="bg-white border-b border-hairline px-4 py-2 flex items-center gap-1 overflow-x-auto"
    >
      {NAV_ITEMS.map((item) => {
        const itemTab = new URL(item.href, 'http://x').searchParams.get('tab')
        const active = pathname === '/admin/zalo-bot' && itemTab === currentTab
        return (
          <Link
            key={item.href}
            href={item.href}
            data-testid={`zalo-nav-${itemTab}`}
            className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition ${
              active
                ? 'bg-primary/10 text-primary'
                : 'text-ink-muted-48 hover:bg-canvas hover:text-ink'
            }`}
          >
            <span aria-hidden="true">{item.icon}</span> {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
        <p className="text-sm text-ink-muted-48">Đang tải trạng thái bot...</p>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
      <p className="text-sm text-red-800">{message}</p>
      <button onClick={() => void onRetry()} className="mt-2 text-sm text-red-600 hover:underline">
        Thử lại
      </button>
    </div>
  )
}

/**
 * Hook convenience: chỉ render khi CONNECTED. Page con dùng để guard.
 * Trả về null khi chưa CONNECTED.
 */
export function useRequireConnected(): BotStatus | null {
  const { status } = useZaloBot()
  return status?.state === 'CONNECTED' ? status : null
}