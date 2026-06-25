'use client'

import { useState } from 'react'
import type { BotStatus } from '@/lib/zalo/types'
import type { ToastType } from './Toast'

interface Props {
  status: BotStatus
  onUpdate: () => Promise<void>
  showToast: (type: ToastType, message: string, opts?: { description?: string }) => void
}

const QUICK_TEMPLATES = [
  {
    label: '🍱 Menu hôm nay',
    template: '🍱 Báo cơm {date}\n{menu}',
    description: 'Gửi menu bữa trưa hôm nay',
  },
  {
    label: '⚠️ Ngày nghỉ',
    template: '⚠️ Thông báo: Ngày mai ({date}) công ty nghỉ. Chúc mọi người cuối tuần vui vẻ!',
    description: 'Thông báo ngày nghỉ',
  },
  {
    label: '✏️ Tùy chỉnh',
    template: '',
    description: 'Tự soạn nội dung',
  },
]

export function ComposeCard({ status, onUpdate, showToast }: Props) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [lastSend, setLastSend] = useState<{ msgId: string; time: string } | null>(null)

  async function send() {
    if (!text.trim()) return
    setBusy(true)
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
      showToast('success', 'Đã gửi tin nhắn!', { description: `msgId: ${body.msgId}` })
      setLastSend({ msgId: body.msgId, time: new Date().toLocaleString('vi-VN') })
      setText('')
      setActiveTemplate(null)
      await onUpdate()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi'
      showToast('error', 'Gửi thất bại', { description: msg })
    } finally {
      setBusy(false)
    }
  }

  function applyTemplate(t: typeof QUICK_TEMPLATES[0]) {
    setActiveTemplate(t.label)
    if (t.template) {
      // Replace {date} with today
      const today = new Date()
      const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
      setText(t.template.replace('{date}', dateStr).replace('{menu}', '(Chưa có menu hôm nay)'))
    } else {
      setText('')
    }
  }

  const disabled = status.state !== 'CONNECTED' || busy

  return (
    <section className="bg-white rounded-lg border border-hairline p-5">
      <h2 className="font-semibold text-lg mb-3">3. Gửi thử</h2>

      <p className="text-sm text-ink-muted-48 mb-3">
        ✏️ Soạn tin nhắn
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập nội dung thông báo cơm cho group..."
        maxLength={2000}
        rows={4}
        className="w-full px-3 py-2 border border-hairline rounded-md text-sm"
        disabled={disabled}
      />

      {/* Quick templates */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {QUICK_TEMPLATES.map((t) => (
          <button
            key={t.label}
            onClick={() => applyTemplate(t)}
            disabled={disabled}
            className={`px-3 py-1.5 text-sm rounded-md border transition disabled:opacity-50 ${
              activeTemplate === t.label
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-hairline hover:bg-canvas'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-ink-muted-48 mt-2">
        💡 Mẹo: Gửi thử trước khi bật auto-send để kiểm tra message hiển thị đúng trên Zalo
      </p>

      {/* Send bar */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-hairline">
        <span className="text-xs text-ink-muted-48">{text.length}/2000</span>
        <button
          onClick={send}
          disabled={disabled || !text.trim()}
          className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50 flex items-center gap-2"
        >
          {busy ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Đang gửi…
            </>
          ) : (
            <>📤 Gửi</>
          )}
        </button>
      </div>

      {/* Last send */}
      {lastSend && (
        <p className="text-xs text-ink-muted-48 mt-2">
          📝 Lần gửi gần nhất: {lastSend.time} (msgId: {lastSend.msgId})
        </p>
      )}
    </section>
  )
}
