"use client"

import { useState, useMemo } from "react"
import * as XLSX from "xlsx"

interface ReportRow {
  stt: number
  name: string
  phone: string
  date: string
}

const mockEmployees = [
  { id: "1", name: "Nguyễn Văn A", phone: "0912345678" },
  { id: "2", name: "Trần Thị B", phone: "0912345679" },
  { id: "3", name: "Lê Văn C", phone: "0912345680" },
  { id: "4", name: "Phạm Thị D", phone: "0912345681" },
  { id: "5", name: "Hoàng Văn E", phone: "0912345682" },
  { id: "6", name: "Võ Thị F", phone: "0912345683" },
  { id: "7", name: "Đặng Văn G", phone: "0912345684" },
]

function generateReportData(type: "day" | "week" | "month", dateStr?: string): ReportRow[] {
  const result: ReportRow[] = []
  let dates: string[] = []

  const now = new Date()
  const formatDateStr = (d: Date) => {
    const day = d.getDate().toString().padStart(2, "0")
    const month = (d.getMonth() + 1).toString().padStart(2, "0")
    return `${day}/${month}`
  }

  if (type === "day" && dateStr) {
    dates = [dateStr]
  } else if (type === "week") {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      if (d.getDay() !== 0) { // Skip Sunday
        dates.push(formatDateStr(d))
      }
    }
  } else if (type === "month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i)
      if (d.getDay() !== 0) { // Skip Sunday
        dates.push(formatDateStr(d))
      }
    }
  }

  let stt = 1
  mockEmployees.forEach((emp) => {
    const numDays = Math.floor(Math.random() * dates.length * 0.7) + 1
    const registeredDays = dates.slice(0, numDays)
    registeredDays.forEach((d) => {
      result.push({
        stt: stt++,
        name: emp.name,
        phone: emp.phone,
        date: d,
      })
    })
  })

  return result
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
  const [hasPreview, setHasPreview] = useState(false)

  const weekOptions = useMemo(() => getWeekOptions(), [])
  const monthOptions = useMemo(() => getMonthOptions(), [])

  const handlePreview = () => {
    let date: string | undefined
    if (reportType === "day") {
      date = selectedDate
    } else if (reportType === "week") {
      date = weekOptions[selectedWeekIndex]?.label
    } else if (reportType === "month") {
      date = monthOptions[selectedMonthIndex]?.label
    }
    const data = generateReportData(reportType, date)
    setPreviewData(data)
    setHasPreview(true)
  }

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

  const todayStr = new Date().toISOString().split("T")[0]

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <p className="text-sm text-ink-muted-80 mb-1">Báo cáo</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Xuất Báo Cáo</h1>
          <p className="text-sm text-ink-muted-80 mt-1">Tạo báo cáo suất ăn cho bếp nấu theo ngày, tuần hoặc tháng</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto space-y-5">
          {/* Report Type Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "day" as const, icon: "today", label: "Theo ngày" },
              { id: "week" as const, icon: "date_range", label: "Theo tuần" },
              { id: "month" as const, icon: "calendar_month", label: "Theo tháng" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => { setReportType(type.id); setHasPreview(false) }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  reportType === type.id
                    ? "border-primary bg-primary/5"
                    : "border-hairline hover:border-primary/50"
                }`}
              >
                <span className={`material-symbols-outlined text-2xl mb-2 block ${reportType === type.id ? "text-primary" : "text-ink-muted-48"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {type.icon}
                </span>
                <span className={`text-sm font-medium ${reportType === type.id ? "text-primary" : "text-ink"}`}>{type.label}</span>
              </button>
            ))}
          </div>

          {/* Date Selector */}
          <div className="p-4 rounded-xl bg-surface-container-low flex flex-wrap items-center gap-3">
            {reportType === "day" && (
              <>
                <label className="text-sm font-medium text-ink-muted-80">Ngày:</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} max={todayStr} className="form-input w-auto" />
              </>
            )}
            {reportType === "week" && (
              <>
                <label className="text-sm font-medium text-ink-muted-80">Tuần:</label>
                <select value={selectedWeekIndex} onChange={(e) => setSelectedWeekIndex(parseInt(e.target.value))} className="form-input w-auto">
                  {weekOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>{opt.label}</option>
                  ))}
                </select>
              </>
            )}
            {reportType === "month" && (
              <>
                <label className="text-sm font-medium text-ink-muted-80">Tháng:</label>
                <select value={selectedMonthIndex} onChange={(e) => setSelectedMonthIndex(parseInt(e.target.value))} className="form-input w-auto">
                  {monthOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>{opt.label}</option>
                  ))}
                </select>
              </>
            )}
            <button
              onClick={handlePreview}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all"
            >
              <span className="material-symbols-outlined text-lg">preview</span>
              Xem trước
            </button>
          </div>

          {/* Preview */}
          {hasPreview && (
            <div>
              {previewData.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-ink">{previewData.length}</span>
                    <span className="text-sm text-ink-muted-80">suất ăn</span>
                  </div>
                  <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white bg-success hover:bg-success/90 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Tải Excel
                  </button>
                </div>
              )}

              <div className="rounded-2xl bg-surface-container-low border border-hairline overflow-hidden">
                {previewData.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm text-ink-muted-80">Không có dữ liệu cho khoảng thời gian đã chọn</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-container border-b border-hairline">
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">STT</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Họ tên</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">SĐT</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Ngày</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {previewData.slice(0, 10).map((row, idx) => (
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
                )}
                {previewData.length > 10 && (
                  <div className="p-3 border-t border-hairline text-center">
                    <span className="text-xs text-ink-muted-48">+{previewData.length - 10} bản ghi nữa</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}