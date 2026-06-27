import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/zalo-bot/send',
  useSearchParams: () => new URLSearchParams('tab=send'),
  useRouter: () => ({ replace: vi.fn() }),
}))

vi.mock('../../components/zalo-bot/StatusBar', () => ({
  StatusBar: ({ status }: { status: { state: string } }) => (
    <div data-testid="status-bar">StatusBar: {status.state}</div>
  ),
}))
vi.mock('../../components/zalo-bot/SetupCard', () => ({
  SetupCard: () => <div data-testid="setup-card">SetupCard</div>,
}))
vi.mock('../../components/zalo-bot/GroupPicker', () => ({
  GroupPicker: () => <div data-testid="group-picker">GroupPicker</div>,
}))
vi.mock('../../components/zalo-bot/Toast', () => ({
  ToastContainer: () => null,
  useToasts: () => ({ toasts: [], showToast: vi.fn(), dismiss: vi.fn() }),
}))

import { ZaloBotLayoutClient } from './ZaloBotLayoutClient'

const mockFetch = (state: string) => {
  ;(globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ state, lastConnectedAt: new Date().toISOString() }),
  })
}

function PageProbe() {
  return <div data-testid="child-page">child content</div>
}

describe('ZaloBotLayoutClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows StatusBar when status fetched', async () => {
    mockFetch('CONNECTED')
    render(
      <ZaloBotLayoutClient>
        <PageProbe />
      </ZaloBotLayoutClient>
    )
    await waitFor(() => {
      expect(screen.getByTestId('status-bar')).toBeInTheDocument()
    })
  })

  it('hides nav when state=DISCONNECTED', async () => {
    mockFetch('DISCONNECTED')
    render(
      <ZaloBotLayoutClient>
        <PageProbe />
      </ZaloBotLayoutClient>
    )
    await waitFor(() => {
      expect(screen.getByTestId('status-bar')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('zalo-nav-send')).not.toBeInTheDocument()
  })

  it('shows nav with 3 links when CONNECTED', async () => {
    mockFetch('CONNECTED')
    render(
      <ZaloBotLayoutClient>
        <PageProbe />
      </ZaloBotLayoutClient>
    )
    await waitFor(() => {
      expect(screen.getByTestId('zalo-nav-send')).toBeInTheDocument()
    })
    expect(screen.getByTestId('zalo-nav-schedule')).toBeInTheDocument()
    expect(screen.getByTestId('zalo-nav-history')).toBeInTheDocument()
  })

  it('renders children when status loaded', async () => {
    mockFetch('CONNECTED')
    render(
      <ZaloBotLayoutClient>
        <PageProbe />
      </ZaloBotLayoutClient>
    )
    await waitFor(() => {
      expect(screen.getByTestId('child-page')).toBeInTheDocument()
    })
  })

  it('hides children while loading', () => {
    ;(globalThis as unknown as { fetch: unknown }).fetch = vi.fn(() => new Promise(() => {}))
    render(
      <ZaloBotLayoutClient>
        <PageProbe />
      </ZaloBotLayoutClient>
    )
    expect(screen.queryByTestId('child-page')).not.toBeInTheDocument()
  })

  it('renders nav links pointing to sub-routes', async () => {
    mockFetch('CONNECTED')
    render(
      <ZaloBotLayoutClient>
        <PageProbe />
      </ZaloBotLayoutClient>
    )
    await waitFor(() => {
      expect(screen.getByTestId('zalo-nav-send')).toBeInTheDocument()
    })
    expect(screen.getByTestId('zalo-nav-send').getAttribute('href')).toBe('/admin/zalo-bot?tab=send')
    expect(screen.getByTestId('zalo-nav-schedule').getAttribute('href')).toBe('/admin/zalo-bot?tab=schedule')
    expect(screen.getByTestId('zalo-nav-history').getAttribute('href')).toBe('/admin/zalo-bot?tab=history')
    expect(screen.getByTestId('zalo-nav-dashboard').getAttribute('href')).toBe('/admin/zalo-bot?tab=dashboard')
  })
})