import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SendTab } from './SendTab'
import type { BotStatus } from '@/lib/zalo/types'

const status: BotStatus = {
  state: 'CONNECTED',
  account: { displayName: 'Test User' },
}

const showToast = vi.fn()

describe('SendTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders textarea with placeholder', () => {
    render(<SendTab status={status} onUpdate={vi.fn()} showToast={showToast} />)
    expect(screen.getByPlaceholderText(/nhập nội dung/i)).toBeInTheDocument()
  })

  it('send button disabled when text is empty', () => {
    render(<SendTab status={status} onUpdate={vi.fn()} showToast={showToast} />)
    const btn = screen.getByRole('button', { name: /gửi/i })
    expect(btn).toBeDisabled()
  })

  it('send button enabled after typing text', () => {
    render(<SendTab status={status} onUpdate={vi.fn()} showToast={showToast} />)
    fireEvent.change(screen.getByPlaceholderText(/nhập nội dung/i), {
      target: { value: 'Hello' },
    })
    const btn = screen.getByRole('button', { name: /gửi/i })
    expect(btn).not.toBeDisabled()
  })

  it('calls POST /api/zalo/send on send click', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ msgId: 'm-123' }),
    })
    ;(globalThis as unknown as { fetch: unknown }).fetch = fetchMock

    render(<SendTab status={status} onUpdate={vi.fn()} showToast={showToast} />)
    fireEvent.change(screen.getByPlaceholderText(/nhập nội dung/i), {
      target: { value: 'Test message' },
    })
    fireEvent.click(screen.getByRole('button', { name: /gửi/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/zalo/send',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ text: 'Test message' }),
        })
      )
    })
  })

  it('shows success toast on successful send', async () => {
    ;(globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ msgId: 'm-456' }),
    })

    render(<SendTab status={status} onUpdate={vi.fn()} showToast={showToast} />)
    fireEvent.change(screen.getByPlaceholderText(/nhập nội dung/i), {
      target: { value: 'Hi' },
    })
    fireEvent.click(screen.getByRole('button', { name: /gửi/i }))

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('success', expect.stringContaining('gửi'), expect.any(Object))
    })
  })

  it('shows error toast on failed send', async () => {
    ;(globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Bot not connected' }),
    })

    render(<SendTab status={status} onUpdate={vi.fn()} showToast={showToast} />)
    fireEvent.change(screen.getByPlaceholderText(/nhập nội dung/i), {
      target: { value: 'Hi' },
    })
    fireEvent.click(screen.getByRole('button', { name: /gửi/i }))

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('error', expect.any(String), expect.any(Object))
    })
  })

  it('disables inputs when not CONNECTED', () => {
    render(
      <SendTab
        status={{ state: 'EXPIRED' }}
        onUpdate={vi.fn()}
        showToast={showToast}
      />
    )
    expect(screen.getByPlaceholderText(/nhập nội dung/i)).toBeDisabled()
  })

  it('character count updates with text length', () => {
    render(<SendTab status={status} onUpdate={vi.fn()} showToast={showToast} />)
    fireEvent.change(screen.getByPlaceholderText(/nhập nội dung/i), {
      target: { value: '12345' },
    })
    expect(screen.getByText('5/2000')).toBeInTheDocument()
  })
})