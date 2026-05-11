"use client"

import { useState } from "react"

interface DayInfo {
  date: number
  month: number
  dayName: string
  fullDate: string
  status: "eating" | "not-eating" | "past"
  isToday?: boolean
}

const mockDays: DayInfo[] = [
  { date: 12, month: 5, dayName: "T2", fullDate: "2024-05-12", status: "past" },
  { date: 13, month: 5, dayName: "T3", fullDate: "2024-05-13", status: "past" },
  { date: 14, month: 5, dayName: "T4", fullDate: "2024-05-14", status: "past" },
  { date: 15, month: 5, dayName: "T5", fullDate: "2024-05-15", status: "eating", isToday: true },
  { date: 16, month: 5, dayName: "T6", fullDate: "2024-05-16", status: "eating" },
  { date: 17, month: 5, dayName: "T7", fullDate: "2024-05-17", status: "eating" },
  { date: 20, month: 5, dayName: "T2", fullDate: "2024-05-20", status: "eating" },
]

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
  const dayName = days[date.getDay()]
  const d = date.getDate()
  const month = date.getMonth() + 1
  return `${dayName}, ${d} tháng ${month}`
}

function getDateLabel(day: DayInfo): string {
  if (day.isToday) return "Hôm nay"
  if (day.status === "past") return "Đã qua"
  return `${day.date}/${day.month}`
}

export default function BookPage() {
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(mockDays.find(d => d.isToday) || null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Toggle not-eating status
  const toggleNotEating = (day: DayInfo) => {
    if (day.status === "past") return
    // For demo, just cycle status
    const newStatus = day.status === "eating" ? "not-eating" : "eating"
    // In real app, would update via API
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setIsLoading(false)
    setNotification({ type: "success", message: "Đã cập nhật đăng ký thành công!" })
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <p className="text-sm text-ink-muted-80 mb-2">Đăng ký suất ăn</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Báo Cơm
          </h1>
          <p className="text-base text-ink-muted-80 mt-2">
            Mặc định bạn sẽ ăn trưa hàng ngày. Chọn những ngày bạn không ăn để chúng tôi cập nhật với bếp.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto space-y-6">
          {/* Week Strip */}
          <div className="rounded-2xl bg-surface-container-low p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-ink">Tuần này</h2>
              <span className="text-xs text-ink-muted-48">Khóa đăng ký: 00:00 trước ngày hôm sau</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {mockDays.map((day, index) => {
                const isSelected = selectedDay?.fullDate === day.fullDate
                const isPast = day.status === "past"

                return (
                  <button
                    key={day.fullDate}
                    onClick={() => !isPast && setSelectedDay(day)}
                    disabled={isPast}
                    className={`
                      relative p-3 rounded-xl transition-all duration-200 text-center text-sm
                      ${isSelected ? "bg-primary text-white" : ""}
                      ${!isSelected && !isPast ? "bg-surface-container hover:bg-surface-container-high" : ""}
                      ${isPast ? "opacity-40 cursor-not-allowed" : ""}
                    `}
                  >
                    <div className={`text-xs mb-1 ${isSelected ? "text-white/70" : "text-ink-muted-48"}`}>
                      {day.dayName}
                    </div>
                    <div className={`text-xl font-semibold ${isSelected ? "text-white" : "text-ink"}`}>
                      {day.date}
                    </div>
                    <div className={`mt-1 text-xs ${isSelected ? "text-white/70" : "text-ink-muted-48"}`}>
                      {day.status === "eating" ? "Ăn" : day.status === "not-eating" ? "Không" : ""}
                    </div>
                    {day.isToday && (
                      <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-warning text-warning-text text-[10px] font-semibold rounded-full">
                        Hôm nay
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected Day Detail */}
          {selectedDay && (
            <div className="rounded-2xl bg-surface-container-low p-5 animate-scale-in">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    {formatDate(selectedDay.fullDate)}
                  </h3>
                  <p className="text-sm text-ink-muted-48 mt-0.5">
                    {selectedDay.status === "eating" ? "Đã đăng ký ăn" : "Đã đăng ký không ăn"}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  selectedDay.status === "eating"
                    ? "bg-success-bg text-success"
                    : "bg-error-bg text-error"
                }`}>
                  {selectedDay.status === "eating" ? "Có ăn" : "Không ăn"}
                </span>
              </div>

              {/* Action Toggle */}
              <div className="border-t border-hairline pt-4">
                <p className="text-sm text-ink-muted-80 mb-3">Thay đổi trạng thái:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleNotEating({ ...selectedDay, status: "eating" })}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                      selectedDay.status === "eating"
                        ? "border-primary bg-primary/5"
                        : "border-hairline hover:border-primary-hover"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-xl ${
                      selectedDay.status === "eating" ? "text-primary" : "text-ink-muted-48"
                    }`} style={{ fontVariationSettings: selectedDay.status === "eating" ? "'FILL' 1" : "'FILL' 0" }}>
                      restaurant
                    </span>
                    <span className={`text-sm font-medium ${selectedDay.status === "eating" ? "text-primary" : "text-ink-muted-80"}`}>
                      Có ăn
                    </span>
                  </button>

                  <button
                    onClick={() => toggleNotEating({ ...selectedDay, status: "not-eating" })}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                      selectedDay.status === "not-eating"
                        ? "border-error bg-error/5"
                        : "border-hairline hover:border-error"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-xl ${
                      selectedDay.status === "not-eating" ? "text-error" : "text-ink-muted-48"
                    }`} style={{ fontVariationSettings: selectedDay.status === "not-eating" ? "'FILL' 1" : "'FILL' 0" }}>
                      no_meals
                    </span>
                    <span className={`text-sm font-medium ${selectedDay.status === "not-eating" ? "text-error" : "text-ink-muted-80"}`}>
                      Không ăn
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Đang cập nhật..." : "Cập nhật đăng ký"}
                </button>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-sm text-ink-muted-80">
              Đăng ký cho ngày mai sẽ bị khóa vào lúc 00:00 (rạng sáng) mỗi đêm.
            </p>
          </div>
        </div>
      </main>

      {/* Notification Toast */}
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