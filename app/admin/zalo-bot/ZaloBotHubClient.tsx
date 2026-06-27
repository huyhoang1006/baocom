'use client'

import Link from 'next/link'
import { useZaloBot } from './ZaloBotContext'
import { SetupCard } from '../../components/zalo-bot/SetupCard'
import { DashboardTab } from '../../components/zalo-bot/DashboardTab'

export function ZaloBotHubClient() {
  const { status, refresh, showToast } = useZaloBot()

  // Loading + error đã handle ở ZaloBotLayoutClient, chỉ tới đây khi đã có status hoặc đang loading.
  if (!status) return null

  if (status.state !== 'CONNECTED') {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold">Zalo Bot</h1>
          <p className="text-sm text-ink-muted-48 mt-1">
            Kết nối tài khoản Zalo để gửi thông báo &quot;báo cơm&quot; vào group nội bộ.
          </p>
        </header>
        <SetupCard status={status} onUpdate={refresh} showToast={showToast} />
        <QuickActions />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Zalo Bot</h1>
        <p className="text-sm text-ink-muted-48 mt-1">
          Kết nối tài khoản Zalo để gửi thông báo &quot;báo cơm&quot; vào group nội bộ.
        </p>
      </header>

      <DashboardTab status={status} onUpdate={refresh} showToast={showToast} />

      <QuickActions />
    </div>
  )
}

function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <QuickAction href="/admin/zalo-bot/send" icon="📤" title="Gửi ngay" desc="Soạn và gửi thông báo thủ công" />
      <QuickAction href="/admin/zalo-bot/schedule" icon="⏰" title="Hẹn giờ" desc="Cấu hình auto-send theo cron + preview" />
      <QuickAction href="/admin/zalo-bot/history" icon="📜" title="Lịch sử" desc="Xem các lần gửi gần nhất" />
    </div>
  )
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      data-testid={`hub-quick-${href.split('/').pop()}`}
      className="block bg-white rounded-lg border border-hairline p-5 hover:border-primary hover:shadow-sm transition"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-xs text-ink-muted-48">{desc}</p>
    </Link>
  )
}