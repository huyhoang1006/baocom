// tests/fakes/zca-js.ts
// Mock factory matching the REAL zca-js API shape (LoginQRCallbackEventType enum + {type, data, actions}).
// Use with vi.mock('zca-js', ...) by re-exporting createMockZalo's instance via a hoisted ref.

import { vi } from 'vitest'

// Mirror real zca-js enum values
export const LoginQRCallbackEventType = {
  QRCodeGenerated: 0,
  QRCodeExpired: 1,
  QRCodeScanned: 2,
  QRCodeDeclined: 3,
  GotLoginInfo: 4,
} as const

export interface MockZaloOptions {
  qrEvent?: { image?: string; token?: string }
  loginShouldThrow?: Error | null
  sendShouldThrow?: Error | null
  groups?: Array<{ groupId: string; name: string; memberCount?: number }>
  onSend?: (msg: { msg: string }, threadId: string) => void
}

export interface MockZaloApi {
  sendMessage: ReturnType<typeof vi.fn>
  getAllGroups: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
  triggerQREvent: (eventType: number, data: unknown) => void
  getEventLog: () => Array<{ event: number; at: number }>
  _opts: MockZaloOptions
}

// The fake zca-js module exports a class Zalo with login() and loginQR() instance methods
export interface MockZaloInstance {
  login: ReturnType<typeof vi.fn>
  loginQR: ReturnType<typeof vi.fn>
}

export function createMockZaloInstance(api: MockZaloApi, opts: MockZaloOptions = {}): MockZaloInstance {
  let qrCallback: ((event: unknown) => unknown) | null = null
  const eventLog: Array<{ event: number; at: number }> = []

  const login = vi.fn(async (_creds: unknown) => {
    if (opts.loginShouldThrow) throw opts.loginShouldThrow
    return api
  })

  const loginQR = vi.fn(async (
    _options: unknown,
    callback: (event: unknown) => unknown
  ) => {
    qrCallback = callback
    // Simulate immediate QR generation
    setTimeout(() => {
      callback({
        type: LoginQRCallbackEventType.QRCodeGenerated,
        data: {
          code: 'mock-code',
          image: opts.qrEvent?.image ?? 'data:image/png;base64,FAKE_QR',
          options: { enabledCheckOCR: false, enabledMultiLayer: false },
          token: opts.qrEvent?.token ?? 'mock-token-123',
        },
        actions: {
          saveToFile: async () => undefined,
          retry: () => undefined,
          abort: () => undefined,
        },
      })
    }, 10)
    // Return a never-resolving promise — bot stays in CONNECTING until triggerQREvent(GotLoginInfo)
    return new Promise<MockZaloApi>(() => {})
  })

  return { login, loginQR }
}

export function createMockZalo(options: MockZaloOptions = {}): MockZaloApi {
  const api: MockZaloApi = {
    _opts: options,
    sendMessage: vi.fn(async (msg: { msg: string }, threadId: string) => {
      if (options.sendShouldThrow) throw options.sendShouldThrow
      options.onSend?.(msg, threadId)
      return { msgId: `mock-msg-${Date.now()}` }
    }),
    getAllGroups: vi.fn(async () => {
      return options.groups ?? [{ groupId: '111', name: 'Mock Group' }]
    }),
    logout: vi.fn(async () => {}),
    triggerQREvent: (_eventType, _data) => {
      // No-op in this base mock. Tests that need to trigger real events should
      // call instance.loginQR.mock.calls[0][1]({ type, data, actions }) directly.
    },
    getEventLog: () => [],
  }

  return api
}
