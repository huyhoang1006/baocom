import { useState, useEffect, useCallback } from 'react'
import { dailyMenusApi } from '@/lib/api'
import { toDateKey, parseLocalDate } from '@/lib/registrationWindow'

interface Meal {
  id: string
  name: string
  type: 'main' | 'vegetable' | 'dessert'
}

interface DailyMenu {
  id: string
  date: string
  meals: { id: string; sortOrder: number; meal: Meal }[]
}

export function useDailyMenus(take?: number) {
  const [menus, setMenus] = useState<DailyMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dailyMenusApi.getAll(take)
      setMenus((data.menus || []) as DailyMenu[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menus')
    } finally {
      setLoading(false)
    }
  }, [take])

  useEffect(() => {
    fetchMenus()
  }, [fetchMenus])

  const getMenuByDate = useCallback((dateStr: string): DailyMenu | null => {
    return menus.find(m => {
      const menuDate = toDateKey(parseLocalDate(m.date.split('T')[0]))
      return menuDate === dateStr
    }) || null
  }, [menus])

  const getDishesByType = useCallback((menu: DailyMenu | null, type: 'main' | 'vegetable' | 'dessert'): string[] => {
    if (!menu) return []
    return menu.meals
      .filter(m => m.meal.type === type)
      .map(m => m.meal.name)
  }, [])

  return {
    menus,
    loading,
    error,
    getMenuByDate,
    getDishesByType,
    refetch: fetchMenus,
  }
}