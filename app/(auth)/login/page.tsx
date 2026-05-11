"use client"

import { useState } from "react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu")
      return
    }

    setIsLoading(true)

    // Simulate API call
    await new Promise((r) => setTimeout(r, 800))

    // Demo: accept any login for now
    const isAdmin = username.toLowerCase() === "admin"
    window.location.href = isAdmin ? "/admin/dashboard" : "/book"
  }

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      {/* Login Section */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[360px]">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                restaurant
              </span>
            </div>
          </div>

          {/* Brand */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-ink mb-1">BaoCom</h1>
            <p className="text-sm text-ink-muted-80">Đăng ký suất ăn trưa hàng ngày</p>
          </div>

          {/* Login Form */}
          <div className="bg-surface-container-low rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username" className="text-sm font-medium text-ink mb-1.5 block">
                  Tên đăng nhập
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: hungpx"
                  disabled={isLoading}
                  autoComplete="username"
                  className="form-input"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="text-sm font-medium text-ink mb-1.5 block">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="form-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-muted-48 hover:text-ink"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all press-effect disabled:opacity-70"
              >
                {isLoading ? "Đang xử lý..." : "Đăng nhập"}
              </button>
            </form>
          </div>

          {/* Help */}
          <p className="text-center text-xs text-ink-muted-48 mt-4">
            Quên mật khẩu? Liên hệ Admin để được hỗ trợ
          </p>
        </div>
      </main>

          </div>
  )
}