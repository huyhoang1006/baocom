"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { dailyMenusApi, mealsApi } from "@/lib/api"
import { toDateKey } from "@/lib/registrationWindow"

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

interface MealInfo {
  id: string
  name: string
  type: string
}

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

// MealBadge component with menu popover
interface MealBadgeProps {
  meal: MealInfo
  dateKey: string
  onEdit: (meal: MealInfo) => void
  onDelete: (mealId: string, dateKey: string) => void
}

function MealBadge({ meal, dateKey, onEdit, onDelete }: MealBadgeProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-bg text-primary text-sm">
        {meal.name}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
        className="ml-1 p-1 rounded hover:bg-primary/10"
      >
        <span className="material-symbols-outlined text-lg">more_horiz</span>
      </button>
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-hairline rounded-xl shadow-floating overflow-hidden min-w-[140px]">
            <button
              onClick={() => {
                setShowMenu(false)
                onEdit(meal)
              }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-surface-container transition-colors flex items-center gap-2 min-h-[44px]"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Sửa tên
            </button>
            <div className="border-t border-hairline" />
            <button
              onClick={() => {
                setShowMenu(false)
                onDelete(meal.id, dateKey)
              }}
              className="w-full px-4 py-3 text-left text-sm text-error hover:bg-error-bg transition-colors flex items-center gap-2 min-h-[44px]"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              Xóa
            </button>
          </div>
        </>
      )}
    </span>
  )
}

const rowTypes = [
  { key: "main", label: "Món chính", icon: "restaurant" },
  { key: "vegetable", label: "Món rau", icon: "eco" },
  { key: "dessert", label: "Tráng miệng", icon: "cake" }
]

interface MealSectionProps {
  type: string
  label: string
  icon: string
  meals: MealInfo[]
  onAdd: (dateKey: string, type: string, value: string) => void
  onEdit: (meal: MealInfo) => void
  onDelete: (mealId: string, dateKey: string) => void
  dateKey: string
  isExpanded: boolean
  onToggle: () => void
}

function MealSection({ type, label, icon, meals, onAdd, onEdit, onDelete, dateKey, isExpanded, onToggle }: MealSectionProps) {
  const [inputValue, setInputValue] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(dateKey, type, inputValue.trim())
      setInputValue("")
    }
    setIsEditing(false)
  }

  return (
    <div className="border-b border-hairline last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          <div className="text-left">
            <div className="text-sm font-medium text-ink">{label}</div>
            <div className="text-xs text-ink-muted-48">{meals.length} món</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-muted-80">{isExpanded ? "Ẩn" : "Mở rộng"}</span>
          <span className="material-symbols-outlined text-lg text-ink-muted-48">
            {isExpanded ? "expand_less" : "expand_more"}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {meals.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {meals.map((meal) => (
                <MealBadge
                  key={meal.id}
                  meal={meal}
                  dateKey={dateKey}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-ink-muted-48 italic py-2">Chưa có món nào</div>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd()
                  if (e.key === "Escape") setIsEditing(false)
                }}
                placeholder="Nhập tên món..."
                autoFocus
                className="w-full px-3 py-3 rounded-xl border border-hairline bg-white text-sm text-ink outline-none focus:border-primary min-h-[44px]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors min-h-[44px]"
                >
                  Thêm
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-hairline text-ink-muted-80 text-sm hover:bg-surface-container transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 rounded-xl border border-dashed border-hairline text-ink-muted-48 text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Thêm món
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface DayCardProps {
  day: WeekDay
  mealsByType: { main: MealInfo[]; vegetable: MealInfo[]; dessert: MealInfo[] }
  onMealAdd: (dateKey: string, type: string, value: string) => void
  onMealEdit: (meal: MealInfo) => void
  onMealDelete: (mealId: string, dateKey: string) => void
}

function DayCard({ day, mealsByType, onMealAdd, onMealEdit, onMealDelete }: DayCardProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  const handleTypeToggle = (type: string) => {
    setExpandedTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const formatDisplayDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-surface border border-hairline rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpandedDay(expandedDay === day.dateKey ? null : day.dateKey)}
        className="w-full flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-bg flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-xs sm:text-sm font-semibold text-primary">{day.dayLabel}</span>
          </div>
          <div className="text-left min-w-0">
            <div className="text-sm sm:text-base font-medium text-ink truncate">{formatDisplayDate(day.date)}</div>
            <div className="text-xs text-ink-muted-48 truncate">{day.date.toLocaleDateString("vi-VN", { weekday: "long" })}</div>
          </div>
        </div>
        <span className="material-symbols-outlined text-2xl text-ink-muted-48 flex-shrink-0">
          {expandedDay === day.dateKey ? "keyboard_arrow_up" : "keyboard_arrow_down"}
        </span>
      </button>

      {expandedDay === day.dateKey && (
        <div>
          {rowTypes.map(row => (
            <MealSection
              key={row.key}
              type={row.key}
              label={row.label}
              icon={row.icon}
              meals={mealsByType[row.key as keyof typeof mealsByType]}
              onAdd={onMealAdd}
              onEdit={onMealEdit}
              onDelete={onMealDelete}
              isExpanded={expandedTypes.has(row.key)}
              onToggle={() => handleTypeToggle(row.key)}
              dateKey={day.dateKey}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MenuPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [menus, setMenus] = useState<Map<string, DailyMenu>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // State with MealInfo (includes id)
  const [cellValues, setCellValues] = useState<Map<string, Map<string, MealInfo[]>>>(new Map())
  
  // Modal states
  const [editingMeal, setEditingMeal] = useState<MealInfo | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ mealId: string; name: string; dateKey: string } | null>(null)

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

      const newCellValues = new Map<string, Map<string, MealInfo[]>>()
      for (const day of weekDates) {
        const menu = menusMap.get(day.dateKey)
        const typeMap = new Map<string, MealInfo[]>()
        if (menu) {
          typeMap.set("main", menu.meals.filter(m => m.meal.type === "main").map(m => ({ id: m.meal.id, name: m.meal.name, type: m.meal.type })))
          typeMap.set("vegetable", menu.meals.filter(m => m.meal.type === "vegetable").map(m => ({ id: m.meal.id, name: m.meal.name, type: m.meal.type })))
          typeMap.set("dessert", menu.meals.filter(m => m.meal.type === "dessert").map(m => ({ id: m.meal.id, name: m.meal.name, type: m.meal.type })))
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

  // Handler: Add meal
  const handleMealAdd = (dateKey: string, type: string, value: string) => {
    // Create temp id for optimistic UI, will get real id on save
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setCellValues(prev => {
      const newMap = new Map<string, Map<string, MealInfo[]>>(prev)
      const typeMap = new Map<string, MealInfo[]>(newMap.get(dateKey) || new Map())
      const meals = typeMap.get(type) || []
      // Check if meal with same name already exists
      if (!meals.some((m: MealInfo) => m.name.toLowerCase() === value.toLowerCase())) {
        typeMap.set(type, [...meals, { id: tempId, name: value, type }])
      }
      newMap.set(dateKey, typeMap)
      return newMap
    })
  }

  // Handler: Edit meal
  const handleMealEdit = (meal: MealInfo) => {
    setEditingMeal(meal)
  }

  const handleEditSave = async () => {
    if (!editingMeal) return
    try {
      await mealsApi.update(editingMeal.id, { name: editingMeal.name, type: editingMeal.type })
      // Update cellValues
      setCellValues(prev => {
        const newMap = new Map(prev)
        for (const [dateKey, typeMap] of newMap) {
          for (const [type, meals] of typeMap) {
            const idx = meals.findIndex(m => m.id === editingMeal.id)
            if (idx !== -1) {
              const updated = [...meals]
              updated[idx] = { ...updated[idx], name: editingMeal.name, type: editingMeal.type }
              typeMap.set(type, updated)
              break
            }
          }
        }
        return newMap
      })
      setEditingMeal(null)
      showNotification("success", "Đã cập nhật món")
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Cập nhật thất bại")
    }
  }

  // Handler: Delete meal from date
  const handleMealDelete = (mealId: string, dateKey: string) => {
    // Find meal name from cellValues
    let mealName = ""
    const typeMap = cellValues.get(dateKey)
    if (typeMap) {
      for (const [, meals] of typeMap) {
        const meal = meals.find(m => m.id === mealId)
        if (meal) {
          mealName = meal.name
          break
        }
      }
    }
    setDeleteConfirm({ mealId, name: mealName, dateKey })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    try {
      await mealsApi.deleteFromDate(deleteConfirm.dateKey, deleteConfirm.mealId)
      // Update cellValues - remove meal from dateKey
      setCellValues(prev => {
        const newMap = new Map(prev)
        const typeMap = newMap.get(deleteConfirm.dateKey)
        if (typeMap) {
          for (const [type, meals] of typeMap) {
            const filtered = meals.filter(m => m.id !== deleteConfirm.mealId)
            typeMap.set(type, filtered)
          }
        }
        return newMap
      })
      setDeleteConfirm(null)
      showNotification("success", "Đã xóa món")
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Xóa thất bại")
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const menusToSave: { date: string; mealIds: string[] }[] = []

      for (const day of weekDates) {
        const typeMap = cellValues.get(day.dateKey)
        if (!typeMap) continue

        const allMealIds: string[] = []
        const mealNamesByType: Record<string, string[]> = {
          main: (typeMap.get("main") || []).map(m => m.name),
          vegetable: (typeMap.get("vegetable") || []).map(m => m.name),
          dessert: (typeMap.get("dessert") || []).map(m => m.name)
        }

        for (const [type, names] of Object.entries(mealNamesByType)) {
          for (const name of names) {
            try {
              const res = await mealsApi.findOrCreate(name, type)
              if (res.meal && !allMealIds.includes(res.meal.id)) {
                allMealIds.push(res.meal.id)
              }
            } catch {
              // Skip invalid meals
            }
          }
        }

        if (allMealIds.length > 0) {
          menusToSave.push({ date: day.dateKey, mealIds: allMealIds })
        }
      }

      await dailyMenusApi.batch(menusToSave)
      showNotification("success", "Đã lưu thực đơn tuần này")
      fetchMenus()
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Lưu thất bại")
    } finally {
      setSaving(false)
    }
  }

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

      {/* Edit Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setEditingMeal(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-floating">
            <h2 className="text-lg font-semibold text-ink mb-4">Sửa tên món</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-ink-muted-80 mb-1">Tên món</label>
                <input
                  type="text"
                  value={editingMeal.name}
                  onChange={(e) => setEditingMeal({ ...editingMeal, name: e.target.value })}
                  className="w-full px-3 py-3 rounded-xl border border-hairline bg-white text-sm text-ink outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-ink-muted-80 mb-1">Loại</label>
                <select
                  value={editingMeal.type}
                  onChange={(e) => setEditingMeal({ ...editingMeal, type: e.target.value })}
                  className="w-full px-3 py-3 rounded-xl border border-hairline bg-white text-sm text-ink outline-none focus:border-primary"
                >
                  <option value="main">Món chính</option>
                  <option value="vegetable">Món rau</option>
                  <option value="dessert">Tráng miệng</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingMeal(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-hairline text-ink-muted-80 text-sm font-medium hover:bg-surface-container transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEditSave}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-floating">
            <h2 className="text-lg font-semibold text-ink mb-2">Xác nhận xóa</h2>
            <p className="text-sm text-ink-muted-80 mb-6">
              Xóa "{deleteConfirm.name}" khỏi thực đơn ngày này?<br/>
              <span className="text-ink-muted-48">(Món vẫn còn trong hệ thống)</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-hairline text-ink-muted-80 text-sm font-medium hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-3 rounded-xl bg-error text-white text-sm font-medium hover:opacity-90 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="pt-8 sm:pt-12 pb-4 sm:pb-6 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1140px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Thực đơn</h1>
            <p className="text-xs sm:text-sm text-ink-muted-80">Tuần {weekLabel}</p>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1140px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high border border-hairline transition-colors whitespace-nowrap">
                ◀ Tuần trước
              </button>
              <button onClick={() => setWeekOffset(0)} className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high border border-hairline transition-colors whitespace-nowrap">
                Tuần này
              </button>
              <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high border border-hairline transition-colors whitespace-nowrap">
                Tuần sau ▶
              </button>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-all disabled:opacity-50">
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-surface border border-hairline rounded-2xl p-4 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container" />
                    <div className="h-4 bg-surface-container rounded w-1/3" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-12 bg-surface-container rounded-xl" />
                    <div className="h-12 bg-surface-container rounded-xl" />
                    <div className="h-12 bg-surface-container rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {weekDates.map(day => {
                const typeMap = cellValues.get(day.dateKey)
                const mealsByType = {
                  main: typeMap?.get("main") || [],
                  vegetable: typeMap?.get("vegetable") || [],
                  dessert: typeMap?.get("dessert") || []
                }
                return (
                  <DayCard
                    key={day.dateKey}
                    day={day}
                    mealsByType={mealsByType}
                    onMealAdd={handleMealAdd}
                    onMealEdit={handleMealEdit}
                    onMealDelete={handleMealDelete}
                  />
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}