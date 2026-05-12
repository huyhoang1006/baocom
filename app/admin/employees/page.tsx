"use client"

import { useState, useMemo } from "react"

interface Employee {
  id: string
  name: string
  username: string
  phone: string
  email?: string
  department?: string
  status: "active" | "inactive"
}

const initialEmployees: Employee[] = [
  { id: "1", name: "Nguyễn Văn A", username: "nguyenvana", phone: "0912345678", email: "nva@company.com", department: "Kỹ thuật", status: "active" },
  { id: "2", name: "Trần Thị B", username: "tranthib", phone: "0912345679", email: "ttb@company.com", department: "Kinh doanh", status: "active" },
  { id: "3", name: "Lê Văn C", username: "levanc", phone: "0912345680", department: "Kỹ thuật", status: "active" },
  { id: "4", name: "Phạm Thị D", username: "phamthid", phone: "0912345681", email: "ptd@company.com", department: "Nhân sự", status: "inactive" },
  { id: "5", name: "Hoàng Văn E", username: "hoangvane", phone: "0912345682", department: "Kỹ thuật", status: "active" },
  { id: "6", name: "Nguyễn Thị F", username: "nguyenthif", phone: "0912345683", department: "Marketing", status: "active" },
  { id: "7", name: "Võ Đình G", username: "vodinhg", phone: "0912345684", department: "Kế toán", status: "active" },
]

const departments = ["Kỹ thuật", "Kinh doanh", "Nhân sự", "Tài chính", "Marketing"]

function generateUsername(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "user001"
  const lastName = parts[parts.length - 1].toLowerCase().replace(/[àáạảãâầấậẩẫăằắặẳẹèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, "").replace(/[^a-z]/g, "")
  const firstInitial = parts[0].charAt(0).toLowerCase()
  const middleInitial = parts.length > 2 ? parts[1].charAt(0).toLowerCase() : ""
  return lastName + firstInitial + middleInitial
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    department: "",
  })

  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; email?: string }>({})

  const validateForm = (): boolean => {
    const errors: { name?: string; phone?: string; email?: string } = {}

    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập họ và tên"
    } else if (formData.name.trim().length < 2) {
      errors.name = "Họ và tên phải có ít nhất 2 ký tự"
    }

    if (!formData.phone.trim()) {
      errors.phone = "Vui lòng nhập số điện thoại"
    } else {
      const phoneDigits = formData.phone.replace(/\D/g, "")
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        errors.phone = "Số điện thoại phải là 10-11 chữ số"
      }
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
        emp.phone.includes(searchQuery)
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
      phone: emp.phone,
      email: emp.email || "",
      department: emp.department || "",
    })
    clearFormErrors()
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!validateForm()) return

    if (modalMode === "add") {
      const newEmployee: Employee = {
        id: Date.now().toString(),
        name: formData.name,
        username: generateUsername(formData.name),
        phone: formData.phone,
        email: formData.email || undefined,
        department: formData.department || undefined,
        status: "active",
      }
      setEmployees((prev) => [...prev, newEmployee])
      showNotification("success", "Đã thêm nhân viên mới")
    } else if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editingEmployee.id
            ? { ...e, name: formData.name, phone: formData.phone, email: formData.email || undefined, department: formData.department || undefined }
            : e
        )
      )
      showNotification("success", "Đã cập nhật thông tin nhân viên")
    }
    setIsModalOpen(false)
  }

  const handleDelete = (emp: Employee) => {
    setDeleteTarget(emp)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setEmployees((prev) =>
      prev.map((e) => (e.id === deleteTarget.id ? { ...e, status: "inactive" } : e))
    )
    showNotification("success", `Đã xóa nhân viên "${deleteTarget.name}"`)
    setIsDeleteModalOpen(false)
    setDeleteTarget(null)
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
        <div className="max-w-[900px] mx-auto space-y-5">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-all">
              <span className="material-symbols-outlined text-lg">person_add</span>
              Thêm nhân viên
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high border border-hairline transition-colors">
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

          {/* Employee Cards List */}
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {filteredEmployees.length === 0 ? (
              <div className="p-10 text-center bg-canvas border border-hairline rounded-[18px]">
                <span className="material-symbols-outlined text-5xl text-ink-muted-48 mb-3 block">person_search</span>
                <p className="text-sm text-ink-muted-80">Không tìm thấy nhân viên</p>
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-canvas border border-hairline rounded-[18px] p-4 flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-semibold text-sm shrink-0">
                    {getInitials(emp.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[17px] font-semibold text-ink truncate">{emp.name}</div>
                    <div className="text-[12px] text-ink-muted-48 font-mono">@{emp.username}</div>
                    <div className="text-[14px] text-ink-muted-48 mt-0.5">{emp.phone}</div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      emp.status === "active" ? "bg-success-bg text-success" : "bg-surface-container text-ink-muted-48"
                    }`}>
                      {emp.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(emp)}
                      className="w-11 h-11 rounded-full hover:bg-surface-container text-ink-muted-80 hover:text-primary flex items-center justify-center transition-colors"
                      title="Sửa"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(emp)}
                      className="w-11 h-11 rounded-full hover:bg-error-bg text-ink-muted-80 hover:text-error flex items-center justify-center transition-colors"
                      title="Xóa"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
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
                <label className="text-sm font-medium text-ink mb-1 block">SĐT <span className="text-error">*</span></label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); clearFormErrors() }}
                  placeholder="0912 345 678"
                  className={`form-input ${formErrors.phone ? "border-error" : ""}`}
                />
                {formErrors.phone && <p className="text-xs text-error mt-1">{formErrors.phone}</p>}
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
              <button onClick={handleSave} className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors">
                {modalMode === "add" ? "Thêm mới" : "Lưu"}
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
            <h2 className="text-lg font-semibold text-ink mb-2">Xóa nhân viên?</h2>
            <p className="text-sm text-ink-muted-80 mb-4">
              Xóa <span className="font-medium text-ink">{deleteTarget.name}</span>? Hành động này không thể hoàn tác.
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