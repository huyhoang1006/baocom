'use client'

import { useEffect, useState } from 'react'
import type { BotStatus } from '@/lib/zalo/types'
import type { ToastType } from './Toast'
import { GroupPicker } from './GroupPicker'
import { MiniHistory } from './MiniHistory'
import { StatCard } from './StatCard'

interface StatsResponse {
  totalSent: number
  success: number
  failed: number
  recentErrors: number
  nextFireAt: string | null
}

interface DashboardTabProps {
  status: BotStatus
  onUpdate: () => Promise<void>
  showToast: (type: ToastType, message: string, opts?: { description?: string }) => void
}

function formatNextFire(iso: string | null): string {
  if (!iso) return '—'
  const target = new Date(iso)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  if (diffMs < 0) return 'đang chờ'
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return `${minutes} phút`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ`
  const days = Math.floor(hours / 24)
  return `${days} ngày`
}

export function DashboardTab({ status, onUpdate, showToast }: DashboardTabProps) {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/zalo/stats', { credentials: 'include' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body = (await res.json()) as StatsResponse
        if (!cancelled) {
          setStats(body)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Lỗi tải stats')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-4" data-testid="dashboard-tab">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          ⚠️ Không tải được stats: {error}
        </div>
      )}

      <section
        aria-label="Thống kê"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard
          icon="📤"
          label="Tổng đã gửi"
          value={stats?.totalSent ?? 0}
          tone="blue"
          loading={loading}
        />
        <StatCard
          icon="✅"
          label="Thành công"
          value={stats?.success ?? 0}
          tone="green"
          loading={loading}
        />
        <StatCard
          icon="❌"
          label="Lỗi 7 ngày"
          value={stats?.recentErrors ?? 0}
          tone={stats && stats.recentErrors > 0 ? 'red' : 'neutral'}
          loading={loading}
        />
        <StatCard
          icon="⏰"
          label="Lần gửi tiếp"
          value={formatNextFire(stats?.nextFireAt ?? null)}
          tone="amber"
          loading={loading}
        />
      </section>

      <GroupPicker status={status} onUpdate={onUpdate} showToast={showToast} />

      <div className="border-t border-hairline pt-2">
        <MiniHistory />
      </div>
    </div>
  )
}