"use client"

import { useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"

interface Props {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function MobileSidebar({ isOpen, onClose, children }: Props) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleBodyOverflow = useCallback((overflow: string) => {
    document.body.style.overflow = overflow
  }, [])

  useEffect(() => {
    if (!isClient) return

    if (isOpen) {
      handleBodyOverflow("hidden")
    } else {
      handleBodyOverflow("")
    }

    return () => {
      handleBodyOverflow("")
    }
  }, [isOpen, isClient, handleBodyOverflow])

  if (!isClient) return null

  return createPortal(
    <>
      {/* Backdrop: bg-black/50 (40% opacity), z-60 */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      {/* Drawer: w-[280px], white bg, shadow, z-65 */}
      <div
        className={`fixed left-0 top-0 h-full w-[280px] bg-white shadow-lg z-[65] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        {/* Close button: 44px, circular */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container active:bg-surface-container-high"
          aria-label="Close drawer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Content */}
        <div className="h-full overflow-y-auto pt-16">
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}