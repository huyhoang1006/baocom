// tests/fakes/zca-js.ts
// Mock factory for zca-js module. Use createMockZalo() in tests and pass to
// vi.mock('zca-js', () => mockZcaJsModule(mockApi)) or assign to a hoisted ref.

import { vi } from 'vitest'

export interface QRCodeGeneratedEvent {
  image: string
  token: string
}

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
  loginQR: ReturnType<typeof vi.fn>
  triggerQREvent: (event: { event: string; data: unknown }) => void
  getEventLog: () => Array<{ event: string; at: number }>
  _opts: MockZaloOptions
}

export function createMockZalo(options: MockZaloOptions = {}): MockZaloApi {
  const eventLog: Array<{ event: string; at: number }> = []
  let qrCallback: ((event: { event: string; data: unknown }) => void) | null = null

  const api: MockZaloApi = {
    _opts: options,
    sendMessage: vi.fn(async (msg: { msg: string }, threadId: string) => {
      if (options.sendShouldThrow) throw options.sendShouldThrow
      options.onSend?.(msg, threadId)
      return { msgId: `mock-msg-${Date.now()}`, sentAt: new Date().toISOString() }
    }),
    getAllGroups: vi.fn(async () => {
      return options.groups ?? [{ groupId: '111', name: 'Mock Group' }]
    }),
    logout: vi.fn(async () => {}),
    loginQR: vi.fn(),
    triggerQREvent: (event) => {
      eventLog.push({ event: event.event, at: Date.now() })
      if (qrCallback) qrCallback(event)
    },
    getEventLog: () => eventLog,
  }

  api.loginQR.mockImplementation(
    async (
      _opts: unknown,
      callback: (event: { event: string; data: unknown }) => void
    ) => {
      qrCallback = callback
      // Simulate immediate QR generation
      setTimeout(() => {
        callback({
          event: 'QRCodeGenerated',
          data: {
            image: options.qrEvent?.image ?? 'data:image/png;base64,FAKE_QR',
            token: options.qrEvent?.token ?? 'mock-token-123',
          },
        })
      }, 10)
      // Return a never-resolving promise to mimic the long-lived loginQR
      // (bot stays in CONNECTING state until GotLoginInfo event)
      return new Promise(() => {})
    }
  )

  return api
}
