import { existsSync, readFileSync, writeFileSync, unlinkSync, chmodSync, mkdirSync } from 'fs'
import { credentialsPath, dataDir } from './paths'
import type { StoredCreds } from './types'

function ensureDataDir() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
}

export function loadCredentials(): StoredCreds | null {
  if (!existsSync(credentialsPath)) return null
  try {
    const raw = readFileSync(credentialsPath, 'utf-8')
    const parsed = JSON.parse(raw) as StoredCreds
    if (!parsed.cookie || !parsed.imei || !parsed.userAgent) {
      throw new Error('Lỗi hệ thống: credentials thiếu trường bắt buộc')
    }
    return parsed
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('Lỗi hệ thống: credentials file bị hỏng, vui lòng xoá và quét QR lại')
    }
    throw err
  }
}

export function saveCredentials(creds: Omit<StoredCreds, 'savedAt'>): StoredCreds {
  ensureDataDir()
  const full: StoredCreds = { ...creds, savedAt: new Date().toISOString() }
  writeFileSync(credentialsPath, JSON.stringify(full), 'utf-8')
  if (process.platform !== 'win32') {
    try {
      chmodSync(credentialsPath, 0o600)
    } catch {
      // best-effort on systems without chmod support
    }
  }
  return full
}

export function clearCredentials(): void {
  if (existsSync(credentialsPath)) {
    unlinkSync(credentialsPath)
  }
}
