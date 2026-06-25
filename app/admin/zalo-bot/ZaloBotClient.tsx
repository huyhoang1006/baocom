'use client'

import { useEffect, useState, useCallback } from 'react'
import { SetupCard } from '../../components/zalo-bot/SetupCard'
import { StatusCard } from '../../components/zalo-bot/StatusCard'
import { ComposeCard } from '../../components/zalo-bot/ComposeCard'
import { AutoSendCard } from '../../components/zalo-bot/AutoSendCard'
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

  if (loading) return <div>Đang tải…</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!status) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SetupCard status={status} onUpdate={refresh} />
      <StatusCard status={status} onUpdate={refresh} />
      <ComposeCard status={status} onUpdate={refresh} />
      <AutoSendCard onUpdate={refresh} />
    </div>
  )
}
