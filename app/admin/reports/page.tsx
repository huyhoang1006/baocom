"use client"

import { useState, useMemo, useEffect } from "react"
import * as XLSX from "xlsx"
import { adminReportsApi } from "@/lib/api"
import { toDateKey } from "@/lib/registrationWindow"

interface ReportRow {
  stt: number
  name: string
  phone: string
  date: string
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
  const [previewData, setPreviewData] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const weekOptions = useMemo(() => getWeekOptions(), [])
  const monthOptions = useMemo(() => getMonthOptions(), [])

  const todayStr = toDateKey(new Date())

  const handlePreview = async () => {
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

      const data = await adminReportsApi.getReport(startDate, endDate, false)

      const rows: ReportRow[] = (data.reportData || []).map((r, idx) => ({
        stt: idx + 1,
        name: r.name || '',
        phone: r.phone || '',
        date: r.date || '',
      }))

      setPreviewData(rows)
      setShowAll(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải báo cáo")
      setPreviewData([])
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = () => {
    handlePreview()
  }

  const handleReportTypeChange = (type: "day" | "week" | "month") => {
    setReportType(type)
    setPreviewData([])
  }

  useEffect(() => {
    if (selectedDate) {
      handlePreview()
    }
  }, [reportType])

  const handleExport = () => {
    if (previewData.length === 0) return

    const ws = XLSX.utils.json_to_sheet(previewData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "BaoCom Report")

    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = (today.getMonth() + 1).toString().padStart(2, "0")
    const dd = today.getDate().toString().padStart(2, "0")
    const filename = `BAOCOM_Report_${yyyy}${mm}${dd}.xlsx`

    XLSX.writeFile(wb, filename)
  }

  const displayedData = showAll ? previewData : previewData.slice(0, 5)

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <p className="text-sm text-ink-muted-80 mb-1">Báo cáo</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Xuất Báo Cáo</h1>
          <p className="text-sm text-ink-muted-80 mt-1">
            Tạo báo cáo suất ăn cho bếp nấu theo ngày, tuần hoặc tháng
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto space-y-5">
          {/* Error State */}
          {error && (
            <div className="p-4 rounded-[18px] bg-error-bg border border-error text-error">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Report Type Selector - 3 pills in a row */}
          <div className="flex items-center justify-center gap-2">
            {[
              { id: "day" as const, label: "Ngày" },
              { id: "week" as const, label: "Tuần" },
              { id: "month" as const, label: "Tháng" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => handleReportTypeChange(type.id)}
                className={`flex-1 max-w-[140px] py-3 px-6 rounded-full text-sm font-medium transition-all ${
                  reportType === type.id
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-ink hover:bg-surface-container"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Date Selector Card */}
          <div className="p-4 rounded-[18px] bg-surface-container-low flex flex-wrap items-center gap-3">
            {reportType === "day" && (
              <>
                <label className="text-sm font-medium text-ink-muted-80">Ngày:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    handleDateChange()
                  }}
                  max={todayStr}
                  placeholder="dd/mm/yyyy"
                  className="form-input w-auto rounded-full"
                />
              </>
            )}
            {reportType === "week" && (
              <>
                <label className="text-sm font-medium text-ink-muted-80">Tuần:</label>
                <select
                  value={selectedWeekIndex}
                  onChange={(e) => {
                    setSelectedWeekIndex(parseInt(e.target.value))
                    handleDateChange()
                  }}
                  className="form-input w-auto rounded-full"
                >
                  {weekOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </>
            )}
            {reportType === "month" && (
              <>
                <label className="text-sm font-medium text-ink-muted-80">Tháng:</label>
                <select
                  value={selectedMonthIndex}
                  onChange={(e) => {
                    setSelectedMonthIndex(parseInt(e.target.value))
                    handleDateChange()
                  }}
                  className="form-input w-auto rounded-full"
                >
                  {monthOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* Preview Button */}
          <div className="flex justify-center">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="w-full max-w-xs inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-on-primary bg-primary hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">{loading ? "hourglass" : "preview"}</span>
              {loading ? "Đang tải..." : "Xem trước"}
            </button>
          </div>

          {/* Preview Section */}
          {previewData.length > 0 && (
            <div className="space-y-4">
              {/* Stats and Export */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-[40px] font-bold text-ink">{previewData.length}</span>
                  <span className="text-sm text-ink-muted-80">suất ăn</span>
                </div>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-on-primary bg-primary hover:bg-primary-hover transition-all"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  Tải Excel
                </button>
              </div>

              {/* Table Preview Card */}
              <div className="rounded-[18px] bg-surface-container-low border border-hairline overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container border-b border-hairline">
                      <th className="text-left py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-ink-muted-80">STT</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-ink-muted-80">Họ tên</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-ink-muted-80">SĐT</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-ink-muted-80">Ngày</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {displayedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low">
                        <td className="py-3 px-4 text-sm text-ink-muted-80">{row.stt}</td>
                        <td className="py-3 px-4 text-sm font-medium text-ink">{row.name}</td>
                        <td className="py-3 px-4 text-sm text-ink-muted-80">{row.phone}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-xs text-ink">{row.date}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Expandable - Xem them */}
                {previewData.length > 5 && (
                  <div className="p-3 border-t border-hairline text-center">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="text-sm text-primary hover:text-primary-hover font-medium"
                    >
                      {showAll ? "Thu gọn" : `Xem thêm (+${previewData.length - 5} bản ghi)`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && previewData.length === 0 && reportType && (
            <div className="text-center py-12 text-ink-muted-80">
              <span className="material-symbols-outlined text-5xl mb-3">description</span>
              <p>Chọn ngày/tuần/tháng và nhấn "Xem trước" để xem báo cáo</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
