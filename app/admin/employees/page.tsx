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
const cancelReasons = ["Đi công trường", "Nghỉ phép", "Công tác", "Thai sản", "Họp/Tập huấn", "Khác"]

function generateUsername(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "user001"
  const lastName = parts[parts.length - 1].toLowerCase().replace(/[àáạảãâầấậẩẫăằắặẳẹèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, "").replace(/[^a-z]/g, "")
  const firstInitial = parts[0].charAt(0).toLowerCase()
  const middleInitial = parts.length > 2 ? parts[1].charAt(0).toLowerCase() : ""
  return lastName + firstInitial + middleInitial
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [cancelDateRange, setCancelDateRange] = useState<"custom" | "week" | "month">("week")
  const [cancelCustomStart, setCancelCustomStart] = useState("")
  const [cancelCustomEnd, setCancelCustomEnd] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [cancelNote, setCancelNote] = useState("")
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
      const matchesStatus = statusFilter === "all" || emp.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [employees, searchQuery, statusFilter])

  const handleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredEmployees.map((e) => e.id))
    }
  }

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

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

  const handleBulkCancel = () => {
    if (selectedIds.length === 0) return
    setIsCancelModalOpen(true)
  }

  const confirmBulkCancel = () => {
    if (!cancelReason) {
      showNotification("error", "Vui lòng chọn lý do hủy")
      return
    }
    showNotification("success", `Đã hủy ${selectedIds.length} suất ăn cho các ngày đã chọn`)
    setIsCancelModalOpen(false)
    setSelectedIds([])
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
          <div className="flex items-center gap-3 text-ink-muted-80 mb-3">
            <span className="material-symbols-outlined text-primary">group</span>
            <span className="text-sm font-medium">Quản lý nhân sự</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink">
            Nhân Sự
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto space-y-5">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all">
              <span className="material-symbols-outlined text-lg">person_add</span>
              Thêm nhân viên
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high border border-hairline transition-colors">
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Import
            </button>
            {selectedIds.length > 0 && (
              <button onClick={handleBulkCancel} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-error-bg text-error hover:bg-error/10 border border-error/20 transition-all">
                <span className="material-symbols-outlined text-lg">cancel</span>
                Hủy ({selectedIds.length})
              </button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-ink-muted-48 text-lg">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-surface-container border border-hairline focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="px-4 py-2 rounded-xl text-sm bg-surface-container border border-hairline text-ink"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
          </div>

          {/* Employee Table */}
          <div className="rounded-2xl bg-surface-container-low border border-hairline overflow-x-auto">
            {filteredEmployees.length === 0 ? (
              <div className="p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-ink-muted-48 mb-3 block">person_search</span>
                <p className="text-sm text-ink-muted-80">Không tìm thấy nhân viên</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container border-b border-hairline">
                    <th className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-hairline text-primary"
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Họ tên</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Tài khoản</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">SĐT</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-ink-muted-80">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-surface-container-low">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(emp.id)}
                          onChange={() => handleSelect(emp.id)}
                          className="w-4 h-4 rounded border-hairline text-primary"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs ${
                            emp.status === "active" ? "bg-surface-container text-ink" : "bg-surface-container-low text-ink-muted-48"
                          }`}>
                            {emp.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-ink text-sm">{emp.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-muted-80 font-mono">{emp.username}</td>
                      <td className="py-3 px-4 text-sm text-ink-muted-80">{emp.phone}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          emp.status === "active" ? "bg-success-bg text-success" : "bg-surface-container text-ink-muted-48"
                        }`}>
                          {emp.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button onClick={() => openEditModal(emp)} className="p-1.5 rounded-lg hover:bg-surface-container text-ink-muted-80 hover:text-primary" title="Sửa">
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button onClick={() => handleDelete(emp)} className="p-1.5 rounded-lg hover:bg-error-bg text-ink-muted-80 hover:text-error" title="Xóa">
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-surface-container-low rounded-2xl p-6 w-full max-w-md animate-scale-in">
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

              {modalMode === "add" && formData.name && (
                <div className="p-3 rounded-lg bg-surface-container text-xs text-ink-muted-80">
                  Username: <span className="font-mono font-medium">{generateUsername(formData.name)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-ink-muted-80 hover:bg-surface-container transition-colors">
                Hủy
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors">
                {modalMode === "add" ? "Thêm mới" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsCancelModalOpen(false)} />
          <div className="relative bg-surface-container-low rounded-2xl p-6 w-full max-w-md animate-scale-in">
            <h2 className="text-lg font-semibold text-ink mb-1">Hủy Báo Cơm</h2>
            <p className="text-sm text-ink-muted-80 mb-4">{selectedIds.length} nhân viên được chọn</p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Khoảng thời gian:</label>
                <div className="flex gap-2">
                  {(["week", "month", "custom"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setCancelDateRange(opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${cancelDateRange === opt ? "bg-primary text-white" : "bg-surface-container text-ink-muted-80"}`}
                    >
                      {opt === "week" ? "Tuần" : opt === "month" ? "Tháng" : "Tùy chỉnh"}
                    </button>
                  ))}
                </div>
                {cancelDateRange === "custom" && (
                  <div className="flex gap-2 mt-2">
                    <input type="date" value={cancelCustomStart} onChange={(e) => setCancelCustomStart(e.target.value)} className="form-input flex-1" />
                    <input type="date" value={cancelCustomEnd} onChange={(e) => setCancelCustomEnd(e.target.value)} className="form-input flex-1" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Lý do <span className="text-error">*</span></label>
                <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="form-input">
                  <option value="">Chọn lý do</option>
                  {cancelReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Ghi chú</label>
                <textarea value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} placeholder="Thông tin bổ sung..." rows={2} className="form-input resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setIsCancelModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-ink-muted-80 hover:bg-surface-container">Đóng</button>
              <button onClick={confirmBulkCancel} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-error hover:bg-error/90">Xác nhận hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-surface-container-low rounded-2xl p-6 w-full max-w-sm animate-scale-in">
            <h2 className="text-lg font-semibold text-ink mb-2">Xóa nhân viên?</h2>
            <p className="text-sm text-ink-muted-80 mb-4">
              Xóa <span className="font-medium text-ink">{deleteTarget.name}</span>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-ink-muted-80 hover:bg-surface-container">Hủy</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-error hover:bg-error/90">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}