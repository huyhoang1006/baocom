'use client'

import { useEffect, useState } from 'react'

interface Props {
  onUpdate: () => Promise<void>
}

interface AutoSendConfig {
  enabled: boolean
  cron: string
  template: string
  groupId: string | null
}

export function AutoSendCard({ onUpdate }: Props) {
  const [cfg, setCfg] = useState<AutoSendConfig | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/zalo/config', { credentials: 'include' })
    if (res.ok) {
      const body = await res.json()
      setCfg({
        enabled: body.autoSendEnabled,
        cron: body.cron,
        template: body.template,
        groupId: body.groupId,
      })
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/zalo/config', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Lỗi')
      }
      await load()
      // Restart cron to pick up new expression
      await fetch('/api/zalo/auto-send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ restart: true }),
      })
      setMessage('Đã lưu')
      await onUpdate()
    } catch (err) {
      setMessage(err instanceof Error ? `Lỗi: ${err.message}` : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  async function runNow() {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/zalo/auto-send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ runNow: true }),
      })
      const body = await res.json()
      if (body.ok) setMessage(`Đã gửi lúc ${body.sentAt}`)
      else setMessage(`Không gửi: ${body.reason ?? 'lỗi không rõ'}`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  if (!cfg) return <section className="bg-white rounded-lg border border-hairline p-5">Đang tải config…</section>

  return (
    <section className="bg-white rounded-lg border border-hairline p-5">
      <h2 className="font-semibold text-lg mb-3">4. Auto-send</h2>

      <label className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={cfg.enabled}
          onChange={(e) => patch({ autoSendEnabled: e.target.checked })}
          disabled={busy}
        />
        <span className="text-sm">Bật gửi tự động</span>
      </label>

      <label className="block text-xs text-ink-muted-48 mb-1">Cron expression</label>
      <input
        type="text"
        value={cfg.cron}
        onChange={(e) => setCfg({ ...cfg, cron: e.target.value })}
        onBlur={() => cfg.cron && patch({ cron: cfg.cron })}
        disabled={busy}
        className="w-full px-3 py-2 border border-hairline rounded-md text-sm font-mono mb-3"
      />

      <label className="block text-xs text-ink-muted-48 mb-1">Template</label>
      <textarea
        value={cfg.template}
        onChange={(e) => setCfg({ ...cfg, template: e.target.value })}
        onBlur={() => cfg.template && patch({ template: cfg.template })}
        maxLength={2000}
        rows={3}
        disabled={busy}
        className="w-full px-3 py-2 border border-hairline rounded-md text-sm mb-3"
      />
      <p className="text-xs text-ink-muted-48 mb-3">
        Sử dụng <code>{'{date}'}</code> và <code>{'{menu}'}</code> làm placeholder.
      </p>

      <button
        onClick={runNow}
        disabled={busy || !cfg.groupId}
        className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
      >
        Gửi ngay (test)
      </button>

      {message && <p className="text-sm mt-2">{message}</p>}
    </section>
  )
}
