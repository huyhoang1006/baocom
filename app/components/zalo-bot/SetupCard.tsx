'use client'

import { useState } from 'react'
import type { BotStatus } from '@/lib/zalo/types'
import type { ToastType } from './Toast'

interface Props {
  status: BotStatus
  onUpdate: () => Promise<void>
  showToast: (type: ToastType, message: string, opts?: { description?: string }) => void
}

export function SetupCard({ status, onUpdate, showToast }: Props) {
  const [busy, setBusy] = useState(false)

  async function startQR() {
    setBusy(true)
    try {
      const res = await fetch('/api/zalo/qr', { method: 'POST', credentials: 'include' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Lỗi khởi tạo QR')
      }
      await onUpdate()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi'
      showToast('error', 'Lỗi khởi tạo QR', { description: msg })
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    if (!confirm('Đăng xuất bot? Cần quét QR lại.')) return
    setBusy(true)
    try {
      const res = await fetch('/api/zalo/qr', { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Lỗi logout')
      }
      showToast('info', 'Đã đăng xuất bot')
      await onUpdate()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi'
      showToast('error', 'Lỗi đăng xuất', { description: msg })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="card-setup" className="bg-white rounded-lg border border-hairline p-5">
      <h2 className="font-semibold text-lg mb-3">1. Kết nối</h2>

      {status.state === 'DISCONNECTED' && (
        <div>
          <div className="text-center py-6">
            <div className="text-4xl mb-3">📱</div>
            <p className="text-sm text-ink-muted-48 mb-4">
              Quét QR để kết nối tài khoản Zalo Bot
            </p>
            <button
              onClick={startQR}
              disabled={busy}
              className="px-5 py-2.5 bg-primary text-white rounded-md disabled:opacity-50 font-medium"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Đang tạo QR…
                </span>
              ) : (
                'Bắt đầu quét QR'
              )}
            </button>
          </div>
          <p className="text-xs text-ink-muted-48 text-center">
            💡 Dùng tài khoản Zalo phụ (không phải TK chính)
          </p>
        </div>
      )}

      {status.state === 'CONNECTING' && status.qr && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <p className="text-sm font-medium text-primary">Đang chờ quét QR...</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-ink-muted-48 mb-3">
              Mở Zalo trên điện thoại → quét mã bên dưới:
            </p>
            <img
              src={status.qr.image}
              alt="Zalo QR code"
              className="w-64 h-64 border border-hairline rounded-md mx-auto"
            />
            <p className="text-xs text-ink-muted-48 mt-2">
              ⏱ QR hết hạn sau ~2 phút
            </p>
          </div>
        </div>
      )}

      {status.state === 'CONNECTED' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🟢</span>
            <p className="text-sm font-medium text-green-700">
              Đã kết nối{status.account?.displayName ? ` với "${status.account.displayName}"` : ''}
            </p>
          </div>
          {status.lastConnectedAt && (
            <p className="text-xs text-ink-muted-48 mb-3">
              Đăng nhập lúc: {new Date(status.lastConnectedAt).toLocaleString('vi-VN')}
            </p>
          )}
          <button
            onClick={logout}
            disabled={busy}
            className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50 text-sm"
          >
            🔴 Đăng xuất bot
          </button>
          <p className="text-xs text-ink-muted-48 mt-2">
            ⚠️ Đăng xuất sẽ dừng auto-send cho đến khi kết nối lại bằng QR
          </p>
        </div>
      )}

      {status.state === 'EXPIRED' && (
        <div>
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🔴</div>
            <p className="text-sm font-medium text-red-700 mb-2">
              Phiên đăng nhập Zalo đã hết hạn
            </p>
            {status.lastError && (
              <p className="text-xs text-red-600 mb-3">
                {status.lastError.message}
              </p>
            )}
            <button
              onClick={startQR}
              disabled={busy}
              className="px-5 py-2.5 bg-primary text-white rounded-md disabled:opacity-50 font-medium"
            >
              {busy ? 'Đang tạo QR…' : '🔄 Kết nối lại bằng QR'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
