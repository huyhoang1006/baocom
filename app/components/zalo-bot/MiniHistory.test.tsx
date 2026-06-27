import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MiniHistory } from './MiniHistory'
import { ZaloBotProvider, type SendLogEntry } from '../../admin/zalo-bot/ZaloBotContext'
import type { BotStatus } from '@/lib/zalo/types'

const mockStatus: BotStatus = { state: 'CONNECTED' }

const wrap = (recentEntries: SendLogEntry[]) =>
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
        recentLoading: false,
        refreshRecent: vi.fn(),
      }}
    >
      <MiniHistory />
    </ZaloBotProvider>
  )

describe('MiniHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no entries', () => {
    const { container } = wrap([])
    expect(container.firstChild).toBeNull()
  })

  it('renders last send with success icon', () => {
    wrap([
      { timestamp: new Date().toISOString(), kind: 'auto', status: 'success', threadId: '1', preview: 'Báo cơm' },
    ])
    expect(screen.getByText(/lần gửi gần nhất/i)).toBeInTheDocument()
    expect(screen.getByText(/✅/)).toBeInTheDocument()
  })

  it('renders last send with fail icon when failed', () => {
    wrap([
      { timestamp: new Date().toISOString(), kind: 'manual', status: 'fail', threadId: '1', preview: 'msg' },
    ])
    expect(screen.getByText(/❌/)).toBeInTheDocument()
  })
})