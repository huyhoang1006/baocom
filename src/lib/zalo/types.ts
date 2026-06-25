// src/lib/zalo/types.ts

export type BotState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'EXPIRED'

export interface StoredCreds {
  cookie: string | string[]
  imei: string
  userAgent: string
  savedAt: string // ISO timestamp
}

export interface GroupInfo {
  groupId: string
  name: string
  memberCount?: number
  avatar?: string
}

export interface BotStatus {
  state: BotState
  account?: { displayName: string; avatar?: string }
  qr?: { image: string; token: string }
  lastError?: { kind: ZaloErrorKind; message: string; at: string }
  lastConnectedAt?: string
}

export type ZaloErrorKind = 'auth' | 'expired' | 'rate-limit' | 'transient' | 'fatal' | 'unknown'

export interface ClassifiedZaloError {
  kind: ZaloErrorKind
  retryable: boolean
  userMessage: string
  httpStatus: 400 | 401 | 403 | 429 | 500 | 502 | 503
  raw?: unknown
}

// zca-js event types (subset we use)
export interface QRCodeGeneratedEvent {
  image: string // base64 PNG data URL
  token: string
}
export interface QRCodeScannedEvent {
  display_name: string
  avatar: string
}
export interface GotLoginInfoEvent {
  cookie: string | string[]
  imei: string
  userAgent: string
}
