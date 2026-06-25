'use client'

import { useState } from 'react'
import type { BotStatus } from '@/lib/zalo/types'

interface Props {
  status: BotStatus
  onUpdate: () => Promise<void>
}

export function SetupCard({ status, onUpdate }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startQR() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/zalo/qr', { method: 'POST', credentials: 'include' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Lỗi khởi tạo QR')
      }
      await onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    if (!confirm('Đăng xuất bot? Cần quét QR lại.')) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/zalo/qr', { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Lỗi logout')
      }
      await onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-hairline p-5">
      <h2 className="font-semibold text-lg mb-3">1. Kết nối</h2>

      {status.state === 'DISCONNECTED' && (
        <div>
          <p className="text-sm text-ink-muted-48 mb-3">
            Bot chưa được kết nối. Bấm nút bên dưới để quét QR.
          </p>
          <button
            onClick={startQR}
            disabled={busy}
            className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
          >
            {busy ? 'Đang tạo QR…' : 'Bắt đầu quét QR'}
          </button>
        </div>
      )}

      {status.state === 'CONNECTING' && status.qr && (
        <div>
          <p className="text-sm mb-3">Mở Zalo trên điện thoại → quét mã bên dưới:</p>
          <img
            src={status.qr.image}
            alt="Zalo QR code"
            className="w-64 h-64 border border-hairline rounded-md"
          />
        </div>
      )}

      {status.state === 'CONNECTED' && (
        <div>
          <p className="text-sm text-green-600 mb-3">
            ✓ Đã kết nối{status.account?.displayName ? ` với ${status.account.displayName}` : ''}
          </p>
          <button
            onClick={logout}
            disabled={busy}
            className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
          >
            Đăng xuất
          </button>
        </div>
      )}

      {status.state === 'EXPIRED' && (
        <div>
          <p className="text-sm text-orange-600 mb-3">
            ⚠ Bot hết hạn. Vui lòng kết nối lại.
          </p>
          <button
            onClick={startQR}
            disabled={busy}
            className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
          >
            Kết nối lại
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </section>
  )
}
