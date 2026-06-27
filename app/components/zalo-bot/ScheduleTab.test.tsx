import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ScheduleTab } from './ScheduleTab'

// Component reads body.autoSendEnabled (not enabled)
const mockConfigResponse: {
  autoSendEnabled: boolean
  cron: string
  template: string
  groupId: string | null
} = {
  autoSendEnabled: false,
  cron: '0 8 * * 1-5',
  template: '🍱 Báo cơm {date}',
  groupId: '123456789',
}

const setupFetch = (configOverrides: Partial<typeof mockConfigResponse> = {}) => {
  const config = { ...mockConfigResponse, ...configOverrides }
  ;(globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockImplementation((url: string) => {
    if (String(url).includes('/api/zalo/config')) {
      return Promise.resolve({ ok: true, json: async () => config })
    }
    if (String(url).includes('/api/zalo/auto-send')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, sentAt: new Date().toISOString() }),
      })
    }
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
}

describe('ScheduleTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    setupFetch()
    render(<ScheduleTab onUpdate={vi.fn()} showToast={vi.fn()} />)
    expect(screen.getByText(/đang tải cấu hình/i)).toBeInTheDocument()
  })

  it('renders enable toggle after loading config', async () => {
    setupFetch()
    render(<ScheduleTab onUpdate={vi.fn()} showToast={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/bật gửi tự động/i)).toBeInTheDocument()
    })
  })

  it('disables schedule section when auto-send off', async () => {
    setupFetch({ autoSendEnabled: false })
    render(<ScheduleTab onUpdate={vi.fn()} showToast={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/auto-send đang tắt/i)).toBeInTheDocument()
    })
  })

  it('shows cron section when enabled', async () => {
    setupFetch({ autoSendEnabled: true })
    render(<ScheduleTab onUpdate={vi.fn()} showToast={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/khi nào gửi/i)).toBeInTheDocument()
    })
  })

  it('toggling autoSend calls PATCH /api/zalo/config', async () => {
    setupFetch({ autoSendEnabled: false })
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    render(<ScheduleTab onUpdate={vi.fn()} showToast={vi.fn()} />)
    await waitFor(() => screen.getByText(/bật gửi tự động/i))

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    await waitFor(() => {
      const patchCalls = fetchMock.mock.calls.filter(
        (c) => String(c[0]).includes('/api/zalo/config') && (c[1] as RequestInit | undefined)?.method === 'PATCH'
      )
      expect(patchCalls.length).toBeGreaterThan(0)
    })
  })

  it('shows error toast when config PATCH fails', async () => {
    ;(globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (String(url).includes('/api/zalo/config') && init?.method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Cron không hợp lệ' }),
        })
      }
      if (String(url).includes('/api/zalo/config')) {
        return Promise.resolve({ ok: true, json: async () => mockConfigResponse })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
    const showToast = vi.fn()
    render(<ScheduleTab onUpdate={vi.fn()} showToast={showToast} />)
    await waitFor(() => screen.getByText(/bật gửi tự động/i))

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('error', expect.stringContaining('Lỗi'))
    })
  })

  it('shows run-now button when groupId is set', async () => {
    setupFetch({ autoSendEnabled: true, groupId: '123456789' })
    render(<ScheduleTab onUpdate={vi.fn()} showToast={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/gửi thử ngay/i)).toBeInTheDocument()
    })
  })

  it('warns when no groupId set', async () => {
    setupFetch({ autoSendEnabled: true, groupId: null })
    render(<ScheduleTab onUpdate={vi.fn()} showToast={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText(/chưa chọn group/i)).toBeInTheDocument()
    })
  })
})