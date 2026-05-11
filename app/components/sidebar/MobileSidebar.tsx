"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface Props {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function MobileSidebar({ isOpen, onClose, children }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!mounted) return null

  return createPortal(
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      <div
        className={`fixed left-0 top-0 h-full w-[260px] bg-surface-container-lowest z-[65] shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container-low active:bg-surface-container-high"
          aria-label="Close drawer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}