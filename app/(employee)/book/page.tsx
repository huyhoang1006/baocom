"use client"

import { useState } from "react"

type Status = "eating" | "not-eating" | "none"

interface DayInfo {
  date: number
  dayName: string
  status: Status
  isToday?: boolean
}

const mockDays: DayInfo[] = [
  { date: 11, dayName: "T2", status: "eating" },
  { date: 12, dayName: "T3", status: "eating", isToday: true },
  { date: 13, dayName: "T4", status: "none" },
  { date: 14, dayName: "T5", status: "none" },
  { date: 15, dayName: "T6", status: "eating" },
  { date: 16, dayName: "T7", status: "none" },
  { date: 17, dayName: "CN", status: "not-eating" },
  { date: 18, dayName: "T2", status: "none" },
]

function getStatusLabel(status: Status): string {
  if (status === "eating") return "Ăn"
  if (status === "not-eating") return "Không ăn"
  return "Chưa chọn"
}

export default function BookPage() {
  const [days, setDays] = useState<DayInfo[]>(mockDays)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const toggleDay = (index: number) => {
    setDays((prev) => {
      const day = prev[index]
      const newStatus: Status = day.status === "eating" ? "not-eating" : "eating"
      const message = newStatus === "eating" ? "Đã đăng ký ăn" : "Đã hủy"
      showNotification(message, "success")
      return prev.map((d, i) => (i === index ? { ...d, status: newStatus } : d))
    })
  }

  const registeredCount = days.filter((d) => d.status === "eating").length
  const thisWeekCount = days.filter((d) => d.isToday || d.date > 12).length

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

              return (
                <button
                  key={`${day.date}-${day.dayName}`}
                  onClick={() => toggleDay(index)}
                  className={`
                    relative p-4 rounded-[18px] border-2 transition-all duration-200
                    active:scale-95 text-left
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
                      {getStatusLabel(day.status)}
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