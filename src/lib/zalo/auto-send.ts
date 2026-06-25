import cron, { type ScheduledTask } from 'node-cron'
import { appendFileSync, mkdirSync, existsSync } from 'fs'
import { prisma } from '@/lib/prisma'
import { bot } from './bot'
import { getCron, isAutoSendEnabled, getTemplate, getGroupId } from './config'
import { classifyZaloError } from './errors'
import { errorLogPath, dataDir } from './paths'

function ensureDataDir() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
}

function logError(entry: Record<string, unknown>) {
  try {
    ensureDataDir()
    appendFileSync(errorLogPath, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf-8')
  } catch (err) {
    console.error('[zalo-bot] Failed to write error log:', err)
  }
}

export function buildMessage(template: string, date: string, menu: string[]): string {
  const menuText = menu.length > 0 ? menu.map((m) => `- ${m}`).join('\n') : '(Chưa có món)'
  return template.replace('{date}', date).replace('{menu}', menuText)
}

export interface ShouldRunArgs {
  botConnected: boolean
  groupId: string | null
}

export async function shouldRunAutoSend({ botConnected, groupId }: ShouldRunArgs): Promise<boolean> {
  const enabled = await isAutoSendEnabled()
  if (!enabled) return false
  if (!groupId) return false
  if (!botConnected) return false
  return true
}

async function getTodayMenu(): Promise<string[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const menu = await prisma.dailyMenu.findFirst({
    where: { date: { gte: today, lt: tomorrow } },
    include: { meals: { include: { meal: true }, orderBy: { sortOrder: 'asc' } } },
  })
  if (!menu) return []
  return menu.meals.map((mm) => mm.meal.name)
}

function formatToday(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

export interface AutoSendResult {
  ok: boolean
  sentAt?: string
  reason?: string
  msgId?: string
}

export async function runNow(): Promise<AutoSendResult> {
  const enabled = await isAutoSendEnabled()
  const groupId = await getGroupId()
  const template = await getTemplate()

  if (!enabled) return { ok: false, reason: 'autoSendDisabled' }
  if (!groupId) return { ok: false, reason: 'groupIdNotSet' }

  try {
    const menu = await getTodayMenu()
    const message = buildMessage(template, formatToday(), menu)
    const result = await bot.send(message, groupId)
    console.log(`[zalo-bot] Auto-send OK: msgId=${result.msgId}`)
    return { ok: true, sentAt: new Date().toISOString(), msgId: result.msgId }
  } catch (err) {
    const c = classifyZaloError(err)
    logError({ kind: c.kind, message: c.userMessage, raw: String(err) })
    return { ok: false, reason: c.kind }
  }
}

let task: ScheduledTask | null = null

export async function start() {
  if (task) return // already started
  const expr = await getCron()
  if (!cron.validate(expr)) {
    logError({ kind: 'fatal', message: `Invalid cron expr: ${expr}` })
    return
  }
  task = cron.schedule(expr, async () => {
    console.log('[zalo-bot] Cron tick fired')
    const result = await runNow()
    if (!result.ok) {
      console.warn(`[zalo-bot] Auto-send skipped: ${result.reason}`)
    }
  })
  console.log(`[zalo-bot] Cron started with expr: ${expr}`)
}

export function stop() {
  if (task) {
    task.stop()
    task = null
    console.log('[zalo-bot] Cron stopped')
  }
}

export async function restartWithNewCron() {
  stop()
  await start()
}
