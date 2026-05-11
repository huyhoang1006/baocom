"use client"

import { useState, useRef } from "react"
import { AdminSidebar } from "../components/sidebar/AdminSidebar"
import { MobileSidebar } from "../components/sidebar/MobileSidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

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

      {/* Mobile Sidebar with scroll lock and animations */}
      <MobileSidebar
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hamburgerRef={hamburgerRef}
      >
        <AdminSidebar adminName={mockAdmin.name} />
      </MobileSidebar>

      {/* Hamburger button - changes icon based on state */}
      <button
        ref={hamburgerRef}
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className={`md:hidden fixed top-4 left-4 z-[55] w-11 h-11 rounded-xl bg-surface-container-low shadow-md border border-hairline flex items-center justify-center transition-all duration-200 ${
          isDrawerOpen ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{ pointerEvents: isDrawerOpen ? 'none' : 'auto' }}
        aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
      >
        <span className="material-symbols-outlined">
          {isDrawerOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Main Content - offset for desktop sidebar */}
      <main className="md:ml-[260px] min-h-dvh">
        {children}
      </main>
    </div>
  )
}