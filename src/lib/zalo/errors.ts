import type { ClassifiedZaloError, ZaloErrorKind } from './types'

interface ZaloErrorShape {
  code?: number
  message?: string
  name?: string
}

function detectKind(err: ZaloErrorShape): ZaloErrorKind {
  // Rate limit first (most specific)
  if (err.code === 429) return 'rate-limit'
  // Auth / expired cookie (zca-js codes 120/121 or message match)
  if (err.code === 120 || err.code === 121) return 'expired'
  if (err.code === 401 || err.code === 403) return 'auth'
  // Our internal: BOT_NOT_SETUP (no credentials) → auth, not transient
  if (typeof err.message === 'string' && err.message.includes('BOT_NOT_SETUP')) return 'auth'
  // Server-side transient (500-599 EXCEPT the BOT_NOT_SETUP 503 which we caught above)
  if (err.code !== undefined && err.code >= 500 && err.code < 600) return 'transient'
  // Zca-js typed errors
  if (err.name === 'ZaloApiLoginQRAborted' || err.name === 'ZaloApiLoginQRDeclined') return 'fatal'
  if (typeof err.message === 'string') {
    if (err.message.includes('ZaloApiLoginQR')) return 'fatal'
    if (err.message.toLowerCase().includes('cookie')) return 'expired'
  }
  return 'unknown'
}

export function classifyZaloError(err: unknown): ClassifiedZaloError {
  const shape: ZaloErrorShape =
    err instanceof Error
      ? { name: err.name, message: err.message, code: (err as unknown as { code?: number }).code }
      : (err as ZaloErrorShape)

  const kind = detectKind(shape)
  const msg = (shape.message ?? '').toString()

  switch (kind) {
    case 'expired':
      return {
        kind,
        retryable: false,
        httpStatus: 503,
        userMessage: 'Bot hết hạn, cần kết nối lại bằng QR.',
        raw: err,
      }
    case 'auth':
      return {
        kind,
        retryable: false,
        httpStatus: 503,
        userMessage: 'Bot chưa được xác thực.',
        raw: err,
      }
    case 'rate-limit':
      return {
        kind,
        retryable: true,
        httpStatus: 429,
        userMessage: 'Zalo đang giới hạn tốc độ, thử lại sau vài giây.',
        raw: err,
      }
    case 'transient':
      return {
        kind,
        retryable: true,
        httpStatus: 502,
        userMessage: `Zalo server lỗi tạm thời: ${msg || 'đang thử lại'}.`,
        raw: err,
      }
    case 'fatal':
      return {
        kind,
        retryable: false,
        httpStatus: 400,
        userMessage: msg.includes('Declined') ? 'Bạn đã từ chối đăng nhập.' : 'QR bị huỷ.',
        raw: err,
      }
    default:
      return {
        kind: 'unknown',
        retryable: false,
        httpStatus: 500,
        userMessage: 'Lỗi hệ thống, vui lòng thử lại.',
        raw: err,
      }
  }
}
