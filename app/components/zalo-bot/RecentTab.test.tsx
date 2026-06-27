import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { RecentTab } from './RecentTab'
import { ZaloBotProvider, type SendLogEntry } from '../../admin/zalo-bot/ZaloBotContext'
import type { BotStatus } from '@/lib/zalo/types'

const mockStatus: BotStatus = { state: 'CONNECTED' }

const wrap = (recentEntries: SendLogEntry[], recentLoading = false) =>
  render(
    <ZaloBotProvider
      value={{
        status: mockStatus,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        showToast: vi.fn(),
        sendTick: 0,
        bumpSendTick: vi.fn(),
        recentEntries,
        recentLoading,
        refreshRecent: vi.fn(),
      }}
    >
      <RecentTab />
    </ZaloBotProvider>
  )

describe('RecentTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    wrap([], true)
    expect(screen.getByText(/đang tải lịch sử/i)).toBeInTheDocument()
  })

  it('renders empty state when no entries', async () => {
    wrap([])
    await waitFor(() => {
      expect(screen.getByText(/chưa có lịch sử/i)).toBeInTheDocument()
    })
  })

  it('renders entries with success icon', async () => {
    wrap([
      { timestamp: new Date().toISOString(), kind: 'auto', status: 'success', threadId: '1', preview: 'Báo cơm' },
    ])
    await waitFor(() => {
      expect(screen.getByText(/báo cơm/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/auto-send/i)).toBeInTheDocument()
  })

  it('renders entries with fail icon when failed', async () => {
    wrap([
      { timestamp: new Date().toISOString(), kind: 'manual', status: 'fail', threadId: '1', preview: 'msg', error: 'Bot hết hạn' },
    ])
    await waitFor(() => {
      expect(screen.getByText(/bot hết hạn/i)).toBeInTheDocument()
    })
  })
})