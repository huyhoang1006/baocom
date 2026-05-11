"use client"

import { useState } from "react"

interface Employee {
  id: string
  name: string
  initials: string
  department: string
  status: "registered" | "not-eating" | "pending"
}

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const employees: Employee[] = [
    { id: "1", name: "Trần Tuấn Anh", initials: "TA", department: "Phòng Kỹ thuật", status: "registered" },
    { id: "2", name: "Lê Thị Mai Lan", initials: "LM", department: "Phòng Nhân sự", status: "not-eating" },
    { id: "3", name: "Hoàng Minh Quân", initials: "HQ", department: "Phòng Kinh doanh", status: "pending" },
    { id: "4", name: "Phạm Phương Thảo", initials: "PT", department: "Phòng Kế toán", status: "pending" },
    { id: "5", name: "Đặng Khôi Nguyên", initials: "DN", department: "Phòng Kỹ thuật", status: "registered" },
    { id: "6", name: "Nguyễn Thị Hương", initials: "NH", department: "Phòng Marketing", status: "registered" },
    { id: "7", name: "Vũ Đình Cường", initials: "VC", department: "Phòng Kỹ thuật", status: "not-eating" },
    { id: "8", name: "Trịnh Thị Mai", initials: "TM", department: "Phòng Nhân sự", status: "pending" },
  ]

  const stats = {
    registered: 142,
    notEating: 28,
    pending: 15,
    total: 185,
  }

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleRemind = (employee: Employee) => {
    showNotification("success", `Đã gửi nhắc nhở đến ${employee.name}`)
  }

  const handleExport = () => {
    showNotification("success", "Đang chuẩn bị báo cáo cho Cô Bếp...")
  }

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: Employee["status"]) => {
    switch (status) {
      case "registered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-success-bg text-success">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Có ăn
          </span>
        )
      case "not-eating":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-error-bg text-error">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
            Không ăn
          </span>
        )
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-warning-bg text-warning">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
            Chưa đăng ký
          </span>
        )
    }
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Notification Toast */}
      {notification && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success-bg text-success text-sm font-medium border border-success animate-slide-down"
        >
          <span className="material-symbols-outlined text-base">check_circle</span>
          {notification.message}
        </div>
      )}

      {/* Page Header */}
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm text-ink-muted-80 mb-1">Bảng quản trị</p>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Dashboard</h1>
            <p className="text-sm text-ink-muted-80 mt-1">Thống kê đăng ký suất ăn trưa ngày hôm nay</p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all press-effect"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Xuất báo cáo
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--color-healthy-bg)", border: "1px solid var(--color-healthy)" }}>
              <p className="text-sm font-medium text-healthy mb-1">Đăng ký ăn</p>
              <span className="text-3xl font-bold text-ink">{stats.registered}</span>
              <p className="text-xs text-ink-muted-48 mt-0.5">suất ăn</p>
            </div>
            <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--color-surface-container-low)", border: "1px solid var(--color-hairline)" }}>
              <p className="text-sm font-medium text-ink-muted-80 mb-1">Vắng mặt</p>
              <span className="text-3xl font-bold text-ink">{stats.notEating}</span>
              <p className="text-xs text-ink-muted-48 mt-0.5">nhân viên</p>
            </div>
            <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--color-warm-accent-bg)", border: "1px solid var(--color-warm-accent)" }}>
              <p className="text-sm font-medium text-warm-accent mb-1">Chưa đăng ký</p>
              <span className="text-3xl font-bold text-ink">{stats.pending}</span>
              <p className="text-xs text-ink-muted-48 mt-0.5">nhân viên</p>
            </div>
          </div>

          {/* Employee List */}
          <div className="rounded-2xl bg-surface-container-low border border-hairline overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-hairline flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-base font-semibold text-ink">Danh sách nhân viên</h3>
              <div className="relative w-full sm:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-ink-muted-48 text-lg">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-surface-container border border-hairline focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container border-b border-hairline">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Họ tên</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Phòng ban</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Trạng thái</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className={`hover:bg-surface-container-low transition-colors ${
                        employee.status === "pending" ? "bg-warning-bg/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs ${
                            employee.status === "pending"
                              ? "bg-warning/20 text-warning"
                              : "bg-surface-container text-ink-muted-80"
                          }`}>
                            {employee.initials}
                          </div>
                          <span className="font-medium text-ink text-sm">{employee.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-ink-muted-80">{employee.department}</td>
                      <td className="py-3 px-4">{getStatusBadge(employee.status)}</td>
                      <td className="py-3 px-4 text-right">
                        {employee.status === "pending" ? (
                          <button
                            onClick={() => handleRemind(employee)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-warning text-white hover:bg-warning/90"
                          >
                            <span className="material-symbols-outlined text-base">campaign</span>
                            Nhắc nhở
                          </button>
                        ) : (
                          <span className="material-symbols-outlined text-ink-muted-48 cursor-pointer">more_vert</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-hairline flex items-center justify-between">
              <span className="text-xs text-ink-muted-80">Hiển thị 1-8/{stats.total}</span>
              <div className="flex items-center gap-1">
                <button className="min-w-9 min-h-9 px-3 py-2 rounded-lg flex items-center justify-center text-ink-muted-48 hover:bg-surface-container disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="min-w-9 min-h-9 px-3 py-2 rounded-lg flex items-center justify-center bg-primary text-white text-xs font-medium">1</button>
                <button className="min-w-9 min-h-9 px-3 py-2 rounded-lg flex items-center justify-center text-ink hover:bg-surface-container text-xs">2</button>
                <button className="min-w-9 min-h-9 px-3 py-2 rounded-lg flex items-center justify-center text-ink hover:bg-surface-container text-xs">3</button>
                <button className="min-w-9 min-h-9 px-3 py-2 rounded-lg flex items-center justify-center text-ink hover:bg-surface-container">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}