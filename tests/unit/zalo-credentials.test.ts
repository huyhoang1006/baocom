import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, existsSync, statSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// Hoist so the mock factory can close over it
const { tmpDirRef } = vi.hoisted(() => ({ tmpDirRef: { current: '' } }))

vi.mock('@/lib/zalo/paths', () => ({
  get dataDir() { return tmpDirRef.current },
  get credentialsPath() { return join(tmpDirRef.current, 'zalo-bot-credentials.json') },
  get errorLogPath() { return join(tmpDirRef.current, 'zalo-bot-errors.log') },
}))

import { loadCredentials, saveCredentials, clearCredentials } from '@/lib/zalo/credentials'

describe('credentials', () => {
  beforeEach(() => {
    tmpDirRef.current = mkdtempSync(join(tmpdir(), 'zalo-cred-'))
  })
  afterEach(() => {
    if (tmpDirRef.current && existsSync(tmpDirRef.current)) {
      rmSync(tmpDirRef.current, { recursive: true, force: true })
    }
  })

  it('returns null when file does not exist', () => {
    expect(loadCredentials()).toBeNull()
  })

  it('roundtrips cookie + imei + userAgent', () => {
    const creds = { cookie: ['c1=1', 'c2=2'], imei: 'abc123', userAgent: 'UA/1.0' }
    saveCredentials(creds)
    const loaded = loadCredentials()
    expect(loaded).toEqual({ ...creds, savedAt: expect.any(String) })
  })

  it('throws on corrupt JSON', () => {
    writeFileSync(join(tmpDirRef.current, 'zalo-bot-credentials.json'), '{not json')
    expect(() => loadCredentials()).toThrow(/Lỗi hệ thống/)
  })

  it('clear() removes the file', () => {
    saveCredentials({ cookie: 'x', imei: 'y', userAgent: 'z' })
    clearCredentials()
    expect(existsSync(join(tmpDirRef.current, 'zalo-bot-credentials.json'))).toBe(false)
  })

  it('save sets file mode to 600 on POSIX', () => {
    if (process.platform === 'win32') return // skip on Windows
    saveCredentials({ cookie: 'x', imei: 'y', userAgent: 'z' })
    const st = statSync(join(tmpDirRef.current, 'zalo-bot-credentials.json'))
    expect((st.mode & 0o777) === 0o600).toBe(true)
  })
})
