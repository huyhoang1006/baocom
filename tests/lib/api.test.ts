import { afterEach, describe, expect, test, vi } from 'vitest'
import { APIError, authApi } from '@/lib/api'

describe('authApi.login', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('throws API error message from invalid login response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    }))

    await expect(authApi.login('admin', 'wrongpassword')).rejects.toMatchObject({
      name: 'APIError',
      message: 'Invalid credentials',
      status: 401,
    } satisfies Partial<APIError>)
  })
})
