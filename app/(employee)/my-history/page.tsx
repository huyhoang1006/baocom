"use client"

import { useState, useEffect, useMemo } from "react"
import { useRegistrations } from "@/hooks/useRegistrations"
import { toUIStatus } from "@/lib/statusUtils"
import { toDateKey } from "@/lib/registrationWindow"
import { authApi } from "@/lib/api"

interface HistoryEntry {
  dateKey: string
  day: number
  isCurrentMonth: boolean
  status: "eating" | "not-eating" | null
  isToday: boolean
}

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
]

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  return { firstDay, lastDay, startOffset, daysInMonth, totalCells }
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export default function HistoryPage() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  const [user, setUser] = useState<{ username: string; fullName: string } | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user: userData } = await authApi.me()
        setUser({
          username: userData.username,
          fullName: userData.name,
        })
      } catch (err) {
        console.error('Failed to fetch user:', err)
      }
    }
    fetchUser()
  }, [])

  // Calculate date range for the current month
  const startDate = useMemo(() => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
  }, [currentYear, currentMonth])

  const endDate = useMemo(() => {
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate()
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${lastDay}`
  }, [currentYear, currentMonth])

  const { registrations, loading, getStatusForDate } = useRegistrations(startDate, endDate)

  const historyMap = useMemo(() => {
    const map: Record<string, 'eating' | 'not-eating'> = {}
    registrations.forEach((reg) => {
      const dateKey = toDateKey(new Date(reg.date))
      map[dateKey] = toUIStatus(reg.status as 'eating' | 'not_eating')
    })
    return map
  }, [registrations])

  const calendarDays = useMemo(() => {
    const { startOffset, daysInMonth, totalCells } = getMonthData(currentYear, currentMonth)
    const days: HistoryEntry[] = []

    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      const dateKey = formatDateKey(currentYear, currentMonth - 1, day)
      const d = new Date(currentYear, currentMonth - 1, day)
      days.push({
        dateKey,
        day,
        isCurrentMonth: false,
        status: null,
        isToday: false,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatDateKey(currentYear, currentMonth, d)
      const status = historyMap[dateKey] || null
      const isToday =
        d === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear()
      days.push({ dateKey, day: d, isCurrentMonth: true, status, isToday })
    }

    // Next month days
    const remaining = totalCells - days.length
    for (let d = 1; d <= remaining; d++) {
      const dateKey = formatDateKey(currentYear, currentMonth + 1, d)
      days.push({ dateKey, day: d, isCurrentMonth: false, status: null, isToday: false })
    }

    return days
  }, [currentYear, currentMonth, historyMap, today])

  const stats = useMemo(() => {
    const entries = calendarDays.filter((d) => d.isCurrentMonth && d.status !== null)

    const total = entries.length
    const eating = entries.filter((e) => e.status === "eating").length
    const notEating = entries.filter((e) => e.status === "not-eating").length

    return { total, eating, notEating }
  }, [calendarDays])

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Lịch Sử</h1>
          <p className="text-sm text-ink-muted-80 mt-1">
            Xin chào, <span className="font-semibold text-ink">{user?.fullName || '...'}</span>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto space-y-5">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-[18px] bg-surface-container-low">
              <p className="text-xs text-ink-muted-80 mb-1">Tổng</p>
              <span className="text-2xl font-bold text-ink">{loading ? '-' : stats.total}</span>
            </div>
            <div className="p-4 rounded-[18px] bg-success-bg">
              <p className="text-xs font-medium text-success mb-1">Có ăn</p>
              <span className="text-2xl font-bold text-success">{loading ? '-' : stats.eating}</span>
            </div>
            <div className="p-4 rounded-[18px] bg-error-bg">
              <p className="text-xs font-medium text-error mb-1">Không ăn</p>
              <span className="text-2xl font-bold text-error">{loading ? '-' : stats.notEating}</span>
            </div>
          </div>

          {/* Calendar View */}
          <div className="rounded-[18px] bg-surface-container-low border border-hairline overflow-hidden">
            {/* Month Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
              <button
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                aria-label="Tháng trước"
              >
                <span className="text-ink">◀</span>
              </button>
              <h2 className="text-base font-semibold text-ink">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                aria-label="Tháng sau"
              >
                <span className="text-ink">▶</span>
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-hairline">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="py-2 text-center text-xs font-semibold text-ink-muted-80"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day Grid */}
            {loading ? (
              <div className="p-4 grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-10 bg-surface-container rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 p-2 gap-1">
                {calendarDays.map(({ dateKey, day, isCurrentMonth, status, isToday }) => (
                  <div
                    key={dateKey}
                    className={`min-h-[44px] flex flex-col items-center justify-center rounded-full transition-colors ${
                      isToday ? "bg-primary text-white" : ""
                    } ${!isCurrentMonth ? "opacity-40" : ""}`}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {status && (
                      <div
                        className={`w-2 h-2 rounded-full mt-0.5 ${
                          status === "eating" ? "bg-success" : "bg-error"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
