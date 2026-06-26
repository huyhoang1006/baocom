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
  mode?: 'auto' | 'today' | 'manual'
  manualDate?: string | null
}

interface TargetDatePreview {
  targetDate: string
  targetDayName: string
}

type SendMode = 'auto' | 'today' | 'manual'

const SEND_MODES: Array<{ value: SendMode; label: string; description: string }> = [
  { value: 'auto', label: 'Tự động theo rule cutoff', description: 'Luôn gửi workday kế tiếp (T2 sáng → T3). Bỏ T7/CN.' },
  { value: 'today', label: 'Luôn gửi ngày hiện tại', description: 'Nếu rơi T7/CN → gửi T2 tuần sau.' },
  { value: 'manual', label: 'Chọn ngày thủ công', description: 'Admin tự đặt ngày cụ thể (có thể là T7/CN).' },
]

function toDateInputValue(d: Date | null | undefined): string {
  if (!d) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
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
  const parts = cron.split(' ')
  if (parts.length < 5) return ''
  const hour = parseInt(parts[1]) || 8
  const minute = parseInt(parts[0]) || 0
  const dow = parts[4] || '*'

  const now = new Date()
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  if (dow === '1-5') {
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

export function ScheduleTab({ onUpdate, showToast }: Props) {
  const [cfg, setCfg] = useState<AutoSendConfig | null>(null)
  const [preset, setPreset] = useState<CronPreset>('weekday-8am')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [busy, setBusy] = useState(false)
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [mode, setMode] = useState<SendMode>('auto')
  const [manualDate, setManualDate] = useState<string>('')
  const [targetPreview, setTargetPreview] = useState<TargetDatePreview | null>(null)

  async function load() {
    const res = await fetch('/api/zalo/config', { credentials: 'include' })
    if (res.ok) {
      const body = await res.json()
      const c: AutoSendConfig = {
        enabled: body.autoSendEnabled,
        cron: body.cron,
        template: body.template,
        groupId: body.groupId,
        mode: body.mode,
        manualDate: body.manualDate,
      }
      setCfg(c)
      setPreset(detectPreset(c.cron))
      if (c.cron === CRON_PRESETS.find((p) => p.value === 'custom')?.expr) {
        setShowAdvanced(true)
      }
      if (body.mode) setMode(body.mode)
      if (body.manualDate) setManualDate(toDateInputValue(new Date(body.manualDate)))
    }
  }

  async function loadTargetPreview(currentMode: SendMode, currentManual: string) {
    try {
      const res = await fetch('/api/zalo/auto-send', { credentials: 'include' })
      if (res.ok) {
        const body = await res.json()
        if (body.targetDate && body.targetDayName) {
          setTargetPreview({ targetDate: body.targetDate, targetDayName: body.targetDayName })
        }
      }
      void currentMode
      void currentManual
    } catch {
      // ignore — preview optional
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(id)
  }, [])

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
    if (!cfg) return
    try {
      const res = await fetch('/api/zalo/auto-send?preview=true', { credentials: 'include' })
      const body = await res.json().catch(() => ({} as { preview?: string; error?: string }))
      if (res.ok && typeof body.preview === 'string') {
        setPreviewText(body.preview)
      } else {
        const reason =
          (typeof body.error === 'string' && body.error) ||
          (res.ok ? 'Response thiếu field preview' : `HTTP ${res.status}`)
        showToast('error', 'Lỗi tải preview', { description: reason })
        setPreviewText('(Lỗi tải preview)')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi mạng'
      showToast('error', 'Lỗi tải preview', { description: msg })
      setPreviewText('(Lỗi tải preview)')
    }
  }

  useEffect(() => {
    if (!cfg) return undefined
    const id = setTimeout(() => { void loadPreview() }, 0)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.template])

  useEffect(() => {
    if (!cfg?.enabled) {
      setTargetPreview(null)
      return undefined
    }
    const id = setTimeout(() => { void loadTargetPreview(mode, manualDate) }, 0)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.enabled, mode, manualDate])

  if (!cfg) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        <span className="text-sm text-ink-muted-48">Đang tải cấu hình...</span>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">⏰ Lịch tự động gửi &quot;báo cơm&quot;</h3>

      <label className="flex items-center gap-3 mb-4 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={cfg.enabled}
            onChange={(e) => patch({ autoSendEnabled: e.target.checked })}
            disabled={busy}
            className="sr-only peer"
            aria-label="Bật gửi tự động"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-primary transition-colors" />
          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
        </div>
        <span className="text-sm font-medium">Bật gửi tự động</span>
      </label>

      {!cfg.enabled ? (
        <div className="text-center py-8 border-t border-hairline">
          <div className="text-4xl mb-3">⏸️</div>
          <p className="text-sm text-ink-muted-48 mb-1">Auto-send đang tắt</p>
          <p className="text-xs text-ink-muted-48">
            Tin nhắn sẽ chỉ gửi khi bạn bấm &quot;Gửi thử ngay&quot; bên dưới.
          </p>
        </div>
      ) : (
        <div className="border-t border-hairline pt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">🎯 Phương thức chọn ngày</label>
            <div className="space-y-2">
              {SEND_MODES.map((m) => (
                <label
                  key={m.value}
                  className="flex items-start gap-2 cursor-pointer p-2 border border-hairline rounded-md hover:bg-canvas"
                >
                  <input
                    type="radio"
                    name="sendMode"
                    value={m.value}
                    checked={mode === m.value}
                    onChange={() => setMode(m.value)}
                    disabled={busy}
                    className="mt-0.5"
                    aria-label={m.label}
                  />
                  <div>
                    <div className="text-sm font-medium">{m.label}</div>
                    <div className="text-xs text-ink-muted-48">{m.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {mode === 'manual' && (
              <div className="mt-2">
                <label className="block text-xs text-ink-muted-48 mb-1">Ngày gửi cụ thể</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  onBlur={() => {
                    if (!manualDate) return
                    patch({ manualDate: new Date(manualDate).toISOString() })
                  }}
                  disabled={busy}
                  className="w-full px-3 py-2 border border-hairline rounded-md text-sm bg-white"
                />
                {manualDate && isWeekend(new Date(manualDate)) && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Đã chọn ngày T7/CN — tin nhắn sẽ gửi cho ngày này (admin quyết định).
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => {
                const body: Record<string, unknown> = { mode }
                if (mode === 'manual' && manualDate) {
                  body.manualDate = new Date(manualDate).toISOString()
                } else if (mode === 'manual' && !manualDate) {
                  showToast('error', 'Chọn ngày trước khi lưu')
                  return
                }
                patch(body)
              }}
              disabled={busy}
              className="mt-2 px-3 py-1.5 text-sm border border-hairline rounded-md hover:bg-canvas disabled:opacity-50"
            >
              💾 Lưu phương thức chọn ngày
            </button>

            {targetPreview && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span>📅</span>
                <span>
                  Ngày sẽ gửi tiếp:{' '}
                  <strong>
                    {targetPreview.targetDate} ({targetPreview.targetDayName})
                  </strong>
                </span>
              </div>
            )}
          </div>

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
            <div className="text-xs text-ink-muted-48 mt-1 space-y-1">
              <p className="font-medium text-ink-muted-80">Sử dụng các placeholder:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li><code className="bg-gray-100 px-1 rounded">{'{date}'}</code> — Ngày hiện tại (dd/mm/yyyy)</li>
                <li><code className="bg-gray-100 px-1 rounded">{'{registrations}'}</code> — Danh sách người ăn theo phòng ban, hiển thị username</li>
                <li><code className="bg-gray-100 px-1 rounded">{'{menu}'}</code> — Thực đơn hôm nay</li>
              </ul>
            </div>
          </div>

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
    </div>
  )
}