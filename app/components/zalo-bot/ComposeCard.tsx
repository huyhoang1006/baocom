'use client'

import { useState } from 'react'
import type { BotStatus } from '@/lib/zalo/types'

interface Props {
  status: BotStatus
  onUpdate: () => Promise<void>
}

export function ComposeCard({ status, onUpdate }: Props) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    if (!text.trim()) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/zalo/send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const body = await res.json()
      setSuccess(`Đã gửi! msgId: ${body.msgId}`)
      setText('')
      await onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  const disabled = status.state !== 'CONNECTED' || busy

  return (
    <section className="bg-white rounded-lg border border-hairline p-5">
      <h2 className="font-semibold text-lg mb-3">3. Gửi thử</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập nội dung…"
        maxLength={2000}
        rows={4}
        className="w-full px-3 py-2 border border-hairline rounded-md text-sm"
        disabled={disabled}
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-ink-muted-48">{text.length}/2000</span>
        <button
          onClick={send}
          disabled={disabled || !text.trim()}
          className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
        >
          {busy ? 'Đang gửi…' : 'Gửi'}
        </button>
      </div>
      {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </section>
  )
}
