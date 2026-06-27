'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useZaloBot } from './ZaloBotContext'

/**
 * Guard: nếu state != CONNECTED → redirect về hub.
 * Trả null trong lúc checking (không flash UI).
 */
export function RequireConnected({ children }: { children: React.ReactNode }) {
  const { status } = useZaloBot()
  const router = useRouter()
  const redirected = useRef(false)

  useEffect(() => {
    if (!status) return
    if (status.state !== 'CONNECTED' && !redirected.current) {
      redirected.current = true
      router.replace('/admin/zalo-bot')
    }
  }, [status, router])

  if (!status || status.state !== 'CONNECTED') return null
  return <>{children}</>
}