"use client"

import { useState, useEffect, useCallback } from "react"
import { adminStatsApi, type Stats } from "@/lib/api"
import { toDateKey, getNextWorkday } from "@/lib/registrationWindow"

interface Absence {
  name: string
  username: string
}

interface StatsData {
  stats: Stats
  dateKey: string
  absences: Absence[]
}

export default function AdminDashboard() {
  const tomorrowDate = getNextWorkday(new Date())
  const [selectedDate] = useState(() => toDateKey(tomorrowDate))
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async (date: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await adminStatsApi.getByDate(date)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats(selectedDate)
  }, [selectedDate, fetchStats])

  const stats = data?.stats
  const absences = data?.absences || []
  const todayStr = toDateKey(new Date())

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Dashboard — Ngày mai</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-white">
              Admin
            </span>
          </div>
          <p className="text-sm text-ink-muted-80">
            {tomorrowDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          
          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 rounded-[18px] bg-error-bg border border-error text-error">
              <p className="font-medium">Lỗi: {error}</p>
              <button
                onClick={() => fetchStats(selectedDate)}
                className="text-sm underline mt-1"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-canvas border border-hairline rounded-[18px] p-5 animate-pulse"
                >
                  <div className="w-10 h-10 rounded-[11px] bg-surface-container mb-3" />
                  <div className="h-4 bg-surface-container rounded w-2/3 mb-2" />
                  <div className="h-10 bg-surface-container rounded w-1/2" />
                </div>
              ))
            ) : stats ? (
              <>
                <StatCard icon="group" label="Tổng nhân viên" value={stats.totalEmployees} />
                <StatCard icon="restaurant" label="Có ăn" value={stats.eating} highlight />
                <StatCard icon="no_meals" label="Không ăn" value={stats.notEating} error />
                <StatCard icon="pending" label="Chưa đăng ký" value={stats.notRegistered} />
                <StatCard icon="how_to_reg" label="Đã đăng ký" value={stats.registered} />
                <StatCard icon="pie_chart" label="Tỷ lệ đăng ký" value={`${stats.registrationRate}%`} />
              </>
            ) : null}
          </div>

          {/* Absences List */}
          {!loading && absences.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-ink-muted-80 mb-3 uppercase tracking-wider">
                Nhân viên báo nghỉ ({absences.length})
              </h2>
              <div className="rounded-[18px] bg-surface-container-low border border-hairline overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container border-b border-hairline">
                      <th className="text-left py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-ink-muted-80">STT</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-ink-muted-80">Họ tên</th>
                      <th className="text-left py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-ink-muted-80">Username</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {absences.map((a, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low">
                        <td className="py-3 px-4 text-sm text-ink-muted-80">{idx + 1}</td>
                        <td className="py-3 px-4 text-sm font-medium text-ink">{a.name}</td>
                        <td className="py-3 px-4 text-sm text-ink-muted-80">@{a.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-semibold text-ink-muted-80 mb-3 uppercase tracking-wider">
              Thao tác nhanh
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => fetchStats(todayStr)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all press-effect"
              >
                <span className="material-symbols-outlined text-lg">today</span>
                Hôm nay
              </button>
              <a
                href="/admin/reports"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all press-effect"
              >
                <span className="material-symbols-outlined text-lg">assessment</span>
                Xuất báo cáo
              </a>
              <a
                href="/admin/employees"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-low transition-all border border-hairline"
              >
                <span className="material-symbols-outlined text-lg">group</span>
                Quản lý nhân sự
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, highlight, error: isError }: {
  icon: string
  label: string
  value: string | number
  highlight?: boolean
  error?: boolean
}) {
  return (
    <div className={`bg-canvas border rounded-[18px] p-5 ${isError ? "border-error" : highlight ? "border-success" : "border-hairline"}`}>
      <div className={`w-10 h-10 rounded-[11px] flex items-center justify-center mb-3 ${highlight ? "bg-success-bg" : "bg-primary-bg"}`}>
        <span
          className={`material-symbols-outlined text-xl ${highlight ? "text-success" : "text-primary"}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <p className="text-[14px] text-ink-muted-48 mb-1">{label}</p>
      <p className={`text-[40px] font-semibold leading-none ${isError ? "text-error" : highlight ? "text-success" : "text-ink"}`}>
        {value}
      </p>
    </div>
  )
}