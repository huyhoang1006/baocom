"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { EmployeeSidebar } from "../components/sidebar/EmployeeSidebar"
import { MobileSidebar } from "../components/sidebar/MobileSidebar"
import { authApi } from "@/lib/api"

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [user, setUser] = useState<{ username: string; fullName: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const pathname = usePathname()

  useEffect(() => {
    setIsDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user: userData } = await authApi.me()
        setUser({
          username: userData.username,
          fullName: userData.name,
        })
      } catch (err) {
        console.error('Failed to fetch user:', err)
        window.location.href = '/login'
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        {!loading && user && (
          <EmployeeSidebar
            username={user.username}
            fullName={user.fullName}
          />
        )}
      </div>

      {/* Mobile Header: 44px height, surface-black bg, white title, hamburger left, avatar right */}
      {/* z-40 for header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-11 bg-white z-40 flex items-center justify-between px-4">
        {/* Hamburger: 44px tap target, rounded.sm (8px), dark icon */}
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="w-11 h-11 flex items-center justify-center rounded-sm active:scale-95 transition-transform"
          style={{ touchAction: 'manipulation' }}
          aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
        >
          <span className="material-symbols-outlined text-[#1d1d1f]">
            {isDrawerOpen ? "close" : "menu"}
          </span>
        </button>

        {/* Title - ink color */}
        <span className="text-[#1d1d1f] text-xs tracking-[-0.12px]">BaoCom</span>

        {/* Avatar */}
        {!loading && user && (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {user.username.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </header>

      {/* Mobile Sidebar with scroll lock and animations */}
      <MobileSidebar
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        {!loading && user && (
          <EmployeeSidebar
            username={user.username}
            fullName={user.fullName}
          />
        )}
      </MobileSidebar>

      {/* Main Content - offset for desktop sidebar, pt-11 for mobile header */}
      <main className="md:ml-[260px] min-h-dvh md:pt-0 pt-11">
        {children}
      </main>
    </div>
  )
}