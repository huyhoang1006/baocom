export type RegistrationDateRejectionReason =
  | 'DATE_NOT_FUTURE'
  | 'WEEKEND'
  | 'OUTSIDE_CURRENT_WEEK'
  | 'LOCKED'

export type RegistrationDateValidation =
  | { ok: true }
  | { ok: false; reason: RegistrationDateRejectionReason }

export interface RegistrationDayState {
  date: Date
  dateKey: string
  dayName: string
  cutoffAt: Date
  locked: boolean
  isWorkday: boolean  // true cho T2-T6, false cho T7, CN
}

const WEEKDAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// Asia/Ho_Chi_Minh is UTC+7 with no DST — fixed offset
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000

export const MAX_BOOKING_WEEK_OFFSET = 4

/**
 * Parse a YYYY-MM-DD string as a local date in Asia/Ho_Chi_Minh timezone,
 * returning a Date at local midnight (TZ-adjusted).
 */
export function parseLocalDate(dateStr: string): Date {
  const dateOnly = dateStr.split('T')[0]
  const [year, month, day] = dateOnly.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - VIETNAM_OFFSET_MS)
}

/**
 * Format a Date as YYYY-MM-DD in Asia/Ho_Chi_Minh timezone.
 * Use this instead of toISOString().split('T')[0] which shifts by UTC offset.
 */
export function toDateKey(date: Date): string {
  const vietnamDate = new Date(date.getTime() + VIETNAM_OFFSET_MS)
  const year = vietnamDate.getUTCFullYear()
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(vietnamDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfLocalDay(date: Date): Date {
  const local = date.getTime() + VIETNAM_OFFSET_MS
  return new Date(Math.floor(local / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000) - VIETNAM_OFFSET_MS)
}

export interface CutoffTimeConfig {
  hour: number
  minute: number
}

export function getCutoffAt(targetDate: Date, config?: CutoffTimeConfig): Date {
  const cutoffAt = startOfLocalDay(targetDate)
  cutoffAt.setDate(cutoffAt.getDate() - 1)
  cutoffAt.setHours(config?.hour ?? 23, config?.minute ?? 0, 0, 0)
  return cutoffAt
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isSameCurrentWeek(targetDate: Date, now: Date): boolean {
  const target = startOfLocalDay(targetDate)
  const today = startOfLocalDay(now)
  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(monday.getDate() + diffToMonday)

  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)

  return target >= monday && target < nextMonday
}

export function getWeekStart(now = new Date(), weekOffset = 0): Date {
  const today = startOfLocalDay(now)
  const monday = new Date(today)
  const dayOfWeek = monday.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(monday.getDate() + diffToMonday + weekOffset * 7)
  return monday
}

export function getWeekdaysForOffset(
  now = new Date(),
  weekOffset = 0,
  config?: CutoffTimeConfig
): RegistrationDayState[] {
  const monday = getWeekStart(now, weekOffset)

  // Chỉ trả về 5 ngày T2-T6 (offset 0-4), không có T7 và CN
  return [0, 1, 2, 3, 4].map((offset) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + offset)
    return getRegistrationDayState(date, now, config)
  })
}

export function getCurrentWeekWeekdays(now = new Date()): RegistrationDayState[] {
  return getWeekdaysForOffset(now, 0)
}

function isWithinBookingWindow(targetDate: Date, now: Date): boolean {
  const target = startOfLocalDay(targetDate)
  const currentWeekStart = getWeekStart(now, 0)
  const maxWeekStart = getWeekStart(now, MAX_BOOKING_WEEK_OFFSET)
  const maxWindowEnd = new Date(maxWeekStart)
  maxWindowEnd.setDate(maxWeekStart.getDate() + 7)

  return target >= currentWeekStart && target < maxWindowEnd
}

export function isAllowedRegistrationDate(
  targetDate: Date,
  now = new Date(),
  config?: CutoffTimeConfig
): RegistrationDateValidation {
  const target = startOfLocalDay(targetDate)
  const today = startOfLocalDay(now)

  if (target <= today) return { ok: false, reason: 'DATE_NOT_FUTURE' }
  if (isWeekend(target)) return { ok: false, reason: 'WEEKEND' }
  if (!isWithinBookingWindow(target, now)) return { ok: false, reason: 'OUTSIDE_CURRENT_WEEK' }
  // Dùng giờ chốt cấu hình (nếu có); không truyền config → mặc định 23:00.
  if (now >= getCutoffAt(target, config)) return { ok: false, reason: 'LOCKED' }

  return { ok: true }
}

export function getRegistrationDayState(
  targetDate: Date,
  now = new Date(),
  config?: CutoffTimeConfig
): RegistrationDayState {
  const date = startOfLocalDay(targetDate)
  const cutoffAt = getCutoffAt(date, config)
  const dayOfWeek = date.getDay()
  const isWorkday = dayOfWeek !== 0 && dayOfWeek !== 6  // true cho T2-T6, false cho T7(6) và CN(0)

  return {
    date,
    dateKey: toDateKey(date),
    dayName: WEEKDAY_NAMES[date.getDay()],
    cutoffAt,
    locked: now >= cutoffAt,
    isWorkday,
  }
}

export function getCurrentWeekFutureWeekdays(now = new Date()): RegistrationDayState[] {
  const today = startOfLocalDay(now)
  const result: RegistrationDayState[] = []

  for (let offset = 1; offset <= 6; offset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)

    if (!isSameCurrentWeek(date, now)) break
    if (isWeekend(date)) continue

    result.push(getRegistrationDayState(date, now))
  }

  return result
}

/**
 * Returns the next date (from today) that is locked due to cutoff having passed.
 * Returns null if no such date found within booking window.
 */
export function getNextLockedDay(now: Date): RegistrationDayState | null {
  const weekdays = getCurrentWeekFutureWeekdays(now)
  return weekdays.find(day => day.locked) ?? null
}

/**
 * Returns the next workday (T2-T6) starting from tomorrow, skipping weekends and holidays.
 */
export function getNextWorkday(fromDate: Date, holidays: Date[] = []): Date {
  const current = startOfLocalDay(fromDate)
  current.setDate(current.getDate() + 1) // start from tomorrow

  // Keep advancing until we find T2-T6 that's not a holiday
  for (let i = 0; i < 20; i++) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend — skip
      current.setDate(current.getDate() + 1)
      continue
    }
    // Check if it's a holiday
    const currentKey = toDateKey(current)
    const isHoliday = holidays.some(h => toDateKey(h) === currentKey)
    if (!isHoliday) {
      return current
    }
    current.setDate(current.getDate() + 1)
  }

  return current // fallback
}
