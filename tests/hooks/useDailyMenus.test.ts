import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDailyMenus } from '@/hooks/useDailyMenus'

// Mock the API
vi.mock('@/lib/api', () => ({
  dailyMenusApi: {
    getAll: vi.fn(),
  },
}))

import { dailyMenusApi } from '@/lib/api'

describe('useDailyMenus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty menus and loading true', () => {
    vi.mocked(dailyMenusApi.getAll).mockResolvedValue({ menus: [] })

    const { result } = renderHook(() => useDailyMenus())

    expect(result.current.menus).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('fetches menus on mount', async () => {
    const mockMenus = [
      {
        id: '1',
        date: '2026-05-13',
        meals: [
          { id: 'm1', sortOrder: 1, meal: { id: '1', name: 'Thịt kho', type: 'main' } },
        ],
      },
    ]
    vi.mocked(dailyMenusApi.getAll).mockResolvedValue({ menus: mockMenus })

    const { result } = renderHook(() => useDailyMenus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.menus).toEqual(mockMenus)
  })

  it('fetches with take parameter when provided', async () => {
    vi.mocked(dailyMenusApi.getAll).mockResolvedValue({ menus: [] })

    const { result } = renderHook(() => useDailyMenus(5))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(dailyMenusApi.getAll).toHaveBeenCalledWith(5)
  })

  it('sets error on API failure', async () => {
    vi.mocked(dailyMenusApi.getAll).mockRejectedValue(new Error('Failed to load'))

    const { result } = renderHook(() => useDailyMenus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load')
  })

  it('getMenuByDate returns menu for matching date', async () => {
    const mockMenus = [
      {
        id: '1',
        date: '2026-05-13',
        meals: [],
      },
    ]
    vi.mocked(dailyMenusApi.getAll).mockResolvedValue({ menus: mockMenus })

    const { result } = renderHook(() => useDailyMenus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.getMenuByDate('2026-05-13')).toEqual(mockMenus[0])
  })

  it('getMenuByDate returns null for non-matching date', async () => {
    vi.mocked(dailyMenusApi.getAll).mockResolvedValue({ menus: [] })

    const { result } = renderHook(() => useDailyMenus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.getMenuByDate('2026-05-13')).toBeNull()
  })

  it('getDishesByType returns correct dishes for type', async () => {
    const mockMenu = {
      id: '1',
      date: '2026-05-13',
      meals: [
        { id: 'm1', sortOrder: 1, meal: { id: '1', name: 'Thịt kho', type: 'main' as const } },
        { id: 'm2', sortOrder: 2, meal: { id: '2', name: 'Cải xào', type: 'vegetable' as const } },
        { id: 'm3', sortOrder: 3, meal: { id: '3', name: 'Chuối', type: 'dessert' as const } },
      ],
    }
    vi.mocked(dailyMenusApi.getAll).mockResolvedValue({ menus: [mockMenu] })

    const { result } = renderHook(() => useDailyMenus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.getDishesByType(mockMenu, 'main')).toEqual(['Thịt kho'])
    expect(result.current.getDishesByType(mockMenu, 'vegetable')).toEqual(['Cải xào'])
    expect(result.current.getDishesByType(mockMenu, 'dessert')).toEqual(['Chuối'])
  })

  it('getDishesByType returns empty array for null menu', async () => {
    vi.mocked(dailyMenusApi.getAll).mockResolvedValue({ menus: [] })

    const { result } = renderHook(() => useDailyMenus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.getDishesByType(null, 'main')).toEqual([])
  })
})
