"use client"

import { useState, useEffect } from "react"
import { adminSettingsApi } from "@/lib/api"

export default function SettingsPage() {
  const [cutoffHour, setCutoffHour] = useState(23)
  const [cutoffMinute, setCutoffMinute] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    async function fetchCutoff() {
      try {
        const data = await adminSettingsApi.getCutoff()
        setCutoffHour(data.cutoffHour)
        setCutoffMinute(data.cutoffMinute)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    fetchCutoff()
  }, [])

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await adminSettingsApi.updateCutoff(cutoffHour, cutoffMinute)
      showNotification("success", "Đã lưu cài đặt")
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Lưu thất bại")
    } finally {
      setSaving(false)
    }
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
          }}>
          <span className="material-symbols-outlined">{notification.type === "success" ? "check_circle" : "error"}</span>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <header className="pt-12 pb-8 px-6 lg:px-10">
        <div className="max-w-[600px] mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Cài Đặt</h1>
        </div>
      </header>

      <main className="px-6 lg:px-10">
        <div className="max-w-[600px] mx-auto space-y-5">
          {loading ? (
            <div className="p-8 text-center text-ink-muted-80">Đang tải...</div>
          ) : (
            <>
              <div className="rounded-[18px] bg-surface-container-low p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-ink mb-1">Giờ chốt báo nghỉ</h2>
                  <p className="text-sm text-ink-muted-80">
                    Sau giờ này mỗi ngày, nhân viên không thể thay đổi đăng ký ăn. Áp dụng cho tất cả ngày làm việc.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-ink">Giờ:</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={cutoffHour}
                      onChange={(e) => setCutoffHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                      className="form-input w-20 text-center"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-ink">Phút:</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={cutoffMinute}
                      onChange={(e) => setCutoffMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="form-input w-20 text-center"
                    />
                  </div>
                </div>

                <div className="text-sm text-ink-muted-80">
                  VD: 23:00 = Chốt lúc 23:00 ngày hôm trước → nhân viên có thể chỉnh đến 22:59
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-all disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
