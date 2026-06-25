'use client'

import { useEffect, useState } from 'react'

type BotState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'EXPIRED'

const DOT_STYLES: Record<BotState, string> = {
  DISCONNECTED: 'bg-gray-400',
  CONNECTING: 'bg-yellow-400 animate-pulse',
  CONNECTED: 'bg-emerald-500',
  EXPIRED: 'bg-red-500',
}

export function ZaloStatusDot() {
  const [state, setState] = useState<BotState>('DISCONNECTED')

  useEffect(() => {
    let mounted = true

    async function check() {
      try {
        const res = await fetch('/api/zalo/status', { credentials: 'include' })
        if (res.ok && mounted) {
          const body = await res.json()
          setState(body.state as BotState)
        }
      } catch {
        // ignore
      }
    }

    check()
    const interval = setInterval(check, 30000) // check every 30s
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${DOT_STYLES[state]}`}
      title={
        state === 'CONNECTED' ? 'Bot kết nối'
        : state === 'CONNECTING' ? 'Đang kết nối...'
        : state === 'EXPIRED' ? 'Bot hết hạn'
        : 'Bot chưa kết nối'
      }
    />
  )
}
