"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ForbiddenPage() {
  const router = useRouter()
  const [role, setRole] = useState<"employee" | "admin" | null>(null)

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith("/admin")) {
      setRole("employee")
    } else {
      setRole("admin")
    }
  }, [])

  const handleGoHome = () => {
    if (role === "admin") {
      router.push("/admin/dashboard")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-dvh bg-canvas flex items-center justify-center px-6">
      <div className="w-full max-w-[400px] text-center">
        <div className="w-20 h-20 rounded-full bg-error-bg flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
            block
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-ink mb-2">403</h1>
        <p className="text-lg text-ink-muted-80 mb-6">Bạn không có quyền truy cập trang này</p>
        <button
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all press-effect"
        >
          <span className="material-symbols-outlined">home</span>
          Quay về trang chủ
        </button>
      </div>
    </div>
  )
}
