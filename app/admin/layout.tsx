"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "../components/sidebar/AdminSidebar"
import { MobileSidebar } from "../components/sidebar/MobileSidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsDrawerOpen(false)
  }, [pathname])

  const mockAdmin = {
    username: "admin",
    name: "Admin",
  }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <AdminSidebar adminName={mockAdmin.name} />
      </div>

      {/* Mobile Header: 44px height, surface-black bg, white title, hamburger left, avatar right */}
      {/* z-40 for header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-11 bg-surface-tile-1 z-40 flex items-center justify-between px-4">
        {/* Hamburger: 44px tap target, rounded.sm (8px), white icon */}
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="w-11 h-11 flex items-center justify-center rounded-sm active:scale-95 transition-transform"
          aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
        >
          <span className="material-symbols-outlined text-white">
            {isDrawerOpen ? "close" : "menu"}
          </span>
        </button>

        {/* Title */}
        <span className="text-white text-xs tracking-[-0.12px]">BaoCom Admin</span>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-xs font-semibold text-white">
            {mockAdmin.username.substring(0, 2).toUpperCase()}
          </span>
        </div>
      </header>

      {/* Mobile Sidebar with scroll lock and animations */}
      <MobileSidebar
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <AdminSidebar adminName={mockAdmin.name} />
      </MobileSidebar>

      {/* Main Content - offset for desktop sidebar, pt-11 for mobile header */}
      <main className="md:ml-[260px] min-h-dvh md:pt-0 pt-11">
        {children}
      </main>
    </div>
  )
}