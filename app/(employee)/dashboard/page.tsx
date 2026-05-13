"use client"

import { useState, useEffect, useMemo } from "react"
import { useDailyMenus } from "@/hooks/useDailyMenus"
import { useRegistrations } from "@/hooks/useRegistrations"
import { toUIStatus } from "@/lib/statusUtils"

interface DailyMenu {
  day: string
  date: string
  dateKey: string
  dishes: {
    main: string[]
    vegetables: string[]
    dessert: string[]
  }
  registered: boolean
}

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getWeekDates(): Date[] {
  const today = new Date()
  const monday = new Date(today)
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + diff)

  const dates: Date[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

export default function EmployeeDashboard() {
  const weekDates = useMemo(() => getWeekDates(), [])

  const startDate = formatDateKey(weekDates[0])
  const endDate = formatDateKey(weekDates[4])

  const { menus, getMenuByDate, getDishesByType, loading: menusLoading } = useDailyMenus(5)
  const { getStatusForDate, loading: regsLoading } = useRegistrations(startDate, endDate)

  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  const loading = menusLoading || regsLoading

  const weeklyMenu = useMemo<DailyMenu[]>(() => {
    return weekDates.map((date, index) => {
      const dateKey = formatDateKey(date)
      const menu = getMenuByDate(dateKey)
      const status = getStatusForDate(dateKey)
      const dayOfWeek = date.getDay()

      return {
        day: `Thứ ${WEEKDAY_LABELS[dayOfWeek].replace('T', '')}`,
        date: `${date.getDate()}/${date.getMonth() + 1}`,
        dateKey,
        dishes: {
          main: getDishesByType(menu, 'main'),
          vegetables: getDishesByType(menu, 'vegetable'),
          dessert: getDishesByType(menu, 'dessert'),
        },
        registered: status === 'eating',
      }
    })
  }, [weekDates, getMenuByDate, getDishesByType, getStatusForDate])

  const currentDay = weeklyMenu[selectedDayIndex]
  const isRegistered = currentDay?.registered || false

  const toggleRegistration = async () => {
    const day = weeklyMenu[selectedDayIndex]
    if (!day) return

    const { toggle } = useRegistrations()
    // Toggle would be handled here
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <p className="text-sm text-ink-muted-80 mb-1">Tuần này</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Thực Đơn Tuần này</h1>
        </div>
      </header>

      {/* Day Selector - Horizontal Scroll */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="max-w-[900px] mx-auto">
          {loading ? (
            <div className="h-12 bg-surface-container rounded-full animate-pulse" />
          ) : (
            <div className="flex gap-3 overflow-x-auto scroll-snap-x-mandatory snap-mandatory pb-2 -mx-2 px-2">
              {weeklyMenu.map((day, index) => (
                <button
                  key={day.day}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all snap-start ${
                    selectedDayIndex === index
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-ink-muted-80 hover:bg-surface-container-hover"
                  }`}
                >
                  {day.day.replace("Thứ ", "")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content - Full Width Card */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          {loading ? (
            <div className="rounded-[18px] overflow-hidden border border-hairline bg-surface p-5 animate-pulse">
              <div className="h-6 bg-surface-container rounded w-1/3 mb-4" />
              <div className="space-y-3">
                <div className="h-16 bg-surface-container rounded" />
                <div className="h-16 bg-surface-container rounded" />
                <div className="h-16 bg-surface-container rounded" />
              </div>
            </div>
          ) : currentDay ? (
            <div className="rounded-[18px] overflow-hidden border border-hairline bg-surface">
              {/* Date Header */}
              <div className="px-5 py-4 border-b border-hairline bg-surface-container">
                <div className="flex items-center justify-between">
                  <h2 className="text-[21px] font-semibold text-ink">
                    {currentDay.day}, {currentDay.date}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isRegistered
                        ? "bg-success-bg text-success"
                        : "bg-warning-bg text-warning"
                    }`}
                  >
                    {isRegistered ? "Đã đăng ký" : "Chưa đăng ký"}
                  </span>
                </div>
              </div>

              {/* Menu Sections */}
              <div className="p-5 space-y-5">
                {/* Món chính */}
                <div>
                  <p className="text-[12px] uppercase tracking-wider text-ink-muted-60 mb-2 font-medium">
                    Món chính
                  </p>
                  <div className="px-4 py-3 rounded-xl bg-surface-container">
                    <p className="text-sm font-medium text-ink">
                      {currentDay.dishes.main.length > 0 ? currentDay.dishes.main.join(', ') : 'Chưa có menu'}
                    </p>
                  </div>
                </div>

                {/* Món rau */}
                <div>
                  <p className="text-[12px] uppercase tracking-wider text-ink-muted-60 mb-2 font-medium">
                    Món rau
                  </p>
                  <div className="space-y-2">
                    {currentDay.dishes.vegetables.length > 0 ? (
                      currentDay.dishes.vegetables.map((veg, idx) => (
                        <div key={idx} className="px-4 py-3 rounded-xl bg-surface-container">
                          <p className="text-sm font-medium text-ink">{veg}</p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 rounded-xl bg-surface-container">
                        <p className="text-sm text-ink-muted-48">Chưa có món rau</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tráng miệng */}
                <div>
                  <p className="text-[12px] uppercase tracking-wider text-ink-muted-60 mb-2 font-medium">
                    Tráng miệng
                  </p>
                  <div className="px-4 py-3 rounded-xl bg-surface-container">
                    <p className="text-sm font-medium text-ink">
                      {currentDay.dishes.dessert.length > 0 ? currentDay.dishes.dessert.join(', ') : 'Chưa có'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  disabled
                  className={`w-full py-3 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    isRegistered
                      ? "bg-success-bg text-success"
                      : "bg-surface-container text-ink-muted-48"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {isRegistered ? "check_circle" : "event_busy"}
                  </span>
                  {isRegistered ? "Đã đăng ký" : "Chưa đăng ký"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[18px] border border-hairline bg-surface p-8 text-center">
              <p className="text-ink-muted-80">Không có dữ liệu menu</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}