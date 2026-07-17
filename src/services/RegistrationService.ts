import { prisma } from '@/lib/prisma'
import { RegistrationRepository } from '@/repositories/RegistrationRepository'
import { CreateRegistrationDTO, UpdateRegistrationDTO, RegistrationStatus } from '@/dto/RegistrationDTO'
import { isAllowedRegistrationDate, startOfLocalDay, parseLocalDate, toDateKey } from '@/lib/registrationWindow'
import { AuditLogService } from './AuditLogService'

export type RegistrationWithUser = {
  userId: string
  status: string
  id: string
  createdAt: Date
  updatedAt: Date
  date: Date
  note: string | null
  user: {
    id: string
    username: string
    name: string
    role: string
    isActive: boolean
    departmentId: string | null
    department?: {
      id: string
      name: string
    } | null
  } | null
}

export class RegistrationDateError extends Error {
  constructor(public readonly code: 'DATE_LOCKED' | 'DATE_OUTSIDE_WINDOW', message: string) {
    super(message)
    this.name = 'RegistrationDateError'
  }
}

export class RegistrationService {
  private registrationRepository: RegistrationRepository

  constructor() {
    this.registrationRepository = new RegistrationRepository(prisma)
  }

  private validateEditableDate(date: Date, now = new Date()) {
    const validation = isAllowedRegistrationDate(date, now)
    if (validation.ok) return

    if (validation.reason === 'LOCKED') {
      throw new RegistrationDateError('DATE_LOCKED', 'Ngày này đã khóa báo cơm')
    }

    throw new RegistrationDateError('DATE_OUTSIDE_WINDOW', 'Ngày này không nằm trong lịch báo cơm')
  }

  async findByDateRange(startDate: string, endDate: string): Promise<RegistrationWithUser[]> {
    const where: Record<string, unknown> = {
      date: { gte: parseLocalDate(startDate), lte: parseLocalDate(endDate) }
    }
    return this.registrationRepository.findAll(where) as Promise<RegistrationWithUser[]>
  }

  async findAll(userId?: string, startDate?: string, endDate?: string): Promise<RegistrationWithUser[]> {
    // SECURITY: userId is always required to prevent IDOR
    if (!userId) {
      return []
    }
    const where: Record<string, unknown> = { userId }
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) }
    }
    return this.registrationRepository.findAll(where) as Promise<RegistrationWithUser[]>
  }

  async findOne(id: string) {
    return this.registrationRepository.findOne(id)
  }

  async create(userId: string, data: CreateRegistrationDTO, now = new Date()) {
    if (!['eating', 'not_eating'].includes(data.status)) {
      throw new Error('Invalid status')
    }

    // Validate date format BEFORE business logic (BUG-014 fix)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD.')
    }

    const date = parseLocalDate(data.date)
    this.validateEditableDate(date, now)

    return this.registrationRepository.upsert(userId, date, data.status)
  }

  /**
   * Admin đặt/sửa trạng thái báo cơm của MỘT nhân viên cho MỘT ngày cụ thể.
   * Bỏ qua ràng buộc "ngày tương lai / đã khóa" (admin có toàn quyền), và ghi
   * log override + audit khi thay đổi để cuối tháng còn tra được ai sửa gì.
   */
  async adminSetStatus(employeeId: string, dateStr: string, status: string, adminId: string, note?: string) {
    if (!['eating', 'not_eating'].includes(status)) {
      throw new Error('Invalid status')
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD.')
    }
    const date = parseLocalDate(dateStr)
    const existing = await this.registrationRepository.findByUserAndDate(employeeId, date)
    const result = await this.registrationRepository.upsert(employeeId, date, status)

    if (!existing || existing.status !== status) {
      await this.registrationRepository.createOverride({
        registrationId: result.id,
        performedBy: adminId,
        newStatus: status,
        note: note ?? 'Admin điều chỉnh',
        originalStatus: existing?.status ?? undefined,
      })
      const auditService = new AuditLogService()
      await auditService.log({
        action: 'REGISTRATION_OVERRIDE',
        entityType: 'registration',
        entityId: result.id,
        performedBy: adminId,
        details: `Admin đặt ${dateStr} = ${status} (trước: ${existing?.status ?? 'chưa có'}).${note ? ' Ghi chú: ' + note : ''}`,
      })
    }
    return result
  }

  async update(id: string, userId: string, role: string, data: UpdateRegistrationDTO, overrideNote?: string) {
    const registration = await this.registrationRepository.findOne(id)
    if (!registration) {
      throw new Error('Registration not found')
    }
    if (role !== 'admin' && registration.userId !== userId) {
      throw new Error('Forbidden')
    }

    const wasLocked = (() => {
      try {
        this.validateEditableDate(registration.date)
        return false
      } catch {
        return true
      }
    })()

    if (role !== 'admin') {
      this.validateEditableDate(registration.date)
    }

    const updateData: Record<string, unknown> = {}
    if (data.status && ['eating', 'not_eating'].includes(data.status)) {
      updateData.status = data.status
    }
    if (data.note !== undefined) {
      updateData.note = data.note
    }

    const result = await this.registrationRepository.update(id, updateData)

    // Record admin override when changing a locked date
    if (role === 'admin' && wasLocked && overrideNote && data.status) {
      await this.registrationRepository.createOverride({
        registrationId: id,
        performedBy: userId,
        newStatus: data.status,
        note: overrideNote,
        originalStatus: registration.status,
      })

      // Audit log for admin override
      const auditService = new AuditLogService()
      await auditService.log({
        action: 'REGISTRATION_OVERRIDE',
        entityType: 'registration',
        entityId: id,
        performedBy: userId,
        details: `Status changed from ${registration.status} to ${data.status}. Note: ${overrideNote}`
      })
    }

    return result
  }

  async delete(id: string) {
    return this.registrationRepository.delete(id)
  }

  async countByDateRange(start: Date, end: Date, status?: RegistrationStatus) {
    const where: Record<string, unknown> = { date: { gte: start, lte: end } }
    if (status) where.status = status
    return this.registrationRepository.count(where)
  }

  /**
   * Trạng thái báo cơm HIỆU LỰC (carry-forward) của tất cả nhân viên active
   * cho một ngày cụ thể.
   *
   * Quy tắc nghiệp vụ:
   * - Trạng thái báo cơm gần nhất của mỗi người (bản ghi có date <= ngày đó)
   *   được GIỮ NGUYÊN cho các ngày tiếp theo cho tới khi họ báo lại.
   *   VD: T2 báo "không ăn" → T3, T4... vẫn "không ăn" cho tới khi báo "có ăn".
   * - Người CHƯA từng có bản ghi nào → mặc định "không ăn".
   *
   * Đây là nguồn chân lý duy nhất cho: tin nhắn Zalo, thống kê dashboard, và UI.
   */
  async getEffectiveStatusesForDate(date: Date): Promise<Array<{
    userId: string
    username: string
    name: string
    department: string | null
    status: 'eating' | 'not_eating'
  }>> {
    const dayStart = startOfLocalDay(date)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const [employees, regs] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true, role: 'employee' },
        select: { id: true, username: true, name: true, workEndDate: true, department: { select: { name: true } } },
        orderBy: { name: 'asc' },
      }),
      // Tất cả bản ghi tới hết ngày mục tiêu, mới nhất trước → lấy record đầu tiên/user
      prisma.registration.findMany({
        where: { date: { lt: dayEnd }, user: { isActive: true, role: 'employee' } },
        select: { userId: true, status: true },
        orderBy: { date: 'desc' },
      }),
    ])

    const latest = new Map<string, string>()
    for (const r of regs) {
      if (!latest.has(r.userId)) latest.set(r.userId, r.status)
    }

    return employees
      // Nhân viên đã nghỉ việc (qua ngày làm cuối) → không còn suất từ hôm sau
      .filter((e) => !e.workEndDate || dayStart <= startOfLocalDay(e.workEndDate))
      .map((e) => ({
        userId: e.id,
        username: e.username,
        name: e.name,
        department: e.department?.name ?? null,
        // Mặc định KHÔNG ĂN khi chưa từng có bản ghi; nếu có thì giữ bản ghi gần nhất
        status: latest.get(e.id) === 'eating' ? 'eating' : 'not_eating',
      }))
  }

  /**
   * Báo cáo tổng hợp theo khoảng ngày dùng CARRY-FORWARD.
   *
   * Với mỗi NGÀY LÀM VIỆC (T2–T6) trong [startDate, endDate], tính trạng thái
   * hiệu lực của từng nhân viên (bản ghi gần nhất <= ngày đó, mặc định "không ăn"),
   * rồi cộng dồn số ngày "có ăn" / "không ăn" cho mỗi người.
   *
   * Trả về TẤT CẢ nhân viên active (kể cả người chưa từng báo → toàn "không ăn"),
   * sắp xếp theo PHÒNG BAN rồi tới tên. Đây là nguồn chân lý chung cho cả
   * preview trên màn hình lẫn file Excel/CSV → số liệu luôn khớp nhau.
   */
  async getReportByDateRange(startDate: string, endDate: string) {
    const start = startOfLocalDay(parseLocalDate(startDate))
    const end = startOfLocalDay(parseLocalDate(endDate))
    const endExclusive = new Date(end)
    endExclusive.setDate(endExclusive.getDate() + 1)

    const [employees, regs, holidays] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true, role: 'employee' },
        select: {
          id: true, username: true, name: true, workEndDate: true,
          department: { select: { name: true } },
        },
      }),
      prisma.registration.findMany({
        where: { date: { lt: endExclusive }, user: { isActive: true, role: 'employee' } },
        select: { userId: true, date: true, status: true },
        orderBy: { date: 'asc' },
      }),
      prisma.holiday.findMany({
        where: { isActive: true, date: { gte: start, lt: endExclusive } },
        select: { date: true, description: true },
      }),
    ])

    // Ngày lễ (bếp không nấu) → bỏ qua khi tính báo cáo, chỉ giữ ngày làm việc T2–T6
    const holidayKeys = new Set(holidays.map((h) => toDateKey(h.date)))
    const holidayList = holidays
      .filter((h) => { const dow = h.date.getDay(); return dow !== 0 && dow !== 6 })
      .map((h) => ({ dateKey: toDateKey(h.date), description: h.description || '' }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))

    // Ngày làm cuối của từng nhân viên (nghỉ việc) → không tính cơm sau ngày này
    const endDateByUser = new Map<string, Date>()
    for (const e of employees) {
      if (e.workEndDate) endDateByUser.set(e.id, startOfLocalDay(e.workEndDate))
    }

    // Gom bản ghi theo user (đã sắp tăng dần theo ngày)
    const byUser = new Map<string, Array<{ date: Date; status: string }>>()
    for (const r of regs) {
      const list = byUser.get(r.userId) ?? []
      list.push({ date: r.date, status: r.status })
      byUser.set(r.userId, list)
    }

    const tally = new Map<string, { eating: number; notEating: number }>()
    for (const e of employees) tally.set(e.id, { eating: 0, notEating: 0 })

    let workdays = 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay()
      if (dow === 0 || dow === 6) continue // chỉ tính T2–T6 (không phục vụ cuối tuần)
      if (holidayKeys.has(toDateKey(d))) continue // bỏ ngày lễ
      workdays++
      for (const e of employees) {
        // Đã nghỉ việc: không tính cơm cho ngày sau ngày làm cuối
        const endD = endDateByUser.get(e.id)
        if (endD && d > endD) continue
        const list = byUser.get(e.id)
        let status = 'not_eating' // mặc định không ăn
        if (list) {
          for (let i = list.length - 1; i >= 0; i--) {
            if (list[i].date <= d) { status = list[i].status; break }
          }
        }
        const t = tally.get(e.id)!
        if (status === 'eating') t.eating++
        else t.notEating++
      }
    }

    const rows = employees
      // Bỏ nhân viên đã nghỉ TRƯỚC kỳ báo cáo (không có ngày làm nào trong kỳ)
      .filter((e) => { const endD = endDateByUser.get(e.id); return !endD || endD >= start })
      .map((e) => ({
        name: e.name,
        username: e.username,
        department: e.department?.name ?? '',
        eating: tally.get(e.id)!.eating,
        notEating: tally.get(e.id)!.notEating,
      }))
      .sort((a, b) =>
        (a.department || 'zzz').localeCompare(b.department || 'zzz', 'vi') ||
        a.name.localeCompare(b.name, 'vi')
      )
      .map((r, idx) => ({ stt: idx + 1, ...r }))

    const totals = rows.reduce(
      (acc, r) => ({ eating: acc.eating + r.eating, notEating: acc.notEating + r.notEating }),
      { eating: 0, notEating: 0 }
    )

    return { rows, totals, workdays, holidays: holidayList }
  }

  async countByStatus(date: Date) {
    const effective = await this.getEffectiveStatusesForDate(date)
    const eating = effective.filter((e) => e.status === 'eating').length
    const notEating = effective.filter((e) => e.status === 'not_eating').length
    // Với carry-forward, mọi nhân viên active đều có trạng thái hiệu lực
    return { eating, notEating, total: effective.length }
  }

  async findAllByUser(userId: string, startDate?: string, endDate?: string) {
    const registrations = await this.registrationRepository.findAllByUserWithOverrides(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    // Stats
    const stats = {
      total: registrations.length,
      eating: registrations.filter(r => r.status === 'eating').length,
      notEating: registrations.filter(r => r.status === 'not_eating').length
    }

    return { registrations, stats }
  }

  async getAbsencesByDate(date: Date) {
    // Carry-forward: người vắng = người có trạng thái hiệu lực 'not_eating'
    const effective = await this.getEffectiveStatusesForDate(date)
    return effective
      .filter((e) => e.status === 'not_eating')
      .map((e) => ({
        user: { name: e.name, username: e.username },
      }))
  }

  async ensureDefaultRegistrations(date: Date): Promise<void> {
    const dayStart = startOfLocalDay(date)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    // Get all registrations for that date
    const existingRegs = await this.registrationRepository.findAll({
      date: { gte: dayStart, lt: dayEnd }
    }) as RegistrationWithUser[]

    // Get all active employees
    const { UserService } = await import('@/services/UserService')
    const userService = new UserService()
    const allEmployees = await userService.findAll()
    const registeredUserIds = new Set(existingRegs.map(r => r.userId))

    // Create default "eating" registration for any missing employee
    for (const emp of allEmployees) {
      if (!registeredUserIds.has(emp.id)) {
        await this.registrationRepository.upsert(emp.id, dayStart, 'eating')
      }
    }
  }
}
