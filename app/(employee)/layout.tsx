"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { EmployeeSidebar } from "../components/sidebar/EmployeeSidebar"
import { MobileSidebar } from "../components/sidebar/MobileSidebar"

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const pathname = usePathname()

  useEffect(() => {
    setIsDrawerOpen(false)
  }, [pathname])

  const mockUser = {
    username: "hungpx",
    fullName: "Phạm Xuân Hùng",
  }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <EmployeeSidebar
          username={mockUser.username}
          fullName={mockUser.fullName}
        />
      </div>

      {/* Mobile Sidebar with scroll lock and animations */}
      <MobileSidebar
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <EmployeeSidebar
          username={mockUser.username}
          fullName={mockUser.fullName}
        />
      </MobileSidebar>

      {/* Hamburger button - changes icon based on state */}
      <button
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