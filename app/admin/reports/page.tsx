"use client"

import { useState, useMemo, useCallback } from "react"
import { adminReportsApi } from "@/lib/api"
import { toDateKey } from "@/lib/registrationWindow"

interface ReportRow {
  stt: number
  name: string
  username: string
  department: string
  eating: number
  notEating: number
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState(() => toDateKey(new Date()))
  const [toDate, setToDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 6)
    return toDateKey(d)
  })
  const [rows, setRows] = useState<ReportRow[]>([])
  const [holidays, setHolidays] = useState<Array<{ dateKey: string; description: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const dateRangeLabel = fromDate && toDate ? `${fromDate} → ${toDate}` : ""

  const aggregatedData = rows

  const totals = useMemo(() => {
    return rows.reduce((acc, user) => ({
      eating: acc.eating + user.eating,
      notEating: acc.notEating + user.notEating
    }), { eating: 0, notEating: 0 })
  }, [rows])

  const handlePreview = useCallback(async () => {
    if (!fromDate || !toDate) {
      setError("Vui lòng chọn từ ngày và đến ngày")
      return
    }
    if (fromDate > toDate) {
      setError("Từ ngày phải trước đến ngày")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await adminReportsApi.getReport(fromDate, toDate)
      setRows(data.rows || [])
      setHolidays(data.holidays || [])
      setShowAll(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải báo cáo")
      setRows([])
      setHolidays([])
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate])

  const handleExport = useCallback(() => {
    if (!fromDate || !toDate || fromDate > toDate) return
    const url = adminReportsApi.exportXlsxUrl(fromDate, toDate)
    window.open(url, '_blank')
  }, [fromDate, toDate])

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
          <p className="text-sm sm:text-base text-ink-muted-48">Chọn khoảng thời gian để xem báo cáo suất ăn</p>
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

          {/* Date Selector */}
          <div className="rounded-[18px] bg-canvas border border-hairline p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex items-center gap-2 text-ink-muted-48 self-center">
                <span className="material-symbols-outlined text-xl">schedule</span>
                <span className="text-sm font-medium">Phạm vi:</span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-muted-48">Từ</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="form-input w-full sm:w-[200px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-muted-48">Đến</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="form-input w-full sm:w-[200px]"
                  />
                </div>
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

          {/* Ngày lễ trong kỳ */}
          {aggregatedData.length > 0 && holidays.length > 0 && (
            <div className="rounded-[18px] bg-warning-bg border border-warning p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-warning">event_busy</span>
                <span className="text-sm font-semibold text-warning">Ngày lễ trong kỳ — không tính cơm</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {holidays.map((h) => (
                  <span key={h.dateKey} className="px-3 py-1 rounded-full bg-canvas text-xs font-medium text-ink border border-hairline">
                    {h.dateKey.split("-").reverse().slice(0, 2).join("/")}{h.description ? ` · ${h.description}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          {aggregatedData.length > 0 && (
            <div className="rounded-[18px] bg-canvas border border-hairline overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[48px_1fr_100px_100px_100px] gap-4 px-5 py-4 bg-surface-container-low border-b border-hairline">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted-48">STT</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted-48">Họ tên</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted-48">Phòng ban</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted-48">Tổng báo cơm</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted-48">Báo cắt cơm</span>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-hairline">
                {displayedData.map((row, idx) => {
                  const prevDept = idx > 0 ? displayedData[idx - 1].department : null
                  const showGroupHeader = row.department !== prevDept
                  return (
                    <div key={idx}>
                      {showGroupHeader && (
                        <div className="px-5 py-2 bg-primary-bg border-t border-hairline flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-primary">groups</span>
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                            {row.department || "Chưa có phòng ban"}
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-[48px_1fr_100px_100px_100px] gap-4 px-5 py-4 hover:bg-surface-container-low transition-colors">
                        <span className="text-sm text-ink-muted-48">{row.stt}</span>
                        <span className="text-sm font-medium text-ink">{row.name}</span>
                        <span className="text-sm text-ink">{row.department}</span>
                        <span className="text-sm text-success font-medium">{row.eating}</span>
                        <span className="text-sm text-error font-medium">{row.notEating}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary Row */}
              {aggregatedData.length > 0 && (
                <div className="grid grid-cols-[48px_1fr_100px_100px_100px] gap-4 px-5 py-4 bg-surface-container-low border-t border-hairline font-semibold">
                  <span className="text-sm text-ink-muted-48"></span>
                  <span className="text-sm text-ink">Tổng cộng</span>
                  <span className="text-sm text-ink"></span>
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
          {!loading && aggregatedData.length === 0 && (
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
