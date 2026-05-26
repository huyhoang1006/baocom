"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { adminReportsApi } from "@/lib/api"
import { toDateKey } from "@/lib/registrationWindow"

interface ReportRow {
  stt: number
  name: string
  phone: string
  date: string
  status: string
}

interface AggregatedUser {
  name: string
  phone: string
  eating: number
  notEating: number
}

function formatDisplayDate(date: Date): string {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  const dayName = days[date.getDay()]
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  return `${dayName}, ${day}/${month}`
}

function getWeekOptions(): { label: string; start: Date; end: Date }[] {
  const weeks = []
  const now = new Date()
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1 - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weeks.push({
      label: `${formatDisplayDate(weekStart)} - ${formatDisplayDate(weekEnd)}`,
      start: weekStart,
      end: weekEnd,
    })
  }
  return weeks
}

function getMonthOptions(): { label: string; year: number; month: number }[] {
  const months = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    })
  }
  return months
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"day" | "week" | "month">("day")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0)
  const [rawData, setRawData] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const weekOptions = useMemo(() => getWeekOptions(), [])
  const monthOptions = useMemo(() => getMonthOptions(), [])

  const todayStr = toDateKey(new Date())

  const dateRangeLabel = useMemo(() => {
    if (reportType === "day" && selectedDate) {
      return `Ngày ${selectedDate}`
    } else if (reportType === "week") {
      return weekOptions[selectedWeekIndex]?.label || ""
    } else if (reportType === "month") {
      return monthOptions[selectedMonthIndex]?.label || ""
    }
    return ""
  }, [reportType, selectedDate, selectedWeekIndex, selectedMonthIndex, weekOptions, monthOptions])

  const aggregatedData = useMemo(() => {
    const userMap: Record<string, AggregatedUser> = {}

    rawData.forEach(r => {
      if (!userMap[r.name]) {
        userMap[r.name] = { name: r.name, phone: r.phone, eating: 0, notEating: 0 }
      }
      if (r.status === 'eating' || r.status === 'registered') {
        userMap[r.name].eating++
      } else if (r.status === 'not_eating') {
        userMap[r.name].notEating++
      }
    })

    return Object.values(userMap).map((user, idx) => ({
      stt: idx + 1,
      ...user
    }))
  }, [rawData])

  const totals = useMemo(() => {
    return aggregatedData.reduce((acc, user) => ({
      eating: acc.eating + user.eating,
      notEating: acc.notEating + user.notEating
    }), { eating: 0, notEating: 0 })
  }, [aggregatedData])

  const handlePreview = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let startDate: string
      let endDate: string

      if (reportType === "day" && selectedDate) {
        startDate = endDate = selectedDate
      } else if (reportType === "week") {
        const opt = weekOptions[selectedWeekIndex]
        if (opt) {
          startDate = toDateKey(opt.start)
          endDate = toDateKey(opt.end)
        } else {
          throw new Error("Vui lòng chọn tuần")
        }
      } else if (reportType === "month") {
        const opt = monthOptions[selectedMonthIndex]
        if (opt) {
          const lastDay = new Date(opt.year, opt.month, 0).getDate()
          startDate = `${opt.year}-${String(opt.month).padStart(2, '0')}-01`
          endDate = `${opt.year}-${String(opt.month).padStart(2, '0')}-${lastDay}`
        } else {
          throw new Error("Vui lòng chọn tháng")
        }
      } else {
        throw new Error("Vui lòng chọn ngày")
      }

      // Fetch raw data with status included
      const params = new URLSearchParams({ startDate, endDate })
      const data = await adminReportsApi.getReport(startDate, endDate, false)

      const rows: ReportRow[] = (data.reportData || []).map((r: { stt: number; name: string; phone: string; date: string; status?: string }, idx: number) => ({
        stt: idx + 1,
        name: r.name || '',
        phone: r.phone || '',
        date: r.date || '',
        status: (r as { status?: string }).status || 'eating',
      }))

      setRawData(rows)
      setShowAll(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải báo cáo")
      setRawData([])
    } finally {
      setLoading(false)
    }
  }, [reportType, selectedDate, selectedWeekIndex, selectedMonthIndex, weekOptions, monthOptions])

  const handleDateChange = useCallback(() => {
    handlePreview()
  }, [handlePreview])

  const handleReportTypeChange = useCallback((type: "day" | "week" | "month") => {
    setReportType(type)
    setRawData([])
  }, [])

  useEffect(() => {
    if (selectedDate) {
      handlePreview()
    }
  }, [reportType, handlePreview])

  const handleExport = useCallback(() => {
    let startDate: string
    let endDate: string

    if (reportType === "day" && selectedDate) {
      startDate = endDate = selectedDate
    } else if (reportType === "week") {
      const opt = weekOptions[selectedWeekIndex]
      if (opt) {
        startDate = toDateKey(opt.start)
        endDate = toDateKey(opt.end)
      } else {
        return
      }
    } else if (reportType === "month") {
      const opt = monthOptions[selectedMonthIndex]
      if (opt) {
        const lastDay = new Date(opt.year, opt.month, 0).getDate()
        startDate = `${opt.year}-${String(opt.month).padStart(2, '0')}-01`
        endDate = `${opt.year}-${String(opt.month).padStart(2, '0')}-${lastDay}`
      } else {
        return
      }
    } else {
      return
    }

    const url = adminReportsApi.exportXlsxUrl(startDate, endDate)
    window.open(url, '_blank')
  }, [reportType, selectedDate, selectedWeekIndex, selectedMonthIndex, weekOptions, monthOptions])

  const displayedData = useMemo(() => showAll ? aggregatedData : aggregatedData.slice(0, 5), [showAll, aggregatedData])

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-8 pb-6 px-4 sm:pt-12 sm:pb-8 sm:px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-[24px] sm:text-[28px] text-primary">restaurant</span>
            <p className="text-xs sm:text-sm font-medium text-ink-muted-48 uppercase tracking-wider">Báo cáo</p>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-ink mb-1">Xuất Báo Cáo</h1>
          <p className="text-sm sm:text-base text-ink-muted-48">Tạo báo cáo suất ăn cho bếp nấu theo ngày, tuần hoặc tháng</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto space-y-4 sm:space-y-6">
          {/* Error State */}
          {error && (
            <div className="p-4 rounded-[18px] bg-error-bg border border-error text-error">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Report Type Selector */}
          <div className="rounded-[18px] bg-surface-container-low p-1 flex">
            {[
              { id: "day" as const, label: "Ngày", icon: "today" },
              { id: "week" as const, label: "Tuần", icon: "date_range" },
              { id: "month" as const, label: "Tháng", icon: "calendar_month" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => handleReportTypeChange(type.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[14px] text-sm font-medium transition-all ${
                  reportType === type.id
                    ? "bg-canvas shadow-sm text-ink"
                    : "text-ink-muted-48 hover:text-ink"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>

          {/* Date Selector */}
          <div className="rounded-[18px] bg-canvas border border-hairline p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-ink-muted-48">
                <span className="material-symbols-outlined text-xl">schedule</span>
                <span className="text-sm font-medium">Phạm vi:</span>
              </div>

              <div className="flex-1">
                {reportType === "day" && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      handleDateChange()
                    }}
                    max={todayStr}
                    className="form-input w-full sm:max-w-[240px]"
                  />
                )}
                {reportType === "week" && (
                  <select
                    value={selectedWeekIndex}
                    onChange={(e) => {
                      setSelectedWeekIndex(parseInt(e.target.value))
                      handleDateChange()
                    }}
                    className="form-input w-full sm:max-w-[280px]"
                  >
                    {weekOptions.map((opt, idx) => (
                      <option key={idx} value={idx}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
                {reportType === "month" && (
                  <select
                    value={selectedMonthIndex}
                    onChange={(e) => {
                      setSelectedMonthIndex(parseInt(e.target.value))
                      handleDateChange()
                    }}
                    className="form-input w-full sm:max-w-[240px]"
                  >
                    {monthOptions.map((opt, idx) => (
                      <option key={idx} value={idx}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={handlePreview}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">{loading ? "hourglass" : "search"}</span>
                {loading ? "Đang tải..." : "Tra cứu"}
              </button>
            </div>
          </div>

          {/* Stats Section */}
          {aggregatedData.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
              <div className="rounded-[18px] bg-canvas border border-hairline p-5 sm:p-6">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-ink leading-none">{aggregatedData.length}</span>
                    <span className="text-base text-ink-muted-48">nhân viên</span>
                  </div>
                  <div className="h-10 w-px bg-hairline hidden sm:block" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-[24px] sm:text-[32px] font-semibold tracking-tight text-success">{totals.eating}</span>
                    <span className="text-sm text-ink-muted-48">suất ăn</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[24px] sm:text-[32px] font-semibold tracking-tight text-error">{totals.notEating}</span>
                    <span className="text-sm text-ink-muted-48">suất hủy</span>
                  </div>
                  <span className="ml-0 sm:ml-2 px-3 py-1 rounded-full bg-primary-bg text-primary text-xs sm:text-sm font-medium">
                    {dateRangeLabel}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-all"
                >
                  <span className="material-symbols-outlined text-lg">table</span>
                  Excel
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {aggregatedData.length > 0 && (
            <div className="rounded-[18px] bg-canvas border border-hairline overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[48px_1fr_100px_100px] gap-4 px-5 py-4 bg-surface-container-low border-b border-hairline">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted-48">STT</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted-48">Họ tên</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted-48">Tổng báo cơm</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted-48">Báo cắt cơm</span>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-hairline">
                {displayedData.map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[48px_1fr_100px_100px] gap-4 px-5 py-4 hover:bg-surface-container-low transition-colors"
                  >
                    <span className="text-sm text-ink-muted-48">{row.stt}</span>
                    <span className="text-sm font-medium text-ink">{row.name}</span>
                    <span className="text-sm text-success font-medium">{row.eating}</span>
                    <span className="text-sm text-error font-medium">{row.notEating}</span>
                  </div>
                ))}
              </div>

              {/* Summary Row */}
              {aggregatedData.length > 0 && (
                <div className="grid grid-cols-[48px_1fr_100px_100px] gap-4 px-5 py-4 bg-surface-container-low border-t border-hairline font-semibold">
                  <span className="text-sm text-ink-muted-48"></span>
                  <span className="text-sm text-ink">Tổng cộng</span>
                  <span className="text-sm text-success">{totals.eating}</span>
                  <span className="text-sm text-error">{totals.notEating}</span>
                </div>
              )}

              {/* Expandable */}
              {aggregatedData.length > 5 && (
                <div className="p-4 border-t border-hairline text-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                  >
                    {showAll ? "Thu gọn" : `Xem thêm ${aggregatedData.length - 5} nhân viên`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && aggregatedData.length === 0 && reportType && (
            <div className="rounded-[18px] bg-surface-container-low border border-hairline border-dashed py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-ink-muted-48 mb-4">assignment</span>
              <p className="text-base text-ink-muted-80 mb-1">Chưa có dữ liệu báo cáo</p>
              <p className="text-sm text-ink-muted-48">Chọn phạm vi thời gian và nhấn "Tra cứu" để xem</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}