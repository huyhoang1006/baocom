import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRegistrations } from '@/hooks/useRegistrations'

// Mock the API
vi.mock('@/lib/api', () => ({
  registrationsApi: {
    getAll: vi.fn(),
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

  it('getStatusForDate returns null for non-matching date', async () => {
    vi.mocked(registrationsApi.getAll).mockResolvedValue({ registrations: [] })

    const { result } = renderHook(() => useRegistrations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.getStatusForDate('2026-05-13')).toBeNull()
  })
})
