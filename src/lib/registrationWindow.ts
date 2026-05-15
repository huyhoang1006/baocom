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
}

const WEEKDAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getCutoffAt(targetDate: Date): Date {
  const cutoffAt = startOfLocalDay(targetDate)
  cutoffAt.setDate(cutoffAt.getDate() - 1)
  cutoffAt.setHours(23, 0, 0, 0)
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

export function isAllowedRegistrationDate(targetDate: Date, now = new Date()): RegistrationDateValidation {
  const target = startOfLocalDay(targetDate)
  const today = startOfLocalDay(now)

  if (target <= today) return { ok: false, reason: 'DATE_NOT_FUTURE' }
  if (isWeekend(target)) return { ok: false, reason: 'WEEKEND' }
  if (!isSameCurrentWeek(target, now)) return { ok: false, reason: 'OUTSIDE_CURRENT_WEEK' }
  if (now >= getCutoffAt(target)) return { ok: false, reason: 'LOCKED' }

  return { ok: true }
}

export function getRegistrationDayState(targetDate: Date, now = new Date()): RegistrationDayState {
  const date = startOfLocalDay(targetDate)
  const cutoffAt = getCutoffAt(date)

  return {
    date,
    dateKey: toDateKey(date),
    dayName: WEEKDAY_NAMES[date.getDay()],
    cutoffAt,
    locked: now >= cutoffAt,
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
