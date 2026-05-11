"use client"

import { useState, useMemo } from "react"

interface HistoryEntry {
  date: string
  status: "Có ăn" | "Không ăn"
  note?: string
}

const mockHistoryData: HistoryEntry[] = [
  { date: "2024-05-06", status: "Có ăn", note: "" },
  { date: "2024-05-07", status: "Có ăn", note: "" },
  { date: "2024-05-08", status: "Không ăn", note: "Đi công trường" },
  { date: "2024-05-09", status: "Có ăn", note: "" },
  { date: "2024-05-10", status: "Không ăn", note: "Nghỉ phép" },
  { date: "2024-05-13", status: "Có ăn", note: "" },
  { date: "2024-05-14", status: "Có ăn", note: "" },
  { date: "2024-05-15", status: "Có ăn", note: "" },
  { date: "2024-05-16", status: "Không ăn", note: "Công tác" },
  { date: "2024-05-17", status: "Có ăn", note: "" },
  { date: "2024-05-20", status: "Có ăn", note: "" },
  { date: "2024-05-21", status: "Có ăn", note: "" },
  { date: "2024-05-22", status: "Không ăn", note: "Họp/Tập huấn" },
  { date: "2024-05-23", status: "Có ăn", note: "" },
  { date: "2024-05-24", status: "Có ăn", note: "" },
]

function formatDate(dateStr: string): { day: string; month: string; weekday: string } {
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  const weekday = weekdays[date.getDay()]
  return { day, month, weekday }
}

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(date)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function getMonthBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function isInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<"week" | "month" | "custom">("week")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  const mockUser = {
    username: "hungpx",
    fullName: "Phạm Xuân Hùng",
  }

  const filteredData = useMemo(() => {
    const now = new Date()

    return mockHistoryData.filter((entry) => {
      const entryDate = new Date(entry.date)

      if (filter === "week") {
        const { start, end } = getWeekBounds(now)
        return isInRange(entryDate, start, end)
      } else if (filter === "month") {
        const { start, end } = getMonthBounds(now)
        return isInRange(entryDate, start, end)
      } else if (filter === "custom" && customStart && customEnd) {
        const start = new Date(customStart)
        const end = new Date(customEnd)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        return isInRange(entryDate, start, end)
      }
      return true
    })
  }, [filter, customStart, customEnd])

  const stats = useMemo(() => {
    const total = filteredData.length
    const eating = filteredData.filter((e) => e.status === "Có ăn").length
    const notEating = filteredData.filter((e) => e.status === "Không ăn").length
    return {
      total,
      eating,
      notEating,
      eatingPercent: total > 0 ? Math.round((eating / total) * 100) : 0,
      notEatingPercent: total > 0 ? Math.round((notEating / total) * 100) : 0,
    }
  }, [filteredData])

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <p className="text-sm text-ink-muted-80 mb-1">Lịch sử đăng ký</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Lịch Sử Đăng Ký</h1>
          <p className="text-sm text-ink-muted-80 mt-1">Xin chào, <span className="font-semibold text-ink">{mockUser.fullName}</span></p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto space-y-5">
          {/* Filter Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto py-2">
            {(["week", "month", "custom"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`min-w-[80px] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-primary text-white"
                    : "text-ink-muted-80 hover:text-ink"
                }`}
              >
                {f === "week" ? "Tuần" : f === "month" ? "Tháng" : "Chọn ngày"}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          {filter === "custom" && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-low">
              <label className="text-sm font-medium text-ink-muted-80">Từ:</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="form-input w-auto" />
              <label className="text-sm font-medium text-ink-muted-80">Đến:</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="form-input w-auto" />
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low">
              <p className="text-xs text-ink-muted-80 mb-1">Tổng ngày</p>
              <span className="text-2xl font-bold text-ink">{stats.total}</span>
            </div>
            <div className="p-4 rounded-xl bg-success-bg">
              <p className="text-xs font-medium text-success mb-1">Có ăn</p>
              <span className="text-2xl font-bold text-success">{stats.eating}</span>
              <span className="text-xs text-success/80 ml-1">({stats.eatingPercent}%)</span>
            </div>
            <div className="p-4 rounded-xl bg-error-bg">
              <p className="text-xs font-medium text-error mb-1">Không ăn</p>
              <span className="text-2xl font-bold text-error">{stats.notEating}</span>
              <span className="text-xs text-error/80 ml-1">({stats.notEatingPercent}%)</span>
            </div>
          </div>

          {/* History Table */}
          <div className="rounded-2xl bg-surface-container-low border border-hairline overflow-hidden">
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <span className="material-symbols-outlined w-12 h-12 text-ink-muted-48">history</span>
                <p className="text-sm text-ink-muted-80">Chưa có đăng ký nào trong khoảng thời gian này</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container border-b border-hairline">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Ngày</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredData.map((entry, index) => {
                    const { day, month, weekday } = formatDate(entry.date)
                    const isEating = entry.status === "Có ăn"

                    return (
                      <tr key={index} className="hover:bg-surface-container-low">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${
                              isEating ? "bg-success-bg" : "bg-error-bg"
                            }`}>
                              <span className={`text-sm font-bold ${isEating ? "text-success" : "text-error"}`}>{day}</span>
                              <span className={`text-[10px] ${isEating ? "text-success/80" : "text-error/80"}`}>{month}</span>
                            </div>
                            <span className="text-sm font-medium text-ink">{weekday}, {day}/{month}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            isEating ? "bg-success-bg text-success" : "bg-error-bg text-error"
                          }`}>
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {isEating ? "check_circle" : "cancel"}
                            </span>
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-ink-muted-80">
                          {entry.note || "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}