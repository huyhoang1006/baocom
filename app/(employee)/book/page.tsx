"use client"

import { useState, useMemo, useEffect } from "react"
import { useRegistrations } from "@/hooks/useRegistrations"
import type { UIStatus } from "@/lib/statusUtils"

type Status = "eating" | "not-eating" | "none"

interface DayInfo {
  date: number
  dateKey: string
  dayName: string
  status: Status
  isToday?: boolean
  isPast?: boolean
}

const WEEKDAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

export default function BookPage() {
  const today = new Date()
  const todayDate = today.getDate()
  const todayMonth = today.getMonth()
  const todayYear = today.getFullYear()

  // Generate 8 days starting from today
  const { registrations, loading, error, toggle, getStatusForDate } = useRegistrations()

  const days = useMemo<DayInfo[]>(() => {
    const result: DayInfo[] = []
    for (let i = 0; i < 8; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dayOfWeek = d.getDay()
      const dateKey = d.toISOString().split('T')[0]
      const status = getStatusForDate(dateKey) || 'none'
      const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate())

      result.push({
        date: d.getDate(),
        dateKey,
        dayName: WEEKDAY_NAMES[dayOfWeek],
        status,
        isToday: i === 0,
        isPast,
      })
    }
    return result
  }, [today, getStatusForDate])

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleToggle = async (index: number) => {
    const day = days[index]
    if (day.isPast) return

    const currentStatus = day.status === 'none' ? 'eating' : day.status === 'eating' ? 'not-eating' : 'eating'
    const newStatus = currentStatus === 'eating' ? 'not-eating' : 'eating'

    const success = await toggle(day.dateKey, newStatus)
    if (success) {
      const message = newStatus === 'eating' ? 'Đã đăng ký ăn' : 'Đã hủy'
      showNotification(message, 'success')
    } else {
      showNotification('Cập nhật thất bại', 'error')
    }
  }

  const registeredCount = days.filter((d) => d.status === "eating").length
  const thisWeekCount = days.filter((d) => d.isToday || (d.date > todayDate && !d.isPast)).length

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Báo Cơm</h1>
          <p className="text-base text-ink-muted-80 mt-2">
            Mặc định bạn sẽ ăn trưa hàng ngày. Chọn những ngày bạn không ăn để chúng tôi cập nhật với bếp.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto space-y-8">
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[18px] bg-surface-container-low p-5">
              <div className="text-2xl font-semibold text-ink">{registeredCount}</div>
              <div className="text-sm text-ink-muted-80 mt-1">Đã đăng ký</div>
            </div>
            <div className="rounded-[18px] bg-surface-container-low p-5">
              <div className="text-2xl font-semibold text-ink">{thisWeekCount}</div>
              <div className="text-sm text-ink-muted-80 mt-1">Tuần này</div>
            </div>
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-2 gap-3">
            {days.map((day, index) => {
              const isEating = day.status === "eating"
              const isNotEating = day.status === "not-eating"
              const isNone = day.status === "none"
              const isToday = day.isToday
              const todayStr = today.toISOString().split('T')[0]
              const isPast = day.dateKey < todayStr

              return (
                <button
                  key={`${day.date}-${day.dayName}`}
                  onClick={() => handleToggle(index)}
                  disabled={isPast}
                  className={`
                    relative p-4 rounded-[18px] border-2 transition-all duration-200
                    active:scale-95 text-left
                    ${isPast ? "opacity-50 cursor-not-allowed" : ""}
                    ${isToday ? "ring-2 ring-primary ring-offset-2" : ""}
                    ${isEating ? "border-success bg-success-bg" : ""}
                    ${isNotEating ? "border-error bg-error-bg" : ""}
                    ${isNone ? "border-hairline bg-surface-container-low" : ""}
                  `}
                >
                  {/* Status dot */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isEating ? "bg-success" : isNotEating ? "bg-error" : "bg-ink-muted-48"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isEating ? "text-success" : isNotEating ? "text-error" : "text-ink-muted-80"
                      }`}
                    >
                      {isEating ? "Ăn" : isNotEating ? "Không ăn" : "Chưa chọn"}
                    </span>
                  </div>

                  {/* Day info */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-ink">{day.dayName}</span>
                    <span className="text-2xl font-bold text-ink">{day.date}</span>
                  </div>

                  {/* Today badge */}
                  {isToday && (
                    <div className="absolute -top-2 -right-2 px-2.5 py-1 bg-primary text-on-primary text-xs font-semibold rounded-full">
                      Hôm nay
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {notification && (
        <div
          className="fixed top-6 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-floating animate-slide-down"
          style={{
            background: notification.type === "success" ? "var(--color-success-bg)" : "var(--color-error-bg)",
            color: notification.type === "success" ? "var(--color-success)" : "var(--color-error)",
            border: `1px solid ${notification.type === "success" ? "var(--color-success)" : "var(--color-error)"}`
          }}
        >
          <span className="material-symbols-outlined">
            {notification.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}
    </div>
  )
}