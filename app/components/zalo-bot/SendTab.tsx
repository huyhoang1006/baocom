'use client'

import { useState } from 'react'
import type { BotStatus } from '@/lib/zalo/types'
import type { ToastType } from './Toast'

interface Props {
  status: BotStatus
  onUpdate: () => Promise<void>
  showToast: (type: ToastType, message: string, opts?: { description?: string }) => void
  bumpSendTick?: () => void
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

export function SendTab({ status, onUpdate, showToast, bumpSendTick }: Props) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [lastSend, setLastSend] = useState<{ msgId: string; time: string; threadId?: string; text: string } | null>(null)

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
      const sentText = text
      showToast('success', 'Đã gửi tin nhắn!', { description: `msgId: ${body.msgId}` })
      setLastSend({
        msgId: body.msgId,
        time: new Date().toLocaleString('vi-VN'),
        threadId: body.threadId,
        text: sentText,
      })
      setText('')
      setActiveTemplate(null)
      await onUpdate()
      bumpSendTick?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi'
      showToast('error', 'Gửi thất bại', { description: msg })
    } finally {
      setBusy(false)
    }
  }

  async function copyMsgId() {
    if (!lastSend) return
    try {
      await navigator.clipboard.writeText(lastSend.msgId)
      showToast('success', 'Đã copy msgId')
    } catch {
      showToast('error', 'Không copy được')
    }
  }

  function resend() {
    if (!lastSend) return
    setText(lastSend.text)
    setActiveTemplate(null)
  }

  function applyTemplate(t: typeof QUICK_TEMPLATES[0]) {
    setActiveTemplate(t.label)
    if (t.template) {
      const today = new Date()
      const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
      setText(t.template.replace('{date}', dateStr).replace('{menu}', '(Chưa có menu hôm nay)'))
    } else {
      setText('')
    }
  }

  const disabled = status.state !== 'CONNECTED' || busy

  return (
    <div>
      <p className="text-sm text-ink-muted-48 mb-3">✏️ Soạn tin nhắn</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập nội dung thông báo cơm cho group..."
        maxLength={2000}
        rows={4}
        className="w-full px-3 py-2 border border-hairline rounded-md text-sm disabled:opacity-50"
        disabled={disabled}
      />

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

      {lastSend && (
        <div
          data-testid="send-feedback"
          className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md"
        >
          <p className="text-sm text-green-800">
            ✅ Đã gửi lúc {lastSend.time}
          </p>
          <p className="text-xs text-green-700 mt-0.5">
            msgId: <code className="bg-green-100 px-1 rounded">{lastSend.msgId}</code>
            {lastSend.threadId ? ` · thread: ${lastSend.threadId}` : ''}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={copyMsgId}
              className="text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-100"
            >
              📋 Copy msgId
            </button>
            <button
              type="button"
              onClick={resend}
              className="text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-100"
            >
              🔄 Gửi lại tin này
            </button>
          </div>
        </div>
      )}

      {text.trim() && (
        <details className="mt-3 text-xs text-ink-muted-48">
          <summary className="cursor-pointer hover:text-ink">👁 Xem trước khi gửi</summary>
          <div className="mt-2 p-2 bg-canvas border border-hairline rounded whitespace-pre-wrap">
            {text}
          </div>
        </details>
      )}
    </div>
  )
}