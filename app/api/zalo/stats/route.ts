import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/authMiddleware'
import { readRecent } from '@/lib/zalo/send-log'
import { getCron, isAutoSendEnabled } from '@/lib/zalo/config'

/** Helper: tính lần fire tiếp theo cho cron expression cơ bản (chỉ hỗ trợ pattern
 *  `m h * * dow` và `m h * * *`). Trả null nếu cron phức tạp hơn.
 *  Logic lặp tối đa 8 ngày để tìm match kế tiếp. */
function computeNextFire(cron: string, from = new Date()): string | null {
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5) return null
  const [minuteStr, hourStr, , , dowStr] = parts
  const minute = parseInt(minuteStr, 10)
  const hour = parseInt(hourStr, 10)
  if (Number.isNaN(minute) || Number.isNaN(hour)) return null

  const allowedDow = new Set<number>()
  const dow = dowStr ?? '*'
  if (dow === '*') {
    // mọi ngày
  } else if (dow.includes('-')) {
    const [lo, hi] = dow.split('-').map((n) => parseInt(n, 10))
    if (Number.isNaN(lo) || Number.isNaN(hi)) return null
    for (let d = lo; d <= hi; d++) allowedDow.add(d)
  } else if (dow.includes(',')) {
    for (const p of dow.split(',')) {
      const n = parseInt(p, 10)
      if (!Number.isNaN(n)) allowedDow.add(n)
    }
  } else {
    const n = parseInt(dow, 10)
    if (!Number.isNaN(n)) allowedDow.add(n)
  }

  // Tìm trong 8 ngày tới
  for (let i = 0; i <= 8; i++) {
    const candidate = new Date(from)
    candidate.setDate(candidate.getDate() + i)
    candidate.setHours(hour, minute, 0, 0)
    // Nếu là hôm nay nhưng giờ đã qua → skip
    if (candidate.getTime() <= from.getTime()) continue
    if (allowedDow.size > 0 && !allowedDow.has(candidate.getDay())) continue
    return candidate.toISOString()
  }
  return null
}

export const GET = withAdmin(async () => {
  // Đọc tối đa 1000 entries gần nhất để tính stats
  const entries = readRecent(1000)

  const totalSent = entries.length
  const success = entries.filter((e) => e.status === 'success').length
  const failed = entries.filter((e) => e.status === 'fail').length

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentErrors = entries.filter(
    (e) => e.status === 'fail' && new Date(e.timestamp).getTime() > sevenDaysAgo
  ).length

  const enabled = await isAutoSendEnabled()
  let nextFireAt: string | null = null
  if (enabled) {
    const cron = await getCron()
    nextFireAt = computeNextFire(cron)
  }

  return NextResponse.json({
    totalSent,
    success,
    failed,
    recentErrors,
    nextFireAt,
  })
})