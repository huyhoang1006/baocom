"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { adminStatsApi } from "@/lib/api"

interface Stat {
  label: string
  value: number | string
  icon: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)
        const data = await adminStatsApi.getToday()
        setStats([
          { label: "Tổng nhân viên", value: data.stats.totalEmployees, icon: "group" },
          { label: "Đang ăn hôm nay", value: data.stats.eating, icon: "restaurant" },
          { label: "Không ăn", value: data.stats.notEating, icon: "no_meals" },
          { label: "Tỷ lệ đăng ký", value: `${data.stats.registrationRate}%`, icon: "pie_chart" },
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Dashboard</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-white">
              Admin
            </span>
          </div>
          <p className="text-sm text-ink-muted-80">
            Thống kê đăng ký suất ăn trưa ngày hôm nay
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
                onClick={() => window.location.reload()}
                className="text-sm underline mt-1"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-canvas border border-hairline rounded-[18px] p-5 animate-pulse"
                >
                  <div className="w-10 h-10 rounded-[11px] bg-surface-container mb-3" />
                  <div className="h-4 bg-surface-container rounded w-2/3 mb-2" />
                  <div className="h-10 bg-surface-container rounded w-1/2" />
                </div>
              ))
            ) : (
              stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-canvas border border-hairline rounded-[18px] p-5"
                >
                  <div className="w-10 h-10 rounded-[11px] bg-primary-bg flex items-center justify-center mb-3">
                    <span
                      className="material-symbols-outlined text-xl text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {stat.icon}
                    </span>
                  </div>
                  <p className="text-[14px] text-ink-muted-48 mb-1">{stat.label}</p>
                  <p className="text-[40px] font-semibold text-ink leading-none">
                    {stat.value}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-semibold text-ink-muted-80 mb-3 uppercase tracking-wider">
              Thao tác nhanh
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/reports"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all press-effect"
              >
                <span className="material-symbols-outlined text-lg">assessment</span>
                Xuất báo cáo
              </Link>
              <Link
                href="/admin/employees"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-low transition-all border border-hairline"
              >
                <span className="material-symbols-outlined text-lg">group</span>
                Quản lý nhân sự
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
