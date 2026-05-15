"use client"

import { useState, useEffect } from "react"
import { holidaysApi } from "@/lib/api"

interface Holiday {
  id: string
  date: string
  description?: string
  isActive: boolean
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [formData, setFormData] = useState({ date: "", description: "" })
  const [formErrors, setFormErrors] = useState<{ date?: string }>({})

  useEffect(() => {
    fetchHolidays()
  }, [])

  const fetchHolidays = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await holidaysApi.getAll()
      setHolidays(data.holidays)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const validateForm = (): boolean => {
    const errors: { date?: string } = {}
    if (!formData.date) {
      errors.date = "Vui lòng chọn ngày"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openAddModal = () => {
    setModalMode("add")
    setFormData({ date: "", description: "" })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (holiday: Holiday) => {
    setModalMode("edit")
    setEditingHoliday(holiday)
    const d = new Date(holiday.date)
    const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    setFormData({ date: dateStr, description: holiday.description || "" })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      if (modalMode === "add") {
        await holidaysApi.create({
          date: formData.date,
          description: formData.description || undefined
        })
        showNotification("success", "Đã thêm ngày lễ")
      } else if (editingHoliday) {
        await holidaysApi.update(editingHoliday.id, {
          date: formData.date,
          description: formData.description || undefined
        })
        showNotification("success", "Đã cập nhật ngày lễ")
      }
      setIsModalOpen(false)
      fetchHolidays()
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Thao tác thất bại")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (holiday: Holiday) => {
    if (!confirm(`Xóa ngày lễ "${holiday.description || formatDate(holiday.date)}"?`)) return
    try {
      await holidaysApi.delete(holiday.id)
      showNotification("success", "Đã xóa ngày lễ")
      fetchHolidays()
    } catch (err) {
      showNotification("error", "Xóa thất bại")
    }
  }

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-floating animate-slide-down"
          style={{
            background: notification.type === "success" ? "var(--color-success-bg)" : "var(--color-error-bg)",
            color: notification.type === "success" ? "var(--color-success)" : "var(--color-error)",
            border: `1px solid ${notification.type === "success" ? "var(--color-success)" : "var(--color-error)"}`
          }}>
          <span className="material-symbols-outlined">{notification.type === "success" ? "check_circle" : "error"}</span>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <header className="pt-12 pb-8 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Ngày lễ / Ngày nghỉ</h1>
        </div>
      </header>

      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto space-y-5">
          <div className="flex gap-2">
            <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-all">
              <span className="material-symbols-outlined text-lg">add</span>
              Thêm ngày lễ
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-10 text-center bg-canvas border border-hairline rounded-[18px]">
                <div className="animate-pulse text-ink-muted-48">Đang tải...</div>
              </div>
            ) : holidays.length === 0 ? (
              <div className="p-10 text-center bg-canvas border border-hairline rounded-[18px]">
                <span className="material-symbols-outlined text-5xl text-ink-muted-48 mb-3 block">event_busy</span>
                <p className="text-sm text-ink-muted-80">Chưa có ngày lễ nào</p>
              </div>
            ) : (
              holidays.map((holiday) => (
                <div key={holiday.id} className="bg-canvas border border-hairline rounded-[18px] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-bg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">event</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[17px] font-semibold text-ink">{formatDate(holiday.date)}</div>
                    <div className="text-[14px] text-ink-muted-48 mt-0.5">{holiday.description || "Không có mô tả"}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openEditModal(holiday)} className="w-11 h-11 rounded-full hover:bg-surface-container text-ink-muted-80 hover:text-primary flex items-center justify-center transition-colors" title="Sửa">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button onClick={() => handleDelete(holiday)} className="w-11 h-11 rounded-full hover:bg-error-bg text-ink-muted-80 hover:text-error flex items-center justify-center transition-colors" title="Xóa">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-canvas rounded-[18px] p-6 w-full max-w-[400px] animate-scale-in">
            <h2 className="text-lg font-semibold text-ink mb-4">
              {modalMode === "add" ? "Thêm ngày lễ" : "Chỉnh sửa ngày lễ"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Ngày <span className="text-error">*</span></label>
                <input type="date" value={formData.date} onChange={(e) => { setFormData({ ...formData, date: e.target.value }); setFormErrors({}) }} className={`form-input ${formErrors.date ? "border-error" : ""}`} />
                {formErrors.date && <p className="text-xs text-error mt-1">{formErrors.date}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Mô tả</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="VD: Ngày lễ Quốc khánh" className="form-input" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-full text-sm font-medium text-ink bg-surface-container hover:bg-surface-container-high transition-colors">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50">
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}