import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRegistrations } from '@/hooks/useRegistrations'

// Mock the API
vi.mock('@/lib/api', () => ({
  registrationsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}))

import { registrationsApi } from '@/lib/api'

describe('useRegistrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty registrations and loading true', () => {
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: [] })

    const { result } = renderHook(() => useRegistrations())

    expect(result.current.registrations).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('fetches registrations on mount', async () => {
    const mockRegistrations = [
      { id: '1', date: '2026-05-13', status: 'eating' },
      { id: '2', date: '2026-05-14', status: 'not_eating' },
    ]
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: mockRegistrations })

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.registrations).toEqual(mockRegistrations)
    expect(registrationsApi.getAll).toHaveBeenCalledWith(undefined, undefined)
  })

  it('fetches with date range when provided', async () => {
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: [] })

    const { result } = renderHook(() => useRegistrations('2026-05-01', '2026-05-31'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(registrationsApi.getAll).toHaveBeenCalledWith('2026-05-01', '2026-05-31')
  })

  it('sets error on API failure', async () => {
    vi.mocked(registrationsApi.getAll).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('getStatusForDate returns status for matching date', async () => {
    const mockRegistrations = [
      { id: '1', date: '2026-05-13T00:00:00.000Z', status: 'eating' },
    ]
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: mockRegistrations })

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.getStatusForDate('2026-05-13')).toBe('eating')
  })

  it('prefers registration dateKey when matching status', async () => {
    const mockRegistrations = [
      { id: '1', date: '2026-05-17T17:00:00.000Z', dateKey: '2026-05-18', status: 'eating' },
    ]
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: mockRegistrations })

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.getStatusForDate('2026-05-18')).toBe('eating')
  })

  it('getStatusForDate returns null for non-matching date', async () => {
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: [] })

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.getStatusForDate('2026-05-13')).toBeNull()
  })

  it('saves explicit not-eating status for a date', async () => {
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: [] })
    vi.mocked(registrationsApi.create).mockResolvedValue({ registration: { id: 'reg-1' } })

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await result.current.setStatus('2026-05-13', 'not-eating')

    expect(success).toBe(true)
    expect(registrationsApi.create).toHaveBeenCalledWith('2026-05-13', 'not_eating')
  })

  it('updates local status from successful save response before refetch completes', async () => {
    let resolveRefetch: (value: { registrations: Array<{ id: string; date: string; dateKey: string; status: string }> }) => void = () => {}
    vi.mocked(registrationsApi.getAll)
      .mockResolvedValueOnce({ registrations: [{ id: 'reg-1', date: '2026-05-18T00:00:00.000Z', dateKey: '2026-05-18', status: 'not_eating' }] })
      .mockReturnValueOnce(new Promise((resolve) => {
        resolveRefetch = resolve
      }))
    vi.mocked(registrationsApi.create).mockResolvedValue({
      registration: { id: 'reg-1', date: '2026-05-18T00:00:00.000Z', dateKey: '2026-05-18', status: 'eating' },
    })

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.getStatusForDate('2026-05-18')).toBe('not-eating')
    })

    const savePromise = result.current.setStatus('2026-05-18', 'eating')

    await waitFor(() => {
      expect(result.current.getStatusForDate('2026-05-18')).toBe('eating')
    })

    resolveRefetch({ registrations: [{ id: 'reg-1', date: '2026-05-18T00:00:00.000Z', dateKey: '2026-05-18', status: 'eating' }] })
    await expect(savePromise).resolves.toBe(true)
  })

  it('returns API error message when save fails', async () => {
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: [] })
    vi.mocked(registrationsApi.create).mockRejectedValue(new Error('Ngay nay da khoa bao com'))

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await result.current.setStatus('2026-05-12', 'not-eating')

    expect(success).toBe(false)
    await waitFor(() => {
      expect(result.current.error).toBe('Ngay nay da khoa bao com')
    })
  })
})
