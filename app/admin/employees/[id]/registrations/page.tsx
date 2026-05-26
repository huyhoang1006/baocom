"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"

interface Registration {
  id: string
  date: string
  status: string
  note: string | null
  createdAt: string
  overrides: Array<{
    originalStatus: string | null
    newStatus: string
    note: string | null
    performedAt: string
    performedBy: string
  }>
}

interface User {
  id: string
  name: string
  username: string
}

export default function EmployeeRegistrationHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [stats, setStats] = useState({ total: 0, eating: 0, notEating: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStart, setFilterStart] = useState("")
  const [filterEnd, setFilterEnd] = useState("")
  const [page, setPage] = useState(1)
  const LIMIT = 10

  useEffect(() => {
    async function fetchData() {
      try {
        const searchParams = new URLSearchParams()
        if (filterStart) searchParams.set("startDate", filterStart)
        if (filterEnd) searchParams.set("endDate", filterEnd)
        const query = searchParams.toString() ? `?${searchParams.toString()}` : ""

        const data = await apiFetch<{
          user: User
          registrations: Registration[]
          stats: { total: number; eating: number; notEating: number }
        }>(`/admin/employees/${userId}/registrations${query}`)

        setUser(data.user)
        setRegistrations(data.registrations)
        setStats(data.stats)
        setError(null)
      } catch (err) {
        console.error("Failed to load:", err)
        setError("Tải thất bại")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId, filterStart, filterEnd])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("vi-VN")
  }

  const totalPages = Math.ceil(registrations.length / LIMIT)
  const paginatedRegistrations = useMemo(() => {
    const start = (page - 1) * LIMIT
    return registrations.slice(start, start + LIMIT)
  }, [registrations, page])

  useEffect(() => {
    setPage(1)
  }, [filterStart, filterEnd])

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-canvas pb-12 flex items-start justify-center pt-12">
        <div className="bg-error-bg text-error px-6 py-4 rounded-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      <header className="pt-16 pb-4 px-4 lg:pt-12 lg:pb-8 lg:px-10">
        <div className="max-w-[1140px] mx-auto">
          <button
            onClick={() => router.push("/admin/employees")}
            className="flex items-center gap-2 text-primary hover:underline mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại Nhân Sự
          </button>
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-semibold text-base lg:text-lg lg:w-12 lg:h-12">
                {user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-ink lg:text-3xl">{user.name}</h1>
                <p className="text-sm text-ink-muted-48 lg:text-base">@{user.username}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="px-4 lg:px-10">
        <div className="max-w-[1140px] mx-auto space-y-4 lg:space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 lg:gap-4">
            <div className="bg-surface-container rounded-xl p-3 lg:p-4 text-center">
              <div className="text-2xl lg:text-3xl font-bold text-ink">{stats.total}</div>
              <div className="text-xs lg:text-sm text-ink-muted-48">Tổng ngày</div>
            </div>
            <div className="bg-surface-container rounded-xl p-3 lg:p-4 text-center">
              <div className="text-2xl lg:text-3xl font-bold text-success">{stats.eating}</div>
              <div className="text-xs lg:text-sm text-ink-muted-48">Ăn</div>
            </div>
            <div className="bg-surface-container rounded-xl p-3 lg:p-4 text-center">
              <div className="text-2xl lg:text-3xl font-bold text-error">{stats.notEating}</div>
              <div className="text-xs lg:text-sm text-ink-muted-48">Không ăn</div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
            <input
              type="date"
              value={filterStart}
              onChange={e => setFilterStart(e.target.value)}
              className="form-input h-10 w-full sm:w-36"
            />
            <span className="hidden sm:inline text-ink-muted-48">-</span>
            <input
              type="date"
              value={filterEnd}
              onChange={e => setFilterEnd(e.target.value)}
              className="form-input h-10 w-full sm:w-36"
            />
            <button
              onClick={() => { setFilterStart(""); setFilterEnd("") }}
              className="px-4 py-2 rounded-full text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high transition-colors w-full sm:w-auto"
            >
              Xóa lọc
            </button>
          </div>

          {/* Table - Desktop only */}
          <div className="hidden lg:block bg-canvas border border-hairline rounded-[18px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead className="sticky top-0 bg-canvas">
                  <tr className="border-b border-hairline">
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Ngày</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Trạng thái</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-ink-muted-48">
                        Không có lịch sử đặt cơm cho nhân viên này
                      </td>
                    </tr>
                  ) : (
                    paginatedRegistrations.map(reg => (
                      <tr key={reg.id} className="border-b border-hairline last:border-b-0 hover:bg-surface-container transition-colors">
                        <td className="px-4 py-3 text-sm text-ink">{formatDate(reg.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            reg.status === "eating" ? "bg-success-bg text-success" : "bg-error-bg text-error"
                          }`}>
                            {reg.status === "eating" ? "Ăn" : "Không ăn"}
                          </span>
                          {reg.overrides.length > 0 && (
                            <span className="ml-2 text-xs text-ink-muted-48" title="Có thay đổi">
                              ({reg.overrides.length} thay đổi)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-muted-80">
                          {reg.note || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards - Mobile only */}
          <div className="lg:hidden space-y-2">
            {registrations.length === 0 ? (
              <div className="bg-canvas border border-hairline rounded-xl px-4 py-10 text-center text-ink-muted-48">
                Không có lịch sử đặt cơm cho nhân viên này
              </div>
            ) : (
              paginatedRegistrations.map(reg => (
                <div key={reg.id} className="bg-canvas border border-hairline rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-ink">{formatDate(reg.date)}</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      reg.status === "eating" ? "bg-success-bg text-success" : "bg-error-bg text-error"
                    }`}>
                      {reg.status === "eating" ? "Ăn" : "Không ăn"}
                    </span>
                  </div>
                  {reg.note && (
                    <div className="text-xs text-ink-muted-48 mt-1">{reg.note}</div>
                  )}
                  {reg.overrides.length > 0 && (
                    <div className="text-xs text-ink-muted-48 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">info</span>
                      {reg.overrides.length} thay đổi
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-full hover:bg-surface-container text-ink-muted-80 hover:text-ink flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                      page === p
                        ? "bg-primary text-on-primary"
                        : "hover:bg-surface-container text-ink-muted-80 hover:text-ink"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-full hover:bg-surface-container text-ink-muted-80 hover:text-ink flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}