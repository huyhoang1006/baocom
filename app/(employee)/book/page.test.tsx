import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import BookPage from './page'

const setStatus = vi.fn(async (dateKey: string, status: 'eating' | 'not-eating') => {
  mockStatuses[dateKey] = status
  return true
})
let mockStatuses: Record<string, 'eating' | 'not-eating'> = {}

vi.mock('@/hooks/useRegistrations', () => ({
  useRegistrations: () => ({
    loading: false,
    error: null,
    setStatus,
    getStatusForDate: (dateKey: string) => mockStatuses[dateKey] || null,
  }),
}))

describe('BookPage weekly cards', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))
    mockStatuses = { '2026-05-12': 'not-eating' }
    setStatus.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders Monday through Friday cards even when today is Friday', () => {
    render(<BookPage />)

    expect(screen.getByTestId('book-day-2026-05-11')).toBeInTheDocument()
    expect(screen.getByTestId('book-day-2026-05-12')).toBeInTheDocument()
    expect(screen.getByTestId('book-day-2026-05-13')).toBeInTheDocument()
    expect(screen.getByTestId('book-day-2026-05-14')).toBeInTheDocument()
    expect(screen.getByTestId('book-day-2026-05-15')).toBeInTheDocument()
    expect(screen.queryByText('Không còn ngày làm việc tương lai trong tuần này.')).not.toBeInTheDocument()
  })

  it('shows locked cards as visible and disabled', () => {
    render(<BookPage />)

    const monday = screen.getByTestId('book-day-2026-05-11')
    expect(within(monday).getByText('Đã khóa')).toBeInTheDocument()
    expect(within(monday).getByRole('button', { name: 'Có ăn' })).toBeDisabled()
    expect(within(monday).getByRole('button', { name: 'Không ăn' })).toBeDisabled()
  })

  it('renders five weekday cards when today is Saturday', () => {
    vi.setSystemTime(new Date('2026-05-16T10:00:00+07:00'))

    render(<BookPage />)

    expect(screen.getAllByTestId(/^book-day-/)).toHaveLength(5)
    expect(screen.getByTestId('book-day-2026-05-15')).toBeInTheDocument()
  })

  it('lets employees change an open future day', () => {
    vi.setSystemTime(new Date('2026-05-11T10:00:00+07:00'))

    render(<BookPage />)

    const wednesday = screen.getByTestId('book-day-2026-05-13')
    fireEvent.click(within(wednesday).getByRole('button', { name: 'Không ăn' }))

    expect(setStatus).toHaveBeenCalledWith('2026-05-13', 'not-eating')
  })

  it('opens on current week with previous disabled', () => {
    vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))

    render(<BookPage />)

    expect(screen.getByText('Tuần 11/05 - 15/05')).toBeInTheDocument()
    expect(screen.getByText('Tuần hiện tại')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '← Tuần trước' })).toBeDisabled()
  })

  it('advances to next week and returns to current week', () => {
    vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))

    render(<BookPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Tuần sau →' }))
    expect(screen.getByText('Tuần 18/05 - 22/05')).toBeInTheDocument()
    expect(screen.getByTestId('book-day-2026-05-18')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '← Tuần trước' }))
    expect(screen.getByText('Tuần 11/05 - 15/05')).toBeInTheDocument()
  })

  it('disables next at week offset 4', () => {
    vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))

    render(<BookPage />)

    const nextButton = screen.getByRole('button', { name: 'Tuần sau →' })
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)

    expect(screen.getByText('Tuần 08/06 - 12/06')).toBeInTheDocument()
    expect(nextButton).toBeDisabled()
  })

  it('keeps next week accessible on Saturday', () => {
    vi.setSystemTime(new Date('2026-05-16T10:00:00+07:00'))

    render(<BookPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Tuần sau →' }))
    expect(screen.getByTestId('book-day-2026-05-18')).toBeInTheDocument()
  })

  it('shows updated status after changing next Monday from not eating to eating', async () => {
    vi.setSystemTime(new Date('2026-05-15T10:00:00+07:00'))
    mockStatuses = { '2026-05-18': 'not-eating' }

    const { rerender } = render(<BookPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Tuần sau →' }))
    const monday = screen.getByTestId('book-day-2026-05-18')
    fireEvent.click(within(monday).getByRole('button', { name: 'Có ăn' }))

    expect(setStatus).toHaveBeenCalledWith('2026-05-18', 'eating')
    await Promise.resolve()

    rerender(<BookPage />)
    expect(within(screen.getByTestId('book-day-2026-05-18')).getByRole('button', { name: 'Có ăn' })).toBeDisabled()
    expect(within(screen.getByTestId('book-day-2026-05-18')).getByRole('button', { name: 'Không ăn' })).not.toBeDisabled()
  })
})
