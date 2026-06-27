import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StatusBar } from './StatusBar'
import type { BotStatus } from '@/lib/zalo/types'

const baseStatus = (overrides: Partial<BotStatus> = {}): BotStatus => ({
  state: 'DISCONNECTED',
  ...overrides,
})

describe('StatusBar', () => {
  it('renders without crashing for DISCONNECTED state', () => {
    render(<StatusBar status={baseStatus({ state: 'DISCONNECTED' })} onLogout={vi.fn()} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows "Bot chưa kết nối" when DISCONNECTED', () => {
    render(<StatusBar status={baseStatus({ state: 'DISCONNECTED' })} onLogout={vi.fn()} />)
    expect(screen.getByText(/chưa kết nối/i)).toBeInTheDocument()
  })

  it('shows "Đang kết nối" when CONNECTING', () => {
    render(<StatusBar status={baseStatus({ state: 'CONNECTING' })} onLogout={vi.fn()} />)
    expect(screen.getByText(/đang kết nối/i)).toBeInTheDocument()
  })

  it('shows account displayName when CONNECTED', () => {
    render(
      <StatusBar
        status={baseStatus({
          state: 'CONNECTED',
          account: { displayName: 'Nguyễn Văn A' },
          lastConnectedAt: new Date().toISOString(),
        })}
        onLogout={vi.fn()}
      />
    )
    expect(screen.getByText(/Nguyễn Văn A/)).toBeInTheDocument()
  })

  it('shows "Bot hết hạn" when EXPIRED', () => {
    render(
      <StatusBar
        status={baseStatus({
          state: 'EXPIRED',
          lastError: { kind: 'expired', message: 'Session expired', at: new Date().toISOString() },
        })}
        onLogout={vi.fn()}
      />
    )
    expect(screen.getByText(/hết hạn/i)).toBeInTheDocument()
  })

  it('shows logout button when CONNECTED', () => {
    render(
      <StatusBar
        status={baseStatus({ state: 'CONNECTED', account: { displayName: 'Test' } })}
        onLogout={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /đăng xuất|logout/i })).toBeInTheDocument()
  })

  it('does NOT show logout button when DISCONNECTED', () => {
    render(<StatusBar status={baseStatus({ state: 'DISCONNECTED' })} onLogout={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /đăng xuất|logout/i })).not.toBeInTheDocument()
  })

  it('calls onLogout when logout button clicked', () => {
    const onLogout = vi.fn()
    render(
      <StatusBar
        status={baseStatus({ state: 'CONNECTED', account: { displayName: 'Test' } })}
        onLogout={onLogout}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /đăng xuất|logout/i }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('has sticky positioning classes', () => {
    const { container } = render(
      <StatusBar status={baseStatus({ state: 'CONNECTED' })} onLogout={vi.fn()} />
    )
    const bar = container.firstChild as HTMLElement
    expect(bar.className).toMatch(/sticky/)
    expect(bar.className).toMatch(/top-0/)
  })

  it('formats lastConnectedAt as relative time when CONNECTED', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    render(
      <StatusBar
        status={baseStatus({
          state: 'CONNECTED',
          account: { displayName: 'Test' },
          lastConnectedAt: fiveMinutesAgo,
        })}
        onLogout={vi.fn()}
      />
    )
    // Expect either "5 phút trước" or "vừa xong" depending on exact timing
    const text = screen.getByText(/trước|vừa/i)
    expect(text).toBeInTheDocument()
  })
})