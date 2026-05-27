"use client"

import { useEffect, useMemo, useState } from "react"
import { CutoffTimeConfig } from "@/lib/registrationWindow"
import { useRegistrations } from "@/hooks/useRegistrations"
import { MAX_BOOKING_WEEK_OFFSET, getWeekdaysForOffset, startOfLocalDay } from "@/lib/registrationWindow"

type Status = "eating" | "not-eating"

function formatWeekRangeDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`
}

export default function BookPage() {
  const today = useMemo(() => new Date(), [])
  const { loading, error, setStatus, getStatusForDate } = useRegistrations()
  const [weekOffset, setWeekOffset] = useState(0)
  const [cutoffConfig, setCutoffConfig] = useState<CutoffTimeConfig | null>(null)

  useEffect(() => {
    fetch('/api/settings/cutoff')
      .then((r) => r.json())
      .then((data) => setCutoffConfig({ hour: data.cutoffHour, minute: data.cutoffMinute }))
      .catch(console.error)
  }, [])

  const days = useMemo(() => {
    const todayStart = startOfLocalDay(today)

    return getWeekdaysForOffset(today, weekOffset, cutoffConfig ?? undefined).map((day) => {
      const isPastOrToday = day.date <= todayStart
      const rawStatus = getStatusForDate(day.dateKey)

      return {
        ...day,
        locked: day.locked || isPastOrToday,
        status: (rawStatus || "eating") as Status,
        isDefault: rawStatus === null,
      }
    })
  }, [today, weekOffset, getStatusForDate, cutoffConfig])

  const row1 = useMemo(() => days.slice(0, 2), [days])
  const row2 = useMemo(() => days.slice(2, 5), [days])

  const eatingCount = days.filter((day) => day.status === "eating").length
  const openCount = days.filter((day) => !day.locked && day.isWorkday).length
  const weekRangeLabel = days.length > 0
    ? `Tuần ${formatWeekRangeDate(days[0].date)} - ${formatWeekRangeDate(days[4].date)}`
    : "Tuần này"

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleStatusChange = async (dateKey: string, status: Status) => {
    const success = await setStatus(dateKey, status)
    if (success) {
      showNotification(status === "eating" ? "Đã đăng ký ăn" : "Đã đăng ký không ăn", "success")
    } else {
      showNotification(error || "Cập nhật thất bại", "error")
    }
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Báo Cơm</h1>
          <p className="text-base text-ink-muted-80 mt-2">
            Xem tuần hiện tại và 4 tuần tới. Bạn chỉ chỉnh được các ngày tương lai chưa khóa.
          </p>
        </div>
      </header>

      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto space-y-8">
          <div className="rounded-[18px] bg-surface-container-low p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-ink">{weekRangeLabel}</div>
                {weekOffset === 0 && (
                  <div className="text-xs font-semibold text-primary mt-1">Tuần hiện tại</div>
                )}
              </div>
              <div className="text-sm text-ink-muted-80">{weekOffset + 1}/5</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={weekOffset === 0}
                onClick={() => setWeekOffset((value) => Math.max(0, value - 1))}
                className="rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                ← Tuần trước
              </button>
              <button
                type="button"
                disabled={weekOffset === MAX_BOOKING_WEEK_OFFSET}
                onClick={() => setWeekOffset((value) => Math.min(MAX_BOOKING_WEEK_OFFSET, value + 1))}
                className="rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                Tuần sau →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[18px] bg-surface-container-low p-5">
              <div className="text-2xl font-semibold text-ink">{eatingCount}</div>
              <div className="text-sm text-ink-muted-80 mt-1">Có ăn</div>
            </div>
            <div className="rounded-[18px] bg-surface-container-low p-5">
              <div className="text-2xl font-semibold text-ink">{openCount}</div>
              <div className="text-sm text-ink-muted-80 mt-1">Còn sửa được</div>
            </div>
          </div>

          {loading && (
            <div className="rounded-[18px] bg-surface-container-low p-5 text-ink-muted-80">
              Đang tải lịch báo cơm...
            </div>
          )}

          {!loading && days.length > 0 && openCount === 0 && (
            <div className="rounded-[18px] bg-surface-container-low p-5 text-ink-muted-80">
              Không còn ngày nào mở để chỉnh sửa trong tuần này.
            </div>
          )}

          {!loading && days.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {/* Desktop: 5 columns — render all days */}
              {days.map((day) => (
                <DayCard key={day.dateKey} day={day} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </div>
      </main>

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

type Day = ReturnType<typeof useRegistrations> extends ReturnType<typeof useRegistrations>
  ? { dateKey: string; dayName: string; date: Date; cutoffAt: Date; locked: boolean; isWorkday: boolean; status: Status; isDefault: boolean }
  : never

function DayCard({ day, onStatusChange }: { day: Day; onStatusChange: (dateKey: string, status: Status) => void }) {
  const isEating = day.status === "eating"
  const isNotEating = day.status === "not-eating"

  return (
    <div
      data-testid={`book-day-${day.dateKey}`}
      className={`
        relative p-4 rounded-[18px] border-2 transition-all duration-200
        ${day.locked ? "opacity-60" : ""}
        ${isEating ? "border-success bg-success-bg" : ""}
        ${isNotEating ? "border-error bg-error-bg" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-ink">{day.dayName}</span>
            <span className="text-2xl font-bold text-ink">{day.date.getDate()}</span>
          </div>
          <div className="text-xs text-ink-muted-80 mt-1">
            Khóa lúc {day.cutoffAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày {day.cutoffAt.toLocaleDateString("vi-VN")}
          </div>
        </div>

        {day.locked && (
          <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-xs font-semibold text-ink-muted-80">
            Đã khóa
          </span>
        )}
      </div>

      <div className="mb-3">
        {day.locked ? (
          <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-xs font-medium text-ink-muted-80">
            Đã chốt
          </span>
        ) : isNotEating ? (
          <span className="px-2.5 py-1 rounded-full bg-error-bg text-xs font-medium text-error">
            Đã báo nghỉ
          </span>
        ) : isEating && !day.isDefault ? (
          <span className="px-2.5 py-1 rounded-full bg-success-bg text-xs font-medium text-success">
            Đã đăng ký
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
            Mặc định có cơm
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={day.locked || isEating}
          onClick={() => onStatusChange(day.dateKey, "eating")}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            isEating ? "border-success bg-success text-on-primary" : "border-hairline bg-canvas text-ink"
          } ${day.locked ? "cursor-not-allowed opacity-50" : "active:scale-95"}`}
        >
          Có ăn
        </button>
        <button
          type="button"
          disabled={day.locked || isNotEating}
          onClick={() => onStatusChange(day.dateKey, "not-eating")}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            isNotEating ? "border-error bg-error text-on-primary" : "border-hairline bg-canvas text-ink"
          } ${day.locked ? "cursor-not-allowed opacity-50" : "active:scale-95"}`}
        >
          Không ăn
        </button>
      </div>
    </div>
  )
}