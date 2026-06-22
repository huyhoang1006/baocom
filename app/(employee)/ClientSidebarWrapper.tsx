"use client"
import { useState } from "react"
import { MobileSidebar } from "../components/sidebar/MobileSidebar"
import { EmployeeSidebar } from "../components/sidebar/EmployeeSidebar"

export function ClientSidebarWrapper({ username, fullName, children }: {
  username: string
  fullName: string
  children: React.ReactNode
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 h-11 bg-white z-40 flex items-center justify-between px-4">
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
        <span className="text-[#1d1d1f] text-xs tracking-[-0.12px]">BaoCom</span>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-xs font-semibold text-white">
            {username.substring(0, 2).toUpperCase()}
          </span>
        </div>
      </header>
      <MobileSidebar isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <EmployeeSidebar username={username} fullName={fullName} />
      </MobileSidebar>
      {children}
    </>
  )
}
