import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { getGroupId, setGroupId, isAutoSendEnabled, setAutoSendEnabled, getCron, setCron, getTemplate, setTemplate, getAll } from '@/lib/zalo/config'

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
    expect(await getTemplate()).toBe('🍱 Báo cơm {date}\n{menu}')
  })

  it('getAll returns all keys with defaults filled', async () => {
    const all = await getAll()
    expect(all.groupId).toBeNull()
    expect(all.autoSendEnabled).toBe(false)
    expect(all.cron).toBe('0 8 * * 1-5')
    expect(all.template).toBe('🍱 Báo cơm {date}\n{menu}')
  })

  it('setGroupId rejects non-numeric input', async () => {
    await expect(setGroupId('abc123')).rejects.toThrow(/groupId/)
  })

  it('setCron accepts valid 5-field expression', async () => {
    await setCron('*/5 * * * *')
    expect(await getCron()).toBe('*/5 * * * *')
  })
})
