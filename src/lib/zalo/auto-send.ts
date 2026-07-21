import cron, { type ScheduledTask } from 'node-cron'
import { appendFileSync, mkdirSync, existsSync } from 'fs'
import { prisma } from '@/lib/prisma'
import { bot } from './bot'
import { getCron, isAutoSendEnabled, getTemplate, getGroupId, getSendMode, getManualDate } from './config'
import { classifyZaloError } from './errors'
import { appendSend } from './send-log'
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

export interface MessageParts {
  /** dd/mm/yyyy */
  date: string
  /** raw meal names; empty array renders as "(Chưa có món)" */
  menu: string[]
  /** pre-formatted multi-line text; empty string renders as "(Chưa có ai đăng ký)" */
  registrations: string
  /** total eating portions */
  total: number
}

/**
 * Pure: render template với các placeholder `{date}` `{menu}` `{registrations}` `{total}`.
 * Single source of truth cho cả auto-send (`runNow`) và preview UI.
 */
export function buildMessage(template: string, parts: MessageParts): string {
  const menuText = parts.menu.length > 0 ? parts.menu.map((m) => `- ${m}`).join('\n') : '(Chưa có món)'
  const regText = parts.registrations.length > 0 ? parts.registrations : '(Chưa có ai đăng ký)'
  return template
    .replace('{date}', parts.date)
    .replace('{menu}', menuText)
    .replace('{registrations}', regText)
    .replace('{total}', String(parts.total))
}

/**
 * Lấy danh sách người ăn theo nhóm phòng ban, hiển thị họ tên
 * Format: "- Phòng ban: Tên người 1, Tên người 2"
 * Kèm tổng số suất ăn.
 *
 * LƯU Ý QUAN TRỌNG — carry-forward:
 * Trạng thái báo cơm gần nhất được GIỮ NGUYÊN cho các ngày sau tới khi báo lại
 * (T2 báo "có ăn" → T3, T4... vẫn "có ăn" cho tới khi báo "không ăn").
 * Người CHƯA từng có bản ghi nào → mặc định KHÔNG ĂN.
 * Vì vậy danh sách người ăn = nhân viên active có trạng thái HIỆU LỰC 'eating'
 * (đã tick "có ăn" gần nhất và chưa hủy) — không lọc theo status='eating' riêng
 * ngày đó (sẽ bỏ sót người đã tick từ tuần trước rồi để nguyên).
 *
 * Nguồn chân lý: RegistrationService.getEffectiveStatusesForDate.
 */
export async function getRegistrationsByDepartment(date: Date): Promise<{ registrations: string; total: number }> {
  const { RegistrationService } = await import('@/services/RegistrationService')
  const effective = await new RegistrationService().getEffectiveStatusesForDate(date)

  // Nhóm theo phòng ban — chỉ những người có trạng thái hiệu lực 'eating'
  const grouped = new Map<string, string[]>()
  for (const emp of effective) {
    if (emp.status !== 'eating') continue
    const deptName = emp.department ?? 'Khác'
    if (!grouped.has(deptName)) grouped.set(deptName, [])
    grouped.get(deptName)!.push(emp.name)
  }

  let total = 0
  const lines: string[] = []
  for (const [dept, names] of grouped) {
    lines.push(`- ${dept}: ${names.join(', ')}`)
    total += names.length
  }

  const registrations = lines.length > 0 ? lines.join('\n') : '(Chưa có ai đăng ký)'
  return { registrations, total }
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

export async function getTodayMenu(): Promise<string[]> {
  return getMenuForDate(new Date())
}

/**
 * Lấy menu (DailyMenu) của một ngày cụ thể.
 * Trả về danh sách tên món ăn (sortOrder asc), [] nếu chưa có menu.
 */
export async function getMenuForDate(date: Date): Promise<string[]> {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  const menu = await prisma.dailyMenu.findFirst({
    where: { date: { gte: dayStart, lt: dayEnd } },
    include: { meals: { include: { meal: true }, orderBy: { sortOrder: 'asc' } } },
  })
  if (!menu) return []
  return menu.meals.map((mm) => mm.meal.name)
}

/** T2-T6 là workday. CN=0, T7=6 → return false */
export function isWorkday(d: Date): boolean {
  const day = d.getDay()
  return day !== 0 && day !== 6
}

/**
 * Trả về workday kế tiếp SAU `from` (bỏ T7/CN).
 * Nếu `from` là T6 → trả T2 tuần sau.
 * Nếu `from` là T7 → trả T2 tuần sau (cộng 1-2 ngày).
 * Nếu `from` là CN → trả T2.
 * Nếu `from` là T2-T5 → trả ngày hôm sau.
 */
export function nextWorkday(from: Date): Date {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  do {
    d.setDate(d.getDate() + 1)
  } while (d.getDay() === 0 || d.getDay() === 6)
  return d
}

/** Format Date → dd/mm/yyyy (zero-padded) */
export function formatDateKey(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${date.getFullYear()}`
}

/** Tên tiếng Việt của thứ trong tuần: CN, T2..T7 */
export function dayNameVi(date: Date): string {
  const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  return names[date.getDay()]
}

/** yyyy-mm-dd theo giờ máy chủ (khớp với nextWorkday dùng setHours cục bộ) */
function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Tập dateKey các ngày lễ đang hiệu lực từ `from` trở đi (bếp không nấu) */
async function getUpcomingHolidayKeys(from: Date): Promise<Set<string>> {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const holidays = await prisma.holiday.findMany({
    where: { isActive: true, date: { gte: start } },
    select: { date: true },
  })
  return new Set(holidays.map((h) => localDateKey(h.date)))
}

/**
 * Chọn ngày mục tiêu cho tin nhắn auto-send dựa trên SendMode.
 *
 * - `auto` (mặc định): workday kế tiếp sau now (vd T2 sáng → T3)
 * - `today`: now nếu workday, nếu T7/CN → workday kế tiếp (vd T7 → T2)
 * - `manual`: manualDate trong DB; nếu null → fallback `auto`
 *
 * NGÀY LỄ: với auto/today, nếu ngày chọn trùng ngày lễ (bếp không nấu) thì tự
 * nhảy tới ngày làm việc kế tiếp không phải lễ. Manual do admin chọn → tôn trọng.
 * Lưu ý: T7/CN vẫn có thể là manualDate (admin chọn), UI sẽ cảnh báo.
 */
export async function pickTargetDate(now: Date = new Date()): Promise<Date> {
  const mode = await getSendMode()
  if (mode === 'manual') {
    const manual = await getManualDate()
    if (manual) return manual
  }

  let target: Date
  if (mode === 'today') {
    target = isWorkday(now) ? now : nextWorkday(now)
  } else {
    // mode === 'auto' (default): luôn workday kế tiếp sau now
    target = nextWorkday(now)
  }

  // Né ngày lễ (chỉ query khi thực sự cần)
  const holidayKeys = await getUpcomingHolidayKeys(now)
  if (holidayKeys.size > 0) {
    while (holidayKeys.has(localDateKey(target))) {
      target = nextWorkday(target)
    }
  }
  return target
}

/**
 * Render preview message từ DB (template + menu + registrations của target date).
 * Dùng chung với `runNow` → đảm bảo preview == message thật sẽ gửi.
 */
export async function renderPreview(): Promise<string> {
  const template = await getTemplate()
  const target = await pickTargetDate()
  const [menu, regResult] = await Promise.all([
    getMenuForDate(target),
    getRegistrationsByDepartment(target),
  ])
  return buildMessage(template, {
    date: formatDateKey(target),
    menu,
    registrations: regResult.registrations,
    total: regResult.total,
  })
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

  if (!enabled) return { ok: false, reason: 'autoSendDisabled' }
  if (!groupId) return { ok: false, reason: 'groupIdNotSet' }

  try {
    const message = await renderPreview()

    const result = await bot.send(message, groupId)
    console.log(`[zalo-bot] Auto-send OK: msgId=${result.msgId}`)
    appendSend({
      timestamp: new Date().toISOString(),
      kind: 'auto',
      status: 'success',
      threadId: groupId,
      preview: message.slice(0, 100),
    })
    return { ok: true, sentAt: new Date().toISOString(), msgId: result.msgId }
  } catch (err) {
    const c = classifyZaloError(err)
    logError({ kind: c.kind, message: c.userMessage, raw: String(err) })
    appendSend({
      timestamp: new Date().toISOString(),
      kind: 'auto',
      status: 'fail',
      threadId: groupId,
      preview: '',
      error: c.userMessage,
    })
    return { ok: false, reason: c.kind }
  }
}

// globalThis để sống sót qua HMR reload (dev mode)
// Khi module bị reload bởi Next.js, biến `task` reset = null
// nhưng globalThis.__zaloAutoSendTask vẫn giữ reference tới cron cũ
// → start() phát hiện và skip, không tạo cron trùng lặp
const g = globalThis as typeof globalThis & { __zaloAutoSendTask?: ScheduledTask | null }

let task: ScheduledTask | null = g.__zaloAutoSendTask ?? null

export async function start() {
  // Kiểm tra cả 2 nơi: module-level task VÀ globalThis
  if (task || g.__zaloAutoSendTask) return // already started

  // Kiểm tra enabled trước khi schedule
  const enabled = await isAutoSendEnabled()
  if (!enabled) {
    console.log('[zalo-bot] Auto-send disabled, skipping start')
    return
  }

  const expr = await getCron()
  if (!cron.validate(expr)) {
    logError({ kind: 'fatal', message: `Invalid cron expr: ${expr}` })
    return
  }

  // Kiểm tra groupId trước khi schedule
  const groupId = await getGroupId()
  if (!groupId) {
    console.log('[zalo-bot] No groupId configured, skipping start')
    return
  }

  task = cron.schedule(expr, async () => {
    console.log('[zalo-bot] Cron tick fired')
    // Mỗi tick đọc lại enabled từ DB (không cache)
    const stillEnabled = await isAutoSendEnabled()
    if (!stillEnabled) {
      console.log('[zalo-bot] Auto-send disabled mid-run, skipping')
      return
    }
    const result = await runNow()
    if (!result.ok) {
      console.warn(`[zalo-bot] Auto-send skipped: ${result.reason}`)
    }
  })
  // Lưu vào globalThis để sống sót qua HMR reload
  g.__zaloAutoSendTask = task
  // Start keepAlive heartbeat để refresh session Zalo tự động
  bot.startKeepAlive()
  console.log(`[zalo-bot] Cron started with expr: ${expr}`)
}

export function stop() {
  // Dừng cron từ cả 2 nguồn: module-level VÀ globalThis
  const existing = task ?? g.__zaloAutoSendTask
  if (existing) {
    existing.stop()
    task = null
    g.__zaloAutoSendTask = null
    bot.stopKeepAlive()
    console.log('[zalo-bot] Cron stopped')
  }
}

export async function restartWithNewCron() {
  stop()
  await start()
}
