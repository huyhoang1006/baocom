"use client"

import { useState, useMemo, useEffect } from "react"
import { usersApi } from "@/lib/api"

interface Employee {
  id: string
  name: string
  username: string
  phone?: string
  email?: string
  department?: string
  status: "active" | "inactive"
  createdAt: string
}

interface Credentials {
  username: string
  password: string
}

const departments = ["Kỹ thuật", "Kinh doanh", "Nhân sự", "Tài chính", "Marketing"]

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
  const [showPassword, setShowPassword] = useState(false)
  const [detailCredentials, setDetailCredentials] = useState<Credentials | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    department: "",
  })

  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; email?: string }>({})

  // Fetch employees on mount
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
          phone: u.phone,
          email: u.email,
          department: u.department,
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
    const errors: { name?: string; phone?: string; email?: string } = {}

    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập họ và tên"
    } else if (formData.name.trim().length < 2) {
      errors.name = "Họ và tên phải có ít nhất 2 ký tự"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email không hợp lệ"
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
        emp.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.phone && emp.phone.includes(searchQuery))
      return matchesSearch
    })
  }, [employees, searchQuery])

  const openAddModal = () => {
    setModalMode("add")
    setFormData({ name: "", phone: "", email: "", department: "" })
    clearFormErrors()
    setIsModalOpen(true)
  }

  const openEditModal = (emp: Employee) => {
    setModalMode("edit")
    setEditingEmployee(emp)
    setFormData({
      name: emp.name,
      phone: emp.phone || "",
      email: emp.email || "",
      department: emp.department || "",
    })
    clearFormErrors()
    setIsModalOpen(true)
  }

  const openDetailModal = async (emp: Employee) => {
    setDetailEmployee(emp)
    setShowPassword(false)
    setDetailCredentials(null)
    
    // Fetch credentials for this user
    try {
      const userData = await usersApi.getOne(emp.id)
      // Note: In real implementation, you'd have an API endpoint to get credentials
      // For now, we only show what's available
    } catch (err) {
      console.error('Failed to load user details:', err)
    }
    
    setIsDetailModalOpen(true)
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      if (modalMode === "add") {
        const result = await usersApi.create({
          name: formData.name,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          department: formData.department || undefined,
        })
        
        // Show credentials after creation
        setDetailCredentials({
          username: result.credentials.username,
          password: result.credentials.password
        })
        
        const emp: Employee = {
          id: result.user.id,
          name: result.user.name,
          username: result.user.username,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          department: formData.department || undefined,
          status: "active",
          createdAt: new Date().toISOString(),
        }
        setEmployees((prev) => [...prev, emp])
        
        // Show success with credentials
        setIsModalOpen(false)
        setDetailEmployee(emp)
        setShowPassword(true)
        setIsDetailModalOpen(true)
        showNotification("success", "Đã thêm nhân viên mới")
      } else if (editingEmployee) {
        await usersApi.update(editingEmployee.id, {
          name: formData.name,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          department: formData.department || undefined,
        })
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === editingEmployee.id
              ? { ...e, name: formData.name, phone: formData.phone || undefined, email: formData.email || undefined, department: formData.department || undefined }
              : e
          )
        )
        showNotification("success", "Đã cập nhật thông tin nhân viên")
        setIsModalOpen(false)
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
      setEmployees((prev) =>
        prev.map((e) => (e.id === deleteTarget.id ? { ...e, status: "inactive" as const } : e))
      )
      showNotification("success", `Đã khóa nhân viên "${deleteTarget.name}"`)
    } catch (err) {
      showNotification("error", "Xóa thất bại")
    } finally {
      setIsDeleteModalOpen(false)
      setDeleteTarget(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showNotification("success", "Đã copy")
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {/* Notification Toast */}
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

      {/* Page Header */}
      <header className="pt-12 pb-8 px-6 lg:px-10">
        <div className="max-w-[1140px] mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Nhân Sự
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[1140px] mx-auto space-y-5">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-all">
              <span className="material-symbols-outlined text-lg">person_add</span>
              Thêm nhân viên
            </button>
            <button onClick={() => showNotification("error", "Tính năng đang phát triển")} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high border border-hairline transition-colors">
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Import
            </button>
          </div>

          {/* Search Bar */}
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

          {/* Employee Table */}
          <div className="bg-canvas border border-hairline rounded-[18px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline">
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">#</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Tên</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Username</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">SĐT</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Phòng ban</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Trạng thái</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-ink-muted-48">
                        Không tìm thấy nhân viên
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp, index) => (
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
                        <td className="px-4 py-3 text-sm text-ink-muted-80">{emp.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {emp.department ? (
                            <span className="px-2 py-1 bg-surface-container rounded text-xs">{emp.department}</span>
                          ) : '-'}
                        </td>
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
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
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

              <div>
                <label className="text-sm font-medium text-ink mb-1 block">SĐT</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); clearFormErrors() }}
                  placeholder="0912 345 678"
                  className="form-input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clearFormErrors() }}
                  placeholder="email@company.com"
                  className={`form-input ${formErrors.email ? "border-error" : ""}`}
                />
                {formErrors.email && <p className="text-xs text-error mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Phòng ban</label>
                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="form-input">
                  <option value="">Chọn phòng ban</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
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

      {/* Detail Modal */}
      {isDetailModalOpen && detailEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setIsDetailModalOpen(false); setShowPassword(false); }} />
          <div className="relative bg-canvas rounded-[18px] p-6 w-full max-w-[450px] animate-scale-in">
            <h2 className="text-lg font-semibold text-ink mb-4">Chi tiết nhân viên</h2>

            <div className="space-y-4">
              {/* Avatar & Name */}
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

              {/* Credentials */}
              {detailCredentials && (
                <div className="bg-surface-container rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-medium text-ink-muted-48">Tài khoản đăng nhập</h3>
                  
                  {/* Username */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-ink-muted-48">Username</div>
                      <div className="font-mono text-ink">{detailCredentials.username}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(detailCredentials.username)}
                      className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-ink-muted-48 hover:text-ink transition-colors"
                      title="Copy"
                    >
                      <span className="material-symbols-outlined text-base">content_copy</span>
                    </button>
                  </div>

                  {/* Password */}
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
                </div>
              )}

              {/* Info */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted-48">SĐT</span>
                  <span className="text-ink">{detailEmployee.phone || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted-48">Email</span>
                  <span className="text-ink">{detailEmployee.email || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted-48">Phòng ban</span>
                  <span className="text-ink">{detailEmployee.department || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted-48">Ngày tạo</span>
                  <span className="text-ink">{formatDate(detailEmployee.createdAt)}</span>
                </div>
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-canvas rounded-[18px] p-6 w-full max-w-[400px] animate-scale-in">
            <h2 className="text-lg font-semibold text-ink mb-2">Khóa tài khoản nhân viên này?</h2>
            <p className="text-sm text-ink-muted-80 mb-4">
              Khóa tài khoản <span className="font-medium text-ink">{deleteTarget.name}</span>? Hành động này có thể hoàn tác.
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