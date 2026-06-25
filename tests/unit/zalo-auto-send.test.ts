import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { buildMessage, shouldRunAutoSend } from '@/lib/zalo/auto-send'

describe('buildMessage', () => {
  it('formats menu items as bullet list', () => {
    const result = buildMessage('🍱 Báo cơm {date}\n{menu}', '25/06/2026', ['Phở bò', 'Cơm gà'])
    expect(result).toBe('🍱 Báo cơm 25/06/2026\n- Phở bò\n- Cơm gà')
  })

  it('handles empty menu gracefully', () => {
    const result = buildMessage('🍱 {date}\n{menu}', '25/06/2026', [])
    expect(result).toBe('🍱 25/06/2026\n(Chưa có món)')
  })

  it('substitutes both placeholders correctly', () => {
    const result = buildMessage('🍱 {date}\n{menu}', '01/01/2026', ['Món A'])
    expect(result).toBe('🍱 01/01/2026\n- Món A')
  })
})

describe('shouldRunAutoSend', () => {
  beforeEach(async () => {
    await prisma.zaloConfig.deleteMany()
  })

  it('returns false when autoSend disabled', async () => {
    const result = await shouldRunAutoSend({ botConnected: true, groupId: '111' })
    expect(result).toBe(false)
  })

  it('returns false when groupId not set', async () => {
    await prisma.zaloConfig.create({ data: { key: 'zalo.autoSend.enabled', value: 'true' } })
    const result = await shouldRunAutoSend({ botConnected: true, groupId: null })
    expect(result).toBe(false)
  })

  it('returns false when bot not connected', async () => {
    await prisma.zaloConfig.create({ data: { key: 'zalo.autoSend.enabled', value: 'true' } })
    await prisma.zaloConfig.create({ data: { key: 'zalo.groupId', value: '111' } })
    const result = await shouldRunAutoSend({ botConnected: false, groupId: '111' })
    expect(result).toBe(false)
  })

  it('returns true when all conditions met', async () => {
    await prisma.zaloConfig.create({ data: { key: 'zalo.autoSend.enabled', value: 'true' } })
    await prisma.zaloConfig.create({ data: { key: 'zalo.groupId', value: '111' } })
    const result = await shouldRunAutoSend({ botConnected: true, groupId: '111' })
    expect(result).toBe(true)
  })
})
