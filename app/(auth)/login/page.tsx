"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username.trim() || password.length < 4) {
      if (password.length > 0 && password.length < 4) {
        setError("Mật khẩu phải có ít nhất 4 ký tự")
      }
      return
    }

    try {
      console.log('[LOGIN PAGE] Attempting login with:', username)
      const { user } = await authApi.login(username, password)
      console.log('[LOGIN PAGE] Login successful, user:', user)
      console.log('[LOGIN PAGE] Redirecting to:', user.role === 'admin' ? '/admin/dashboard' : '/dashboard')
      if (user.role === 'admin') {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
      console.log('[LOGIN PAGE] Router.push called')
    } catch (err) {
      console.error('[LOGIN PAGE] Login error:', err)
      setError("Sai tên đăng nhập hoặc mật khẩu")
    }
  }

  return (
    <div className="min-h-dvh bg-canvas flex items-center justify-center px-6">
      {/* Logo + Wordmark */}
      <div className="w-full max-w-[400px]">
        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              restaurant
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink mb-1">BaoCom</h1>
          <p className="text-base text-ink-muted-48">Quản lý suất ăn cho công ty</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface rounded-[18px] p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên đăng nhập"
              autoComplete="username"
              required
              className="form-input h-11"
            />

            {/* Password */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                autoComplete="current-password"
                required
                className="form-input h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ink-muted-48 hover:text-ink transition-colors rounded-full hover:bg-surface-container"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-center" role="alert" style={{ color: 'var(--color-error)' }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full h-11 rounded-full text-sm font-medium text-on-primary bg-primary hover:bg-primary-hover transition-all press-effect"
            >
              Đăng nhập
            </button>
          </form>

          {/* Forgot password */}
          <div className="mt-4 text-center">
            <a href="/forgot-password" className="text-sm text-primary hover:underline">
              Quên mật khẩu?
            </a>
          </div>
        </div>

        {/* Demo hint */}
        <div className="mt-6 px-4 py-3 bg-surface-container-low rounded-2xl border border-hairline">
          <p className="text-xs text-ink-muted-48 text-center">
            <span className="font-medium text-ink-muted">Demo:</span> Đăng nhập với tên chứa <span className="font-mono text-ink">admin</span> để vào trang quản lý
          </p>
        </div>
      </div>
    </div>
  )
}