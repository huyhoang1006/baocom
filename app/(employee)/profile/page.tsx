"use client"

import { useEffect, useState } from "react"
import { authApi } from "@/lib/api"

export default function ProfilePage() {
  const [user, setUser] = useState<{ name: string; username: string; role: string } | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    authApi.me()
      .then(({ user }) => setUser(user))
      .catch(() => {})
  }, [])

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification("Vui lòng điền đầy đủ các trường", "error")
      return
    }
    if (newPassword.length < 6) {
      showNotification("Mật khẩu mới phải có ít nhất 6 ký tự", "error")
      return
    }
    if (newPassword !== confirmPassword) {
      showNotification("Mật khẩu mới và xác nhận không khớp", "error")
      return
    }

    setSubmitting(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      showNotification("Đổi mật khẩu thành công")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đổi mật khẩu thất bại"
      showNotification(message, "error")
    } finally {
      setSubmitting(false)
    }
  }

  const roleLabel = user?.role === "admin" ? "Quản trị viên" : "Nhân viên"

  return (
    <div className="min-h-dvh bg-canvas pb-12">
      <header className="pt-10 pb-6 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Hồ Sơ</h1>
          <p className="text-sm text-ink-muted-80 mt-1">Thông tin tài khoản và bảo mật</p>
        </div>
      </header>

      <main className="px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto space-y-6">
          {/* User Info Card */}
          <div className="rounded-[18px] bg-surface-container-low p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">Thông tin tài khoản</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-ink-muted-80 mb-1">Họ tên</p>
                <p className="text-base font-medium text-ink">{user?.name || "..."}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted-80 mb-1">Tên đăng nhập</p>
                <p className="text-base font-medium text-ink">{user?.username || "..."}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted-80 mb-1">Vai trò</p>
                <span className="inline-block px-3 py-1 rounded-full bg-primary-bg text-xs font-semibold text-primary">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="rounded-[18px] bg-surface-container-low p-6">
            <h2 className="text-lg font-semibold text-ink mb-4">Đổi mật khẩu</h2>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary transition-colors"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary transition-colors"
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-primary transition-colors"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </form>
          </div>
        </div>
      </main>

      {notification && (
        <div
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-floating animate-fade-in-up"
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
    </div>
  )
}
