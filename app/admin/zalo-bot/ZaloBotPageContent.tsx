'use client'

import { useSearchParams } from 'next/navigation'
import { useZaloBot } from './ZaloBotContext'
import { RequireConnected } from './RequireConnected'
import { DashboardTab } from '../../components/zalo-bot/DashboardTab'
import { SendTab } from '../../components/zalo-bot/SendTab'
import { ScheduleTab } from '../../components/zalo-bot/ScheduleTab'
import { RecentTab } from '../../components/zalo-bot/RecentTab'

type TabId = 'dashboard' | 'send' | 'schedule' | 'history'

function isTabId(value: string | null): value is TabId {
  return value === 'dashboard' || value === 'send' || value === 'schedule' || value === 'history'
}

export function ZaloBotPageContent() {
  const params = useSearchParams()
  const { status, refresh, showToast, bumpSendTick } = useZaloBot()

  const raw = params.get('tab')
  const activeTab: TabId = isTabId(raw) ? raw : 'dashboard'

  return (
    <RequireConnected>
      {status && (
        <>
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <header>
                <h1 className="text-2xl font-semibold">Zalo Bot</h1>
                <p className="text-sm text-ink-muted-48 mt-1">
                  Kết nối tài khoản Zalo để gửi thông báo &quot;báo cơm&quot; vào group nội bộ.
                </p>
              </header>
              <DashboardTab status={status} onUpdate={refresh} showToast={showToast} />
            </div>
          )}
          {activeTab === 'send' && (
            <div className="space-y-4">
              <header>
                <h1 className="text-2xl font-semibold">📤 Gửi ngay</h1>
                <p className="text-sm text-ink-muted-48 mt-1">Soạn và gửi thông báo thủ công vào group Zalo.</p>
              </header>
              <SendTab status={status} onUpdate={refresh} showToast={showToast} bumpSendTick={bumpSendTick} />
            </div>
          )}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <header>
                <h1 className="text-2xl font-semibold">⏰ Hẹn giờ</h1>
                <p className="text-sm text-ink-muted-48 mt-1">Cấu hình auto-send theo cron + preview.</p>
              </header>
              <ScheduleTab onUpdate={refresh} showToast={showToast} />
            </div>
          )}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <header>
                <h1 className="text-2xl font-semibold">📜 Lịch sử</h1>
                <p className="text-sm text-ink-muted-48 mt-1">Các lần gửi gần nhất (auto + manual).</p>
              </header>
              <RecentTab />
            </div>
          )}
        </>
      )}
    </RequireConnected>
  )
}