'use client'

import { useEffect, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
  autoHideMs?: number
  action?: { label: string; onClick: () => void }
}

interface Props {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

const STYLES: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✅' },
  error: { bg: 'bg-red-50', border: 'border-red-200', icon: '❌' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ℹ️' },
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const style = STYLES[toast.type]

  useEffect(() => {
    if (toast.autoHideMs === 0) return // sticky
    const timer = setTimeout(() => onDismiss(toast.id), toast.autoHideMs ?? 4000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.autoHideMs, onDismiss])

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-lg px-4 py-3 shadow-lg
        animate-[slideIn_0.2s_ease-out] flex items-start gap-2`}
      role="alert"
    >
      <span className="text-base mt-0.5">{style.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{toast.message}</p>
        {toast.description && (
          <p className="text-xs text-gray-600 mt-0.5">{toast.description}</p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick()
              onDismiss(toast.id)
            }}
            className="text-xs font-medium text-blue-600 hover:underline mt-1"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-gray-600 text-sm ml-2 shrink-0"
        aria-label="Đóng"
      >
        ✕
      </button>
    </div>
  )
}

/** Hook to manage toast state */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback(
    (type: ToastType, message: string, opts?: { description?: string; autoHideMs?: number; action?: Toast['action'] }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setToasts((prev) => [...prev, { id, type, message, ...opts }])
    },
    []
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, showToast, dismiss }
}
