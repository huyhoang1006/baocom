import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  buildMessage, shouldRunAutoSend,
  nextWorkday, isWorkday, formatDateKey, dayNameVi,
  pickTargetDate,
} from '@/lib/zalo/auto-send'
import { setSendMode, setManualDate } from '@/lib/zalo/config'

describe('buildMessage', () => {
  it('formats menu items as bullet list', () => {
    const result = buildMessage('🍱 Báo cơm {date}\n{menu}', {
      date: '25/06/2026',
      menu: ['Phở bò', 'Cơm gà'],
      registrations: '',
    })
    expect(result).toBe('🍱 Báo cơm 25/06/2026\n- Phở bò\n- Cơm gà')
  })

  it('handles empty menu gracefully', () => {
    const result = buildMessage('🍱 {date}\n{menu}', {
      date: '25/06/2026',
      menu: [],
      registrations: '',
    })
    expect(result).toBe('🍱 25/06/2026\n(Chưa có món)')
  })

  it('substitutes both placeholders correctly', () => {
    const result = buildMessage('🍱 {date}\n{menu}', {
      date: '01/01/2026',
      menu: ['Món A'],
      registrations: '',
    })
    expect(result).toBe('🍱 01/01/2026\n- Món A')
  })

  it('substitutes {registrations} placeholder', () => {
    const result = buildMessage('{date}\n{registrations}', {
      date: '26/06/2026',
      menu: [],
      registrations: '1. NCPT: 01 suất a/c (a)',
    })
    expect(result).toBe('26/06/2026\n1. NCPT: 01 suất a/c (a)')
  })

  it('renders empty registrations as fallback text', () => {
    const result = buildMessage('{registrations}', {
      date: '26/06/2026',
      menu: [],
      registrations: '',
    })
    expect(result).toBe('(Chưa có ai đăng ký)')
  })

  it('substitutes all three placeholders together (DRY guarantee)', () => {
    const result = buildMessage('🍱 {date}\n\n{registrations}\n\n📋 {menu}', {
      date: '26/06/2026',
      menu: ['Phở', 'Cơm gà'],
      registrations: '1. NCPT: 02 suất a/c (a, b)',
    })
    expect(result).toBe('🍱 26/06/2026\n\n1. NCPT: 02 suất a/c (a, b)\n\n📋 - Phở\n- Cơm gà')
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

describe('isWorkday', () => {
  it('Mon-Fri → true', () => {
    expect(isWorkday(new Date('2026-06-22'))).toBe(true) // T2
    expect(isWorkday(new Date('2026-06-23'))).toBe(true) // T3
    expect(isWorkday(new Date('2026-06-26'))).toBe(true) // T6
  })
  it('Sat → false', () => expect(isWorkday(new Date('2026-06-27'))).toBe(false)) // T7
  it('Sun → false', () => expect(isWorkday(new Date('2026-06-28'))).toBe(false)) // CN
})

describe('nextWorkday', () => {
  it('T2 → T3', () => {
    expect(formatDateKey(nextWorkday(new Date('2026-06-22')))).toBe('23/06/2026')
  })
  it('T5 → T6', () => {
    expect(formatDateKey(nextWorkday(new Date('2026-06-25')))).toBe('26/06/2026')
  })
  it('T6 → T2 tuần sau', () => {
    expect(formatDateKey(nextWorkday(new Date('2026-06-26')))).toBe('29/06/2026') // T2 tuần sau
  })
  it('T7 → T2 tuần sau', () => {
    expect(formatDateKey(nextWorkday(new Date('2026-06-27')))).toBe('29/06/2026')
  })
  it('CN → T2', () => {
    expect(formatDateKey(nextWorkday(new Date('2026-06-28')))).toBe('29/06/2026')
  })
})

describe('formatDateKey', () => {
  it('zero-pads day and month', () => {
    expect(formatDateKey(new Date(2026, 0, 5))).toBe('05/01/2026') // month = 0-based
  })
})

describe('dayNameVi', () => {
  it('returns CN/T2/T3/T4/T5/T6/T7', () => {
    expect(dayNameVi(new Date('2026-06-21'))).toBe('CN') // CN
    expect(dayNameVi(new Date('2026-06-22'))).toBe('T2')
    expect(dayNameVi(new Date('2026-06-27'))).toBe('T7')
  })
})

describe('pickTargetDate', () => {
  beforeEach(async () => {
    await prisma.zaloConfig.deleteMany()
  })

  it('mode auto + T2 (sáng) → T3', async () => {
    await setSendMode('auto')
    const t2 = new Date(2026, 5, 22, 8, 0, 0) // T2 22/06/2026 08:00
    const target = await pickTargetDate(t2)
    expect(formatDateKey(target)).toBe('23/06/2026')
  })

  it('mode auto + T6 (tối) → T2 tuần sau', async () => {
    await setSendMode('auto')
    const t6 = new Date(2026, 5, 26, 22, 0, 0) // T6 26/06/2026 22:00
    const target = await pickTargetDate(t6)
    expect(formatDateKey(target)).toBe('29/06/2026')
  })

  it('mode auto + T7 → T2 tuần sau (dù today là T7)', async () => {
    await setSendMode('auto')
    const t7 = new Date(2026, 5, 27, 10, 0, 0) // T7 27/06/2026
    const target = await pickTargetDate(t7)
    expect(formatDateKey(target)).toBe('29/06/2026')
  })

  it('mode today + T2 → T2', async () => {
    await setSendMode('today')
    const t2 = new Date(2026, 5, 22, 8, 0, 0)
    const target = await pickTargetDate(t2)
    expect(formatDateKey(target)).toBe('22/06/2026')
  })

  it('mode today + T7 → T2 tuần sau', async () => {
    await setSendMode('today')
    const t7 = new Date(2026, 5, 27, 10, 0, 0)
    const target = await pickTargetDate(t7)
    expect(formatDateKey(target)).toBe('29/06/2026')
  })

  it('mode manual + date cụ thể → date đó', async () => {
    await setSendMode('manual')
    await setManualDate(new Date(2026, 5, 25)) // T5
    const t2 = new Date(2026, 5, 22, 8, 0, 0)
    const target = await pickTargetDate(t2)
    expect(formatDateKey(target)).toBe('25/06/2026')
  })

  it('mode manual + null → fallback auto', async () => {
    await setSendMode('manual')
    await setManualDate(null)
    const t2 = new Date(2026, 5, 22, 8, 0, 0)
    const target = await pickTargetDate(t2)
    expect(formatDateKey(target)).toBe('23/06/2026') // auto: T2 → T3
  })

  it('mode manual + T7 (admin chọn T7) → vẫn T7', async () => {
    await setSendMode('manual')
    await setManualDate(new Date(2026, 5, 27)) // T7
    const t2 = new Date(2026, 5, 22, 8, 0, 0)
    const target = await pickTargetDate(t2)
    expect(formatDateKey(target)).toBe('27/06/2026')
  })

  it('default mode (no config) → auto behavior', async () => {
    const t2 = new Date(2026, 5, 22, 8, 0, 0)
    const target = await pickTargetDate(t2)
    expect(formatDateKey(target)).toBe('23/06/2026')
  })
})
