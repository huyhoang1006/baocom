'use client'

import { useEffect, useState } from 'react'
import type { ToastType } from './Toast'

interface Props {
  onUpdate: () => Promise<void>
  showToast: (type: ToastType, message: string, opts?: { description?: string }) => void
}

interface AutoSendConfig {
  enabled: boolean
  cron: string
  template: string
  groupId: string | null
}

type CronPreset = 'weekday-8am' | 'weekday-5pm' | 'monday-8am' | 'custom'

const CRON_PRESETS: Array<{ value: CronPreset; label: string; expr: string; human: string }> = [
  { value: 'weekday-8am', label: 'T2-T6 hàng tuần lúc 8:00 sáng', expr: '0 8 * * 1-5', human: '8h sáng T2-T6' },
  { value: 'weekday-5pm', label: 'T2-T6 hàng tuần lúc 17:00 chiều', expr: '0 17 * * 1-5', human: '17h chiều T2-T6' },
  { value: 'monday-8am', label: 'Mỗi sáng thứ 2 lúc 8:00', expr: '0 8 * * 1', human: '8h sáng thứ 2' },
  { value: 'custom', label: '⚙️ Tùy chỉnh nâng cao (cron expression)', expr: '', human: '' },
]

function detectPreset(cron: string): CronPreset {
  for (const p of CRON_PRESETS) {
    if (p.value !== 'custom' && p.expr === cron) return p.value
  }
  return 'custom'
}

function getHumanReadable(cron: string): string {
  for (const p of CRON_PRESETS) {
    if (p.expr === cron) return p.human
  }
  return cron
}

function formatNextFire(cron: string): string {
  // Parse cron to estimate next fire
  const parts = cron.split(' ')
  if (parts.length < 5) return ''
  const hour = parseInt(parts[1]) || 8
  const minute = parseInt(parts[0]) || 0
  const dow = parts[4] || '*'

  const now = new Date()
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  if (dow === '1-5') {
    // Find next weekday
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() + i)
      if (d.getDay() >= 1 && d.getDay() <= 5) {
        return `${dayNames[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1} lúc ${hour}:${minute.toString().padStart(2, '0')}`
      }
    }
  } else if (dow === '1') {
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() + i)
      if (d.getDay() === 1) {
        return `T2, ${d.getDate()}/${d.getMonth() + 1} lúc ${hour}:${minute.toString().padStart(2, '0')}`
      }
    }
  }
  return `${hour}:${minute.toString().padStart(2, '0')} (theo cron)`
}

export function AutoSendCard({ onUpdate, showToast }: Props) {
  const [cfg, setCfg] = useState<AutoSendConfig | null>(null)
  const [preset, setPreset] = useState<CronPreset>('weekday-8am')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [busy, setBusy] = useState(false)
  const [previewText, setPreviewText] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/zalo/config', { credentials: 'include' })
    if (res.ok) {
      const body = await res.json()
      const c: AutoSendConfig = {
        enabled: body.autoSendEnabled,
        cron: body.cron,
        template: body.template,
        groupId: body.groupId,
      }
      setCfg(c)
      setPreset(detectPreset(c.cron))
      if (c.cron === CRON_PRESETS.find((p) => p.value === 'custom')?.expr) {
        setShowAdvanced(true)
      }
    }
  }

  useEffect(() => { void load() }, [])

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
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
      await fetch('/api/zalo/auto-send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ restart: true }),
      })
      showToast('success', 'Đã lưu cấu hình')
      await onUpdate()
    } catch (err) {
      const msg = err instanceof Error ? `Lỗi: ${err.message}` : 'Lỗi'
      showToast('error', msg)
    } finally {
      setBusy(false)
    }
  }

  async function runNow() {
    setBusy(true)
    try {
      const res = await fetch('/api/zalo/auto-send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ runNow: true }),
      })
      const body = await res.json()
      if (body.ok) {
        showToast('success', 'Đã gửi thử!', { description: `Lúc ${new Date(body.sentAt).toLocaleString('vi-VN')}` })
      } else {
        showToast('error', 'Không gửi được', { description: body.reason ?? 'lỗi không rõ' })
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  async function loadPreview() {
    try {
      const res = await fetch('/api/zalo/auto-send?preview=true', { credentials: 'include' })
      if (res.ok) {
        const body = await res.json()
        setPreviewText(body.preview ?? null)
      }
    } catch {
      // fallback: show template with placeholders
      if (cfg) {
        const today = new Date()
        const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
        setPreviewText(cfg.template.replace('{date}', dateStr).replace('{menu}', '- (Chưa có menu hôm nay)'))
      }
    }
  }

  useEffect(() => {
    if (cfg) loadPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.template])

  if (!cfg) {
    return (
      <section className="bg-white rounded-lg border border-hairline p-5">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          <span className="text-sm text-ink-muted-48">Đang tải cấu hình...</span>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-lg border border-hairline p-5">
      <h2 className="font-semibold text-lg mb-3">⏰ Lịch tự động gửi &quot;báo cơm&quot;</h2>

      {/* Enable toggle */}
      <label className="flex items-center gap-3 mb-4 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={cfg.enabled}
            onChange={(e) => patch({ autoSendEnabled: e.target.checked })}
            disabled={busy}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-primary transition-colors" />
          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
        </div>
        <span className="text-sm font-medium">Bật gửi tự động</span>
      </label>

      {!cfg.enabled ? (
        /* Disabled state */
        <div className="text-center py-8 border-t border-hairline">
          <div className="text-4xl mb-3">⏸️</div>
          <p className="text-sm text-ink-muted-48 mb-1">Auto-send đang tắt</p>
          <p className="text-xs text-ink-muted-48">
            Tin nhắn sẽ chỉ gửi khi bạn bấm &quot;Gửi thử ngay&quot; bên dưới.
          </p>
        </div>
      ) : (
        <div className="border-t border-hairline pt-4 space-y-4">
          {/* Preset dropdown */}
          <div>
            <label className="block text-sm font-medium mb-2">📅 Khi nào gửi?</label>
            <select
              value={preset}
              onChange={(e) => {
                const newPreset = e.target.value as CronPreset
                setPreset(newPreset)
                const found = CRON_PRESETS.find((p) => p.value === newPreset)
                if (found && newPreset !== 'custom') {
                  patch({ cron: found.expr })
                }
                setShowAdvanced(newPreset === 'custom')
              }}
              disabled={busy}
              className="w-full px-3 py-2 border border-hairline rounded-md text-sm bg-white"
            >
              {CRON_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Advanced cron (collapsible) */}
          {showAdvanced && (
            <div className="bg-canvas rounded-md p-3">
              <label className="block text-xs text-ink-muted-48 mb-1">Cron expression</label>
              <input
                type="text"
                value={cfg.cron}
                onChange={(e) => setCfg({ ...cfg, cron: e.target.value })}
                onBlur={() => cfg.cron && patch({ cron: cfg.cron })}
                disabled={busy}
                className="w-full px-3 py-2 border border-hairline rounded-md text-sm font-mono"
                placeholder="0 8 * * 1-5"
              />
              <p className="text-xs text-ink-muted-48 mt-2">
                📝 phút · giờ · ngày · tháng · thứ
                <br />
                Ví dụ: <code className="bg-gray-100 px-1 rounded">0 8 * * 1-5</code> = 8h sáng T2-T6
              </p>
            </div>
          )}

          {/* Next fire time */}
          {cfg.cron && (
            <div className="flex items-center gap-2 text-sm text-ink-muted-80">
              <span>🕐</span>
              <span>
                Lần gửi tiếp: <strong>{getHumanReadable(cfg.cron)}</strong>
                {' → '}
                {formatNextFire(cfg.cron)}
              </span>
            </div>
          )}

          {/* Template */}
          <div className="border-t border-hairline pt-4">
            <label className="block text-sm font-medium mb-2">🍱 Nội dung tin nhắn</label>
            <textarea
              value={cfg.template}
              onChange={(e) => setCfg({ ...cfg, template: e.target.value })}
              onBlur={() => cfg.template && patch({ template: cfg.template })}
              maxLength={2000}
              rows={3}
              disabled={busy}
              className="w-full px-3 py-2 border border-hairline rounded-md text-sm"
            />
            <p className="text-xs text-ink-muted-48 mt-1">
              Sử dụng <code className="bg-gray-100 px-1 rounded">{'{date}'}</code> và <code className="bg-gray-100 px-1 rounded">{'{menu}'}</code> làm placeholder.
            </p>
          </div>

          {/* Preview */}
          <div className="border-t border-hairline pt-4">
            <label className="block text-sm font-medium mb-2">👁 Xem trước</label>
            <div className="bg-canvas rounded-md p-3 text-sm whitespace-pre-wrap border border-hairline">
              {previewText ?? 'Đang tải preview...'}
            </div>
            <button
              onClick={loadPreview}
              className="text-xs text-primary hover:underline mt-2"
            >
              🔄 Cập nhật preview
            </button>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="border-t border-hairline pt-4 mt-4 flex items-center justify-between">
        <button
          onClick={runNow}
          disabled={busy || !cfg.groupId}
          className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50 flex items-center gap-2"
        >
          {busy ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Đang gửi…
            </>
          ) : (
            <>📤 Gửi thử ngay</>
          )}
        </button>
        {!cfg.groupId && (
          <span className="text-xs text-orange-600">⚠️ Chưa chọn group đích</span>
        )}
      </div>
    </section>
  )
}
