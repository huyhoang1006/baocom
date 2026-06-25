'use client'

import { useEffect, useState, useCallback } from 'react'
import { SetupCard } from '../../components/zalo-bot/SetupCard'
import { StatusCard } from '../../components/zalo-bot/StatusCard'
import { ComposeCard } from '../../components/zalo-bot/ComposeCard'
import { AutoSendCard } from '../../components/zalo-bot/AutoSendCard'
import { StatusBanner } from '../../components/zalo-bot/StatusBanner'
import { ToastContainer, useToasts } from '../../components/zalo-bot/Toast'
import type { BotStatus } from '@/lib/zalo/types'

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export function ZaloBotClient() {
  const [status, setStatus] = useState<BotStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
    refresh()
    const interval = setInterval(refresh, status?.state === 'CONNECTING' ? 2000 : 10000)
    return () => clearInterval(interval)
  }, [refresh, status?.state])

  // Show toast when state changes
  const prevState = status?.state
  useEffect(() => {
    if (prevState === 'CONNECTED') {
      showToast('success', 'Đã kết nối Zalo Bot!')
    } else if (prevState === 'EXPIRED') {
      showToast('error', 'Bot hết hạn', {
        description: 'Cần quét QR lại để tiếp tục.',
        autoHideMs: 0,
      })
    }
  }, [prevState, showToast])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
          <p className="text-sm text-ink-muted-48">Đang tải trạng thái bot...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={refresh}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!status) return null

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Status Banner — always visible */}
      <StatusBanner status={status} />

      {/* Setup + Group selection: 2-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SetupCard status={status} onUpdate={refresh} showToast={showToast} />
        <StatusCard status={status} onUpdate={refresh} showToast={showToast} />
      </div>

      {/* Compose + Auto-send: full-width */}
      <ComposeCard status={status} onUpdate={refresh} showToast={showToast} />
      <AutoSendCard onUpdate={refresh} showToast={showToast} />
    </>
  )
}
