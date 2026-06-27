'use client'

import { useMemo, useState } from 'react'

type RepeatMode = 'week' | 'day' | 'month'

interface CronBuilderProps {
  value: string
  onChange: (cron: string) => void
  disabled?: boolean
}

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0] as const

function parseCron(cron: string): { mode: RepeatMode; hour: number; minute: number; days: Set<number> } {
  const parts = cron.trim().split(/\s+/)
  const minute = parseInt(parts[0] ?? '0', 10)
  const hour = parseInt(parts[1] ?? '8', 10)
  const dom = parts[2] ?? '*'
  const dow = parts[4] ?? '*'

  if (dom === '*' && dow !== '*') {
    return { mode: 'week', hour, minute, days: parseDow(dow) }
  }
  if (dow === '*' && dom !== '*') {
    return { mode: 'month', hour, minute, days: new Set([parseInt(dom, 10) || 1]) }
  }
  // day mode: mọi ngày
  return { mode: 'day', hour, minute, days: new Set([...ALL_DAYS]) }
}

function parseDow(dow: string): Set<number> {
  const out = new Set<number>()
  if (dow === '*') return new Set([...ALL_DAYS])
  if (dow.includes('-')) {
    const [lo, hi] = dow.split('-').map((n) => parseInt(n, 10))
    if (!Number.isNaN(lo) && !Number.isNaN(hi)) {
      for (let d = lo; d <= hi; d++) out.add(d)
    }
  } else if (dow.includes(',')) {
    for (const p of dow.split(',')) {
      const n = parseInt(p, 10)
      if (!Number.isNaN(n)) out.add(n)
    }
  } else {
    const n = parseInt(dow, 10)
    if (!Number.isNaN(n)) out.add(n)
  }
  return out
}

function buildCron(mode: RepeatMode, hour: number, minute: number, days: Set<number>): string {
  const h = String(hour).padStart(2, '0')
  const m = String(minute).padStart(2, '0')
  if (mode === 'day') return `${m} ${h} * * *`
  if (mode === 'month') {
    const dom = days.size > 0 ? Math.min(31, Math.max(1, [...days][0])) : 1
    return `${m} ${h} ${dom} * *`
  }
  // week
  if (days.size === 0) return `${m} ${h} * * 1-5`
  const sorted = [...days].sort((a, b) => a - b)
  return `${m} ${h} * * ${sorted.join(',')}`
}

function getHumanCron(cron: string): string {
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5) return cron
  const minute = parseInt(parts[0], 10)
  const hour = parseInt(parts[1], 10)
  const dow = parts[4]
  if (dow === '1-5') return `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')} hàng ngày T2-T6`
  if (dow === '*') return `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')} mỗi ngày`
  return cron
}

export function CronBuilder({ value, onChange, disabled }: CronBuilderProps) {
  const parsed = useMemo(() => parseCron(value), [value])
  const [mode, setMode] = useState<RepeatMode>(parsed.mode)
  const [hour, setHour] = useState(parsed.hour)
  const [minute, setMinute] = useState(parsed.minute)
  const [days, setDays] = useState<Set<number>>(parsed.days)

  const cron = useMemo(() => buildCron(mode, hour, minute, days), [mode, hour, minute, days])

  function commit(next: { mode?: RepeatMode; hour?: number; minute?: number; days?: Set<number> }) {
    const m = next.mode ?? mode
    const h = next.hour ?? hour
    const mi = next.minute ?? minute
    const d = next.days ?? days
    onChange(buildCron(m, h, mi, d))
  }

  function toggleDay(d: number) {
    const next = new Set(days)
    if (next.has(d)) next.delete(d)
    else next.add(d)
    setDays(next)
    commit({ days: next })
  }

  function setModeAndCommit(m: RepeatMode) {
    setMode(m)
    if (m === 'day') {
      commit({ mode: m, days: new Set([...ALL_DAYS]) })
    } else if (m === 'month') {
      commit({ mode: m, days: new Set([1]) })
    } else {
      commit({ mode: m, days: new Set([1, 2, 3, 4, 5]) })
    }
  }

  return (
    <div data-testid="cron-builder" className="space-y-3 p-3 border border-hairline rounded-md bg-canvas">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium">Lặp lại:</span>
        {(['week', 'day', 'month'] as RepeatMode[]).map((m) => (
          <label key={m} className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="repeatMode"
              checked={mode === m}
              onChange={() => setModeAndCommit(m)}
              disabled={disabled}
            />
            <span>{m === 'week' ? 'Hàng tuần' : m === 'day' ? 'Hàng ngày' : 'Hàng tháng'}</span>
          </label>
        ))}
      </div>

      {mode === 'week' && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Thứ:</span>
          {ALL_DAYS.map((d) => (
            <label key={d} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={days.has(d)}
                onChange={() => toggleDay(d)}
                disabled={disabled}
              />
              <span>{DAY_NAMES[d]}</span>
            </label>
          ))}
        </div>
      )}

      {mode === 'month' && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Ngày trong tháng:</span>
          <select
            value={days.size > 0 ? Math.min(31, Math.max(1, [...days][0])) : 1}
            onChange={(e) => {
              const next = new Set([parseInt(e.target.value, 10)])
              setDays(next)
              commit({ days: next })
            }}
            disabled={disabled}
            className="px-2 py-1 border border-hairline rounded text-sm bg-white"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Vào lúc:</span>
        <select
          value={hour}
          onChange={(e) => {
            const h = parseInt(e.target.value, 10)
            setHour(h)
            commit({ hour: h })
          }}
          disabled={disabled}
          className="px-2 py-1 border border-hairline rounded text-sm bg-white"
        >
          {Array.from({ length: 24 }, (_, i) => i).map((h) => (
            <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
          ))}
        </select>
        <span>giờ</span>
        <select
          value={minute}
          onChange={(e) => {
            const m = parseInt(e.target.value, 10)
            setMinute(m)
            commit({ minute: m })
          }}
          disabled={disabled}
          className="px-2 py-1 border border-hairline rounded text-sm bg-white"
        >
          {[0, 15, 30, 45].map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
        <span>phút</span>
      </div>

      <div className="text-xs text-ink-muted-48">
        Cron: <code className="bg-white px-1 rounded border border-hairline">{cron}</code>
        {' · '}
        {getHumanCron(cron)}
      </div>
    </div>
  )
}