"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { dailyMenusApi, mealsExtendedApi } from "@/lib/api"
import { toDateKey } from "@/lib/registrationWindow"

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

interface MenuMeal {
  id: string
  sortOrder: number
  meal: { id: string; name: string; type: string }
}

interface DailyMenu {
  id: string
  date: string
  meals: MenuMeal[]
}

interface WeekDay {
  date: Date
  dateKey: string
  dayLabel: string
}

function formatDateKey(date: Date): string {
  return toDateKey(date)
}

function getWeekDates(weekOffset: number = 0): WeekDay[] {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(monday.getDate() + (weekOffset * 7))
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + diff)

  const dates: WeekDay[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateKey = formatDateKey(d)
    const dayOfWeek = d.getDay()
    dates.push({
      date: d,
      dateKey,
      dayLabel: `T${WEEKDAY_LABELS[dayOfWeek].replace('T', '')}`
    })
  }
  return dates
}

function getWeekLabel(weekDates: WeekDay[]): string {
  const start = weekDates[0].date
  const end = weekDates[4].date
  const formatDay = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
  return `${formatDay(start)} - ${formatDay(end)}`
}

export default function MenuPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [menus, setMenus] = useState<Map<string, DailyMenu>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [cellValues, setCellValues] = useState<Map<string, Map<string, string[]>>>(new Map())
  const [editingCell, setEditingCell] = useState<{ dateKey: string; type: string } | null>(null)

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekLabel = useMemo(() => getWeekLabel(weekDates), [weekDates])

  const fetchMenus = useCallback(async () => {
    setLoading(true)
    try {
      const menusMap = new Map<string, DailyMenu>()
      for (const day of weekDates) {
        try {
          const data = await dailyMenusApi.getByDate(day.dateKey)
          if (data.dailyMenu) {
            menusMap.set(day.dateKey, data.dailyMenu as DailyMenu)
          }
        } catch {
          // No menu for this day
        }
      }
      setMenus(menusMap)

      const newCellValues = new Map<string, Map<string, string[]>>()
      for (const day of weekDates) {
        const menu = menusMap.get(day.dateKey)
        const typeMap = new Map<string, string[]>()
        if (menu) {
          typeMap.set("main", menu.meals.filter(m => m.meal.type === "main").map(m => m.meal.name))
          typeMap.set("vegetable", menu.meals.filter(m => m.meal.type === "vegetable").map(m => m.meal.name))
          typeMap.set("dessert", menu.meals.filter(m => m.meal.type === "dessert").map(m => m.meal.name))
        } else {
          typeMap.set("main", [])
          typeMap.set("vegetable", [])
          typeMap.set("dessert", [])
        }
        newCellValues.set(day.dateKey, typeMap)
      }
      setCellValues(newCellValues)
    } finally {
      setLoading(false)
    }
  }, [weekDates])

  useEffect(() => {
    fetchMenus()
  }, [fetchMenus])

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleCellClick = (dateKey: string, type: string) => {
    setEditingCell({ dateKey, type })
  }

  const handleCellBlur = () => {
    setEditingCell(null)
  }

  const handleCellChange = (dateKey: string, type: string, value: string) => {
    setCellValues(prev => {
      const newMap = new Map(prev)
      const typeMap = new Map(newMap.get(dateKey) || new Map())
      const meals = value.split(',').map(s => s.trim()).filter(s => s.length > 0)
      typeMap.set(type, meals)
      newMap.set(dateKey, typeMap)
      return newMap
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const day of weekDates) {
        const typeMap = cellValues.get(day.dateKey)
        if (!typeMap) continue

        const allMeals: string[] = []
        const mealNamesByType: Record<string, string[]> = {
          main: typeMap.get("main") || [],
          vegetable: typeMap.get("vegetable") || [],
          dessert: typeMap.get("dessert") || []
        }

        for (const [type, names] of Object.entries(mealNamesByType)) {
          for (const name of names) {
            try {
              const res = await mealsExtendedApi.findOrCreate(name, type)
              if (res.meal && !allMeals.includes(res.meal.id)) {
                allMeals.push(res.meal.id)
              }
            } catch {
              // Skip invalid meals
            }
          }
        }

        if (allMeals.length > 0) {
          try {
            await dailyMenusApi.updateByDate(day.dateKey, allMeals)
          } catch {
            try {
              await dailyMenusApi.create(day.dateKey, allMeals)
            } catch {
              // Skip if both fail
            }
          }
        }
      }
      showNotification("success", "Đã lưu thực đơn tuần này")
      fetchMenus()
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Lưu thất bại")
    } finally {
      setSaving(false)
    }
  }

  const getCellValue = (dateKey: string, type: string): string => {
    const typeMap = cellValues.get(dateKey)
    if (!typeMap) return ""
    const meals = typeMap.get(type) || []
    return meals.join(", ")
  }

  const rowTypes = [
    { key: "main", label: "Món chính" },
    { key: "vegetable", label: "Món rau" },
    { key: "dessert", label: "Tráng miệng" }
  ]

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-floating animate-slide-down"
          style={{
            background: notification.type === "success" ? "var(--color-success-bg)" : "var(--color-error-bg)",
            color: notification.type === "success" ? "var(--color-success)" : "var(--color-error)",
            border: `1px solid ${notification.type === "success" ? "var(--color-success)" : "var(--color-error)"}`
          }}>
          <span className="material-symbols-outlined">{notification.type === "success" ? "check_circle" : "error"}</span>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <header className="pt-12 pb-6 px-6 lg:px-10">
        <div className="max-w-[1140px] mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Thực đơn</h1>
            <p className="text-sm text-ink-muted-80">Tuần {weekLabel}</p>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-10">
        <div className="max-w-[1140px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekOffset(w => w - 1)} className="px-4 py-2 rounded-full text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high border border-hairline transition-colors">
                ◀ Tuần trước
              </button>
              <button onClick={() => setWeekOffset(0)} className="px-4 py-2 rounded-full text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high border border-hairline transition-colors">
                Tuần này
              </button>
              <button onClick={() => setWeekOffset(w => w + 1)} className="px-4 py-2 rounded-full text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high border border-hairline transition-colors">
                Tuần sau ▶
              </button>
            </div>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-all disabled:opacity-50">
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>

          {loading ? (
            <div className="bg-surface border border-hairline rounded-[18px] p-6 animate-pulse">
              <div className="grid grid-cols-5 gap-4">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="h-20 bg-surface-container rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-hairline rounded-[18px] overflow-hidden">
              <div className="grid grid-cols-6 border-b border-hairline">
                <div className="p-4 bg-surface-container" />
                {weekDates.map(day => (
                  <div key={day.dateKey} className="p-4 bg-surface-container text-center">
                    <div className="text-sm font-semibold text-ink">{day.dayLabel}</div>
                    <div className="text-xs text-ink-muted-48">{day.date.getDate()}/{day.date.getMonth() + 1}</div>
                  </div>
                ))}
              </div>

              {rowTypes.map(row => (
                <div key={row.key} className="grid grid-cols-6 border-b border-hairline last:border-b-0">
                  <div className="p-4 bg-surface-container flex items-center">
                    <span className="text-sm font-medium text-ink">{row.label}</span>
                  </div>
                  {weekDates.map(day => {
                    const isEditing = editingCell?.dateKey === day.dateKey && editingCell?.type === row.key
                    const value = getCellValue(day.dateKey, row.key)
                    return (
                      <div
                        key={`${day.dateKey}-${row.key}`}
                        onClick={() => handleCellClick(day.dateKey, row.key)}
                        className="p-4 min-h-[80px] cursor-pointer hover:bg-surface-container-high transition-colors"
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={value}
                            onChange={(e) => handleCellChange(day.dateKey, row.key, e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "Escape") handleCellBlur()
                            }}
                            autoFocus
                            className="w-full px-3 py-2 rounded-lg bg-white border border-primary text-sm text-ink outline-none"
                            placeholder="Nhấn để thêm..."
                          />
                        ) : (
                          <div className={`text-sm ${value ? "text-ink" : "text-ink-muted-48 italic"}`}>
                            {value || "Nhấn để thêm..."}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}