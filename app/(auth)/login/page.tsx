"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
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
      const { user } = await authApi.login(username, password)
      if (user.role === 'admin') {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              autoComplete="current-password"
              required
              className="form-input h-11"
            />

            {/* Error message */}
            {error && (
              <p className="text-sm text-error text-center" role="alert">
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