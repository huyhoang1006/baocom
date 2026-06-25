import { prisma } from '@/lib/prisma'
import { validate as validateCronExpr } from 'node-cron'

const KEYS = {
  groupId: 'zalo.groupId',
  autoSendEnabled: 'zalo.autoSend.enabled',
  cron: 'zalo.autoSend.cron',
  template: 'zalo.autoSend.template',
} as const

const DEFAULTS = {
  autoSendEnabled: 'false',
  cron: '0 8 * * 1-5',
  template: '🍱 Báo cơm {date}\n{menu}',
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
  const [groupId, autoSendEnabled, cron, template] = await Promise.all([
    getGroupId(),
    isAutoSendEnabled(),
    getCron(),
    getTemplate(),
  ])
  return { groupId, autoSendEnabled, cron, template }
}
