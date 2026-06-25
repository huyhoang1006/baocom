'use client'

import type { BotStatus } from '@/lib/zalo/types'

interface Props {
  status: BotStatus
  onReconnect?: () => void
}

export function StatusBanner({ status, onReconnect }: Props) {
  switch (status.state) {
    case 'DISCONNECTED':
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              Bot chưa kết nối — quét QR ở Card 1 để bắt đầu
            </p>
          </div>
        </div>
      )

    case 'CONNECTING':
      return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-3">
          <span className="text-lg animate-pulse">⏳</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Đang quét QR — mở Zalo trên điện thoại và confirm...
            </p>
          </div>
        </div>
      )

    case 'CONNECTED':
      return (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">✅</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-900">
              Đã kết nối{status.account?.displayName ? ` với "${status.account.displayName}"` : ''}
            </p>
            {status.lastConnectedAt && (
              <p className="text-xs text-emerald-700 mt-0.5">
                Đăng nhập lúc: {new Date(status.lastConnectedAt).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      )

    case 'EXPIRED':
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">🔴</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Bot hết hạn — cần quét QR lại</p>
            {status.lastError && (
              <p className="text-xs text-red-700 mt-0.5">{status.lastError.message}</p>
            )}
          </div>
          {onReconnect && (
            <button
              onClick={onReconnect}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 whitespace-nowrap"
            >
              Quét QR lại
            </button>
          )}
        </div>
      )

    default:
      return null
  }
}
