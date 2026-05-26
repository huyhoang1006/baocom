"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usersApi } from "@/lib/api"

interface Employee {
  id: string
  name: string
  username: string
  status: "active" | "inactive"
  createdAt: string
}

interface Credentials {
  username: string
  password: string
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null)
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [detailCredentials, setDetailCredentials] = useState<Credentials | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [page, setPage] = useState(1)
  const LIMIT = 10

  const [formData, setFormData] = useState({
    name: "",
    password: "",
  })

  const [formErrors, setFormErrors] = useState<{ name?: string }>({})

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true)
        setError(null)
        const data = await usersApi.getAll()
        setEmployees(data.users.map(u => ({
          id: u.id,
          name: u.name,
          username: u.username,
          status: u.isActive ? "active" as const : "inactive" as const,
          createdAt: u.createdAt,
        })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load employees')
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  const validateForm = (): boolean => {
    const errors: { name?: string } = {}

    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập họ và tên"
    } else if (formData.name.trim().length < 2) {
      errors.name = "Họ và tên phải có ít nhất 2 ký tự"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const clearFormErrors = () => setFormErrors({})

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.username.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [employees, searchQuery])

  const totalPages = Math.ceil(filteredEmployees.length / LIMIT)
  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * LIMIT
    return filteredEmployees.slice(start, start + LIMIT)
  }, [filteredEmployees, page])

  const openAddModal = () => {
    setModalMode("add")
    setFormData({ name: "", password: "" })
    clearFormErrors()
    setIsModalOpen(true)
  }

  const openEditModal = (emp: Employee) => {
    setModalMode("edit")
    setEditingEmployee(emp)
    setFormData({
      name: emp.name,
      password: "",
    })
    clearFormErrors()
    setIsModalOpen(true)
  }

  const openDetailModal = async (emp: Employee) => {
    setDetailEmployee(emp)
    setShowPassword(false)
    setDetailCredentials(null)
    setIsDetailModalOpen(true)
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      if (modalMode === "add") {
        const result = await usersApi.create({
          name: formData.name,
        })

        setDetailCredentials({
          username: result.credentials.username,
          password: result.credentials.password
        })

        const emp: Employee = {
          id: result.user.id,
          name: result.user.name,
          username: result.user.username,
          status: "active",
          createdAt: new Date().toISOString(),
        }
        setEmployees((prev) => [...prev, emp])

        setIsModalOpen(false)
        setDetailEmployee(emp)
        setShowPassword(true)
        setIsDetailModalOpen(true)
        showNotification("success", "Đã thêm nhân viên mới")
      } else if (editingEmployee) {
        const updateData: { name: string; password?: string } = {
          name: formData.name,
        }
        if (formData.password) {
          updateData.password = formData.password
        }

        const result = await usersApi.update(editingEmployee.id, updateData)

        setEmployees((prev) =>
          prev.map((e) =>
            e.id === editingEmployee.id
              ? { ...e, name: result.user.name }
              : e
          )
        )

        if (formData.password) {
          setDetailCredentials({
            username: result.user.username,
            password: formData.password
          })
          setDetailEmployee({ ...editingEmployee, name: formData.name })
          setShowPassword(true)
          setIsModalOpen(false)
          setIsDetailModalOpen(true)
          showNotification("success", "Đã cập nhật thông tin")
        } else {
          showNotification("success", "Đã cập nhật thông tin nhân viên")
          setIsModalOpen(false)
        }
      }
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Thao tác thất bại")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (emp: Employee) => {
    setDeleteTarget(emp)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await usersApi.delete(deleteTarget.id)
      setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      showNotification("success", `Đã xóa nhân viên "${deleteTarget.name}"`)
    } catch (err) {
      showNotification("error", "Xóa thất bại")
    } finally {
      setIsDeleteModalOpen(false)
      setDeleteTarget(null)
    }
  }

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      showNotification("success", "Đã copy")
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {notification && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-floating animate-slide-down"
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

      <header className="pt-16 pb-4 px-4 lg:pt-12 lg:pb-8 lg:px-6">
        <div className="max-w-[1140px] mx-auto">
          <h1 className="text-xl font-semibold tracking-tight text-ink lg:text-3xl">
            Nhân Sự
          </h1>
        </div>
      </header>

      <main className="px-4 lg:px-6">
        <div className="max-w-[1140px] mx-auto space-y-4 lg:space-y-5">
          <div className="flex gap-2">
            <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-all">
              <span className="material-symbols-outlined text-lg">person_add</span>
              <span className="hidden sm:inline">Thêm nhân viên</span>
              <span className="sm:hidden">Thêm</span>
            </button>
                      </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-ink-muted-48 text-lg">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm bg-surface-container border border-hairline focus:outline-none focus:border-primary"
            />
          </div>

          {/* Desktop: Table | Mobile: Cards */}
          <div className="hidden lg:block bg-canvas border border-hairline rounded-[18px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline">
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">#</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Tên</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Username</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Trạng thái</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-ink-muted-48">
                        Không tìm thấy nhân viên
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((emp, index) => (
                      <tr
                        key={emp.id}
                        className={`border-b border-hairline last:border-b-0 hover:bg-surface-container transition-colors cursor-pointer ${emp.status === "inactive" ? "opacity-60" : ""}`}
                        onClick={() => openDetailModal(emp)}
                      >
                        <td className="px-4 py-3 text-sm text-ink-muted-48">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-semibold text-xs">
                              {getInitials(emp.name)}
                            </div>
                            <span className="font-medium text-ink">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-ink-muted-80">@{emp.username}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            emp.status === "active" ? "bg-success-bg text-success" : "bg-error-bg text-error"
                          }`}>
                            {emp.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(emp)}
                              className="w-9 h-9 rounded-full hover:bg-surface-container-high text-ink-muted-80 hover:text-primary flex items-center justify-center transition-colors"
                              title="Sửa"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(emp)}
                              className="w-9 h-9 rounded-full hover:bg-error-bg text-ink-muted-80 hover:text-error flex items-center justify-center transition-colors"
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                            <button
                              onClick={() => router.push(`/admin/employees/${emp.id}/registrations`)}
                              className="w-9 h-9 rounded-full hover:bg-surface-container-high text-ink-muted-80 hover:text-primary flex items-center justify-center transition-colors"
                              title="Lịch sử đặt cơm"
                            >
                              <span className="material-symbols-outlined text-base">history</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Card list */}
          <div className="lg:hidden space-y-3">
            {paginatedEmployees.length === 0 ? (
              <div className="bg-canvas border border-hairline rounded-xl px-4 py-10 text-center text-ink-muted-48">
                Không tìm thấy nhân viên
              </div>
            ) : (
              paginatedEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className={`bg-canvas border border-hairline rounded-xl p-4 ${emp.status === "inactive" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3" onClick={() => openDetailModal(emp)}>
                      <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-semibold text-sm">
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <div className="font-medium text-ink">{emp.name}</div>
                        <div className="text-sm text-ink-muted-48">@{emp.username}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      emp.status === "active" ? "bg-success-bg text-success" : "bg-error-bg text-error"
                    }`}>
                      {emp.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(emp)}
                      className="flex-1 h-9 rounded-full hover:bg-surface-container text-ink-muted-80 hover:text-primary flex items-center justify-center transition-colors text-sm"
                    >
                      <span className="material-symbols-outlined text-base mr-1">edit</span>
                      Sửa
                    </button>
                    <button
                      onClick={() => router.push(`/admin/employees/${emp.id}/registrations`)}
                      className="flex-1 h-9 rounded-full hover:bg-surface-container text-ink-muted-80 hover:text-primary flex items-center justify-center transition-colors text-sm"
                    >
                      <span className="material-symbols-outlined text-base mr-1">history</span>
                      Lịch sử
                    </button>
                    <button
                      onClick={() => handleDelete(emp)}
                      className="w-9 h-9 rounded-full hover:bg-error-bg text-ink-muted-80 hover:text-error flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-canvas rounded-[18px] p-6 w-full max-w-[400px] animate-scale-in">
            <h2 className="text-lg font-semibold text-ink mb-4">
              {modalMode === "add" ? "Thêm nhân viên" : "Chỉnh sửa nhân viên"}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Họ và tên <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); clearFormErrors() }}
                  placeholder="Nhập họ và tên"
                  className={`form-input ${formErrors.name ? "border-error" : ""}`}
                />
                {formErrors.name && <p className="text-xs text-error mt-1">{formErrors.name}</p>}
              </div>

              {modalMode === "edit" && (
                <div>
                  <label className="text-sm font-medium text-ink mb-1 block">Mật khẩu mới</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Để trống nếu không đổi mật khẩu"
                    className="form-input"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-full text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high transition-colors">
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50">
                {saving ? "Đang xử lý..." : (modalMode === "add" ? "Thêm mới" : "Lưu")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && detailEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setIsDetailModalOpen(false); setShowPassword(false); }} />
          <div className="relative bg-canvas rounded-[18px] p-6 w-full max-w-[450px] animate-scale-in">
            <h2 className="text-lg font-semibold text-ink mb-4">Chi tiết nhân viên</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-semibold text-lg">
                  {getInitials(detailEmployee.name)}
                </div>
                <div>
                  <div className="font-semibold text-ink text-lg">{detailEmployee.name}</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    detailEmployee.status === "active" ? "bg-success-bg text-success" : "bg-error-bg text-error"
                  }`}>
                    {detailEmployee.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                  </span>
                </div>
              </div>

              <div className="bg-surface-container rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-medium text-ink-muted-48">Tài khoản đăng nhập</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-ink-muted-48">Username</div>
                    <div className="font-mono text-ink">@{detailEmployee.username}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(detailEmployee.username)}
                    className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-ink-muted-48 hover:text-ink transition-colors"
                    title="Copy"
                  >
                    <span className="material-symbols-outlined text-base">content_copy</span>
                  </button>
                </div>

                {detailCredentials && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-ink-muted-48">Password</div>
                      <div className="font-mono text-ink">
                        {showPassword ? detailCredentials.password : '••••••••'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-ink-muted-48 hover:text-ink transition-colors"
                        title={showPassword ? "Ẩn" : "Hiện"}
                      >
                        <span className="material-symbols-outlined text-base">{showPassword ? "visibility_off" : "visibility"}</span>
                      </button>
                      <button
                        onClick={() => copyToClipboard(detailCredentials.password)}
                        className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-ink-muted-48 hover:text-ink transition-colors"
                        title="Copy"
                      >
                        <span className="material-symbols-outlined text-base">content_copy</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-ink-muted-48">Ngày tạo</span>
                <span className="text-ink">{formatDate(detailEmployee.createdAt)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => { setIsDetailModalOpen(false); openEditModal(detailEmployee); setShowPassword(false); }}
                className="px-4 py-2 rounded-full text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                Sửa
              </button>
              <button
                onClick={() => { setIsDetailModalOpen(false); setShowPassword(false); }}
                className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-canvas rounded-[18px] p-6 w-full max-w-[400px] animate-scale-in">
            <h2 className="text-lg font-semibold text-ink mb-2">Xóa nhân viên?</h2>
            <p className="text-sm text-ink-muted-80 mb-4">
              Xóa vĩnh viễn <span className="font-medium text-ink">{deleteTarget.name}</span>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-full text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high transition-colors">Hủy</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-full text-sm font-medium bg-error text-white hover:bg-error/90 transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}