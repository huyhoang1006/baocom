import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  getGroupId, setGroupId, isAutoSendEnabled, setAutoSendEnabled,
  getCron, setCron, getTemplate, getAll,
  getSendMode, setSendMode, getManualDate, setManualDate,
} from '@/lib/zalo/config'

describe('zalo config helpers', () => {
  beforeEach(async () => {
    await prisma.zaloConfig.deleteMany()
  })

  it('setGroupId then getGroupId roundtrips', async () => {
    await setGroupId('1234567890')
    expect(await getGroupId()).toBe('1234567890')
  })

  it('getGroupId returns null when not set', async () => {
    expect(await getGroupId()).toBeNull()
  })

  it('isAutoSendEnabled defaults to false', async () => {
    expect(await isAutoSendEnabled()).toBe(false)
  })

  it('setAutoSendEnabled persists value', async () => {
    await setAutoSendEnabled(true)
    expect(await isAutoSendEnabled()).toBe(true)
  })

  it('getCron returns default when not set', async () => {
    expect(await getCron()).toBe('0 8 * * 1-5')
  })

  it('setCron rejects invalid expression', async () => {
    await expect(setCron('not-a-cron')).rejects.toThrow()
  })

  it('getTemplate returns default when not set', async () => {
    expect(await getTemplate()).toBe('🍱 Báo cơm {date}\n\n{registrations}\n\n📋 Thực đơn:\n{menu}')
  })

  it('getAll returns all keys with defaults filled', async () => {
    const all = await getAll()
    expect(all.groupId).toBeNull()
    expect(all.autoSendEnabled).toBe(false)
    expect(all.cron).toBe('0 8 * * 1-5')
    expect(all.template).toBe('🍱 Báo cơm {date}\n\n{registrations}\n\n📋 Thực đơn:\n{menu}')
    expect(all.mode).toBe('auto')
    expect(all.manualDate).toBeNull()
  })

  it('setGroupId rejects non-numeric input', async () => {
    await expect(setGroupId('abc123')).rejects.toThrow(/groupId/)
  })

  it('setCron accepts valid 5-field expression', async () => {
    await setCron('*/5 * * * *')
    expect(await getCron()).toBe('*/5 * * * *')
  })
})

describe('sendMode helpers', () => {
  beforeEach(async () => {
    await prisma.zaloConfig.deleteMany()
  })

  it('default mode is auto', async () => {
    expect(await getSendMode()).toBe('auto')
  })

  it('setSendMode roundtrips auto/today/manual', async () => {
    await setSendMode('today')
    expect(await getSendMode()).toBe('today')
    await setSendMode('manual')
    expect(await getSendMode()).toBe('manual')
    await setSendMode('auto')
    expect(await getSendMode()).toBe('auto')
  })

  it('setSendMode rejects invalid value', async () => {
    await expect(setSendMode('invalid' as 'auto')).rejects.toThrow(/SendMode/)
  })

  it('getManualDate returns null when empty', async () => {
    expect(await getManualDate()).toBeNull()
  })

  it('setManualDate roundtrips', async () => {
    const d = new Date(2026, 5, 25, 0, 0, 0)
    await setManualDate(d)
    const got = await getManualDate()
    expect(got).not.toBeNull()
    expect(formatYMD(got!)).toBe('2026-06-25')
  })

  it('setManualDate(null) clears', async () => {
    await setManualDate(new Date(2026, 5, 25))
    await setManualDate(null)
    expect(await getManualDate()).toBeNull()
  })
})

function formatYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
