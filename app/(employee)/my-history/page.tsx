"use client"

import { useState, useMemo } from "react"

interface HistoryEntry {
  date: string
  status: "eating" | "not-eating"
  note?: string
}

const mockHistory: HistoryEntry[] = [
  { date: "2026-05-05", status: "eating" },
  { date: "2026-05-06", status: "eating" },
  { date: "2026-05-07", status: "not-eating", note: "Đi công trường" },
  { date: "2026-05-08", status: "eating" },
  { date: "2026-05-11", status: "not-eating", note: "Nghỉ phép" },
  { date: "2026-05-12", status: "eating" },
  { date: "2026-05-13", status: "eating" },
  { date: "2026-05-14", status: "eating" },
  { date: "2026-05-15", status: "not-eating", note: "Công tác" },
  { date: "2026-05-16", status: "eating" },
  { date: "2026-05-19", status: "eating" },
  { date: "2026-05-20", status: "eating" },
  { date: "2026-05-21", status: "not-eating", note: "Họp/Tập huấn" },
  { date: "2026-05-22", status: "eating" },
  { date: "2026-05-23", status: "eating" },
  { date: "2026-05-26", status: "eating" },
  { date: "2026-05-27", status: "not-eating" },
  { date: "2026-05-28", status: "eating" },
]

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

  const mockUser = {
    username: "hungpx",
    fullName: "Phạm Xuân Hùng",
  }

  const historyMap = useMemo(() => {
    const map: Record<string, HistoryEntry> = {}
    mockHistory.forEach((entry) => {
      map[entry.date] = entry
    })
    return map
  }, [])

  const calendarDays = useMemo(() => {
    const { startOffset, daysInMonth, totalCells } = getMonthData(currentYear, currentMonth)
    const days: Array<{ dateKey: string; day: number; isCurrentMonth: boolean }> = []

    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      const dateKey = formatDateKey(currentYear, currentMonth - 1, day)
      days.push({ dateKey, day, isCurrentMonth: false })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatDateKey(currentYear, currentMonth, d)
      days.push({ dateKey, day: d, isCurrentMonth: true })
    }

    // Next month days
    const remaining = totalCells - days.length
    for (let d = 1; d <= remaining; d++) {
      const dateKey = formatDateKey(currentYear, currentMonth + 1, d)
      days.push({ dateKey, day: d, isCurrentMonth: false })
    }

    return days
  }, [currentYear, currentMonth])

  const stats = useMemo(() => {
    const entries = calendarDays
      .filter((d) => d.isCurrentMonth)
      .map((d) => historyMap[d.dateKey])
      .filter(Boolean)

    const total = entries.length
    const eating = entries.filter((e) => e.status === "eating").length
    const notEating = entries.filter((e) => e.status === "not-eating").length

    return { total, eating, notEating }
  }, [calendarDays, historyMap])

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

  const isToday = (dateKey: string): boolean => {
    const d = new Date(dateKey)
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Lịch Sử</h1>
          <p className="text-sm text-ink-muted-80 mt-1">
            Xin chào, <span className="font-semibold text-ink">{mockUser.fullName}</span>
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
              <span className="text-2xl font-bold text-ink">{stats.total}</span>
            </div>
            <div className="p-4 rounded-[18px] bg-success-bg">
              <p className="text-xs font-medium text-success mb-1">Có ăn</p>
              <span className="text-2xl font-bold text-success">{stats.eating}</span>
            </div>
            <div className="p-4 rounded-[18px] bg-error-bg">
              <p className="text-xs font-medium text-error mb-1">Không ăn</p>
              <span className="text-2xl font-bold text-error">{stats.notEating}</span>
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
            <div className="grid grid-cols-7 p-2 gap-1">
              {calendarDays.map(({ dateKey, day, isCurrentMonth }) => {
                const entry = historyMap[dateKey]
                const todayHighlight = isToday(dateKey)

                return (
                  <div
                    key={dateKey}
                    className={`min-h-[44px] flex flex-col items-center justify-center rounded-full transition-colors ${
                      todayHighlight ? "bg-primary text-white" : ""
                    } ${!isCurrentMonth ? "opacity-40" : ""}`}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {entry && (
                      <div
                        className={`w-2 h-2 rounded-full mt-0.5 ${
                          entry.status === "eating" ? "bg-success" : "bg-error"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
