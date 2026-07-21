import { prisma } from '@/lib/prisma'
import { validate as validateCronExpr } from 'node-cron'

const KEYS = {
  groupId: 'zalo.groupId',
  autoSendEnabled: 'zalo.autoSend.enabled',
  cron: 'zalo.autoSend.cron',
  template: 'zalo.autoSend.template',
  mode: 'zalo.autoSend.mode',
  manualDate: 'zalo.autoSend.manualDate',
} as const

const DEFAULTS = {
  autoSendEnabled: 'false',
  cron: '0 8 * * 1-5',
  template: '🍱 Báo cơm {date}\n\n{registrations}\n\nTổng: {total} suất ăn',
  mode: 'auto',
  manualDate: '',
}

async function readValue(key: string): Promise<string | null> {
  const row = await prisma.zaloConfig.findUnique({ where: { key } })
  return row?.value ?? null
}

async function writeValue(key: string, value: string): Promise<void> {
  await prisma.zaloConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
}

export async function getGroupId(): Promise<string | null> {
  return readValue(KEYS.groupId)
}

export async function setGroupId(value: string): Promise<void> {
  if (!/^\d{6,20}$/.test(value)) {
    throw new Error('groupId không hợp lệ (phải là chuỗi số 6-20 ký tự)')
  }
  await writeValue(KEYS.groupId, value)
}

export async function isAutoSendEnabled(): Promise<boolean> {
  const v = (await readValue(KEYS.autoSendEnabled)) ?? DEFAULTS.autoSendEnabled
  return v === 'true'
}

export async function setAutoSendEnabled(value: boolean): Promise<void> {
  await writeValue(KEYS.autoSendEnabled, value ? 'true' : 'false')
}

export async function getCron(): Promise<string> {
  return (await readValue(KEYS.cron)) ?? DEFAULTS.cron
}

export async function setCron(expr: string): Promise<void> {
  if (!validateCronExpr(expr)) {
    throw new Error(`Cron expression không hợp lệ: "${expr}"`)
  }
  await writeValue(KEYS.cron, expr)
}

export async function getTemplate(): Promise<string> {
  return (await readValue(KEYS.template)) ?? DEFAULTS.template
}

export async function setTemplate(value: string): Promise<void> {
  if (value.length === 0 || value.length > 2000) {
    throw new Error('Template phải có độ dài 1-2000 ký tự')
  }
  await writeValue(KEYS.template, value)
}

export async function getAll() {
  const [groupId, autoSendEnabled, cron, template, mode, manualDate] = await Promise.all([
    getGroupId(),
    isAutoSendEnabled(),
    getCron(),
    getTemplate(),
    getSendMode(),
    getManualDate(),
  ])
  return { groupId, autoSendEnabled, cron, template, mode, manualDate }
}

export type SendMode = 'auto' | 'today' | 'manual'

const VALID_MODES: readonly SendMode[] = ['auto', 'today', 'manual']

export async function getSendMode(): Promise<SendMode> {
  const v = (await readValue(KEYS.mode)) ?? DEFAULTS.mode
  if (v === 'auto' || v === 'today' || v === 'manual') return v
  return 'auto'
}

export async function setSendMode(value: SendMode): Promise<void> {
  if (!VALID_MODES.includes(value)) {
    throw new Error(`SendMode không hợp lệ: "${value}" (chỉ chấp nhận: ${VALID_MODES.join(', ')})`)
  }
  await writeValue(KEYS.mode, value)
}

export async function getManualDate(): Promise<Date | null> {
  const v = await readValue(KEYS.manualDate)
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

export async function setManualDate(date: Date | null): Promise<void> {
  await writeValue(KEYS.manualDate, date ? date.toISOString() : '')
}
