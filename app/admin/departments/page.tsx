"use client"

import { useState, useMemo, useEffect } from "react"
import { departmentsApi } from "@/lib/api"

interface Department {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({ name: "", description: "" })
  const [formErrors, setFormErrors] = useState<{ name?: string }>({})

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await departmentsApi.getAll()
      setDepartments(data.departments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: { name?: string } = {}
    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập tên phòng ban"
    } else if (formData.name.trim().length > 100) {
      errors.name = "Tên phòng ban không được vượt quá 100 ký tự"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const openAddModal = () => {
    setModalMode("add")
    setFormData({ name: "", description: "" })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (dept: Department) => {
    setModalMode("edit")
    setEditingDepartment(dept)
    setFormData({ name: dept.name, description: dept.description || "" })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      if (modalMode === "add") {
        await departmentsApi.create({ name: formData.name, description: formData.description || undefined })
        showNotification("success", "Đã thêm phòng ban mới")
      } else if (editingDepartment) {
        await departmentsApi.update(editingDepartment.id, { name: formData.name, description: formData.description || undefined })
        showNotification("success", "Đã cập nhật phòng ban")
      }
      setIsModalOpen(false)
      fetchDepartments()
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Thao tác thất bại")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (dept: Department) => {
    setDeleteTarget(dept)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await departmentsApi.delete(deleteTarget.id)
      showNotification("success", `Đã xóa phòng ban "${deleteTarget.name}"`)
      setIsDeleteModalOpen(false)
      setDeleteTarget(null)
      fetchDepartments()
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Xóa thất bại")
    }
  }

  const filteredDepartments = useMemo(() => {
    return departments.filter(dept =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [departments, searchQuery])

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-floating animate-slide-down"
          style={{ background: notification.type === "success" ? "var(--color-success-bg)" : "var(--color-error-bg)", color: notification.type === "success" ? "var(--color-success)" : "var(--color-error)", border: `1px solid ${notification.type === "success" ? "var(--color-success)" : "var(--color-error)"}` }}>
          <span className="material-symbols-outlined">{notification.type === "success" ? "check_circle" : "error"}</span>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <header className="pt-16 pb-4 px-4 lg:pt-12 lg:pb-8 lg:px-6">
        <div className="max-w-[1140px] mx-auto">
          <h1 className="text-xl font-semibold tracking-tight text-ink lg:text-3xl">Phòng Ban</h1>
        </div>
      </header>

      <main className="px-4 lg:px-6">
        <div className="max-w-[1140px] mx-auto space-y-4 lg:space-y-5">
          <div className="flex gap-2">
            <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-all">
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Thêm phòng ban</span>
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-ink-muted-48 text-lg">search</span>
            <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm bg-surface-container border border-hairline focus:outline-none focus:border-primary" />
          </div>

          <div className="bg-canvas border border-hairline rounded-[18px] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">#</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Tên phòng ban</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Mô tả</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-ink-muted-48">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-muted-48">Đang tải...</td></tr>
                ) : filteredDepartments.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-muted-48">Không tìm thấy phòng ban</td></tr>
                ) : (
                  filteredDepartments.map((dept, index) => (
                    <tr key={dept.id} className="border-b border-hairline last:border-b-0 hover:bg-surface-container transition-colors">
                      <td className="px-4 py-3 text-sm text-ink-muted-48">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-ink">{dept.name}</td>
                      <td className="px-4 py-3 text-sm text-ink-muted-80">{dept.description || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${dept.isActive ? "bg-success-bg text-success" : "bg-error-bg text-error"}`}>
                          {dept.isActive ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(dept)} className="w-9 h-9 rounded-full hover:bg-surface-container-high text-ink-muted-80 hover:text-primary flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button onClick={() => handleDelete(dept)} className="w-9 h-9 rounded-full hover:bg-error-bg text-ink-muted-80 hover:text-error flex items-center justify-center transition-colors">
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
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-canvas rounded-[18px] p-6 w-full max-w-[400px] animate-scale-in">
            <h2 className="text-lg font-semibold text-ink mb-4">{modalMode === "add" ? "Thêm phòng ban" : "Chỉnh sửa phòng ban"}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Tên phòng ban <span className="text-error">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormErrors({}) }}
                  placeholder="Nhập tên phòng ban" className={`form-input ${formErrors.name ? "border-error" : ""}`} />
                {formErrors.name && <p className="text-xs text-error mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Mô tả</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả (tùy chọn)" className="form-input min-h-[80px]" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-full text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high transition-colors">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50">
                {saving ? "Đang xử lý..." : (modalMode === "add" ? "Thêm mới" : "Lưu")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-canvas rounded-[18px] p-6 w-full max-w-[400px] animate-scale-in">
            <h2 className="text-lg font-semibold text-ink mb-2">Xóa phòng ban?</h2>
            <p className="text-sm text-ink-muted-80 mb-4">Xóa vĩnh viễn <span className="font-medium text-ink">{deleteTarget.name}</span>? Hành động này không thể hoàn tác.</p>
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