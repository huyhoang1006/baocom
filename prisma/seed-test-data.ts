import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function getDatesBetween(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  while (current <= end) {
    // Skip Sundays (day 0)
    if (current.getDay() !== 0) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

async function main() {
  console.log('🗑️  Clearing existing data...')
  await prisma.registrationOverride.deleteMany()
  await prisma.registration.deleteMany()
  await prisma.dailyMenuMeal.deleteMany()
  await prisma.dailyMenu.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.user.deleteMany({ where: { role: 'employee' } })

  console.log('👤 Creating users...')

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminPassword, name: 'Quản trị viên', role: 'admin' }
  })

  // Create employees
  const employeePassword = await bcrypt.hash('employee123', 12)
  const employeeNames = [
    { username: 'hungpx', name: 'Phạm Xuân Hùng' },
    { username: 'nguyenvana', name: 'Nguyễn Văn A' },
    { username: 'tranthib', name: 'Trần Thị B' },
    { username: 'levanc', name: 'Lê Văn C' },
    { username: 'phamthid', name: 'Phạm Thị D' },
    { username: 'hoangvane', name: 'Hoàng Văn E' },
    { username: 'tranvietf', name: 'Trần Việt F' },
    { username: 'lehuongg', name: 'Lê Hương G' },
    { username: 'ngothih', name: 'Ngô Thị H' },
    { username: 'vothanhk', name: 'Võ Thanh K' },
  ]

  const employees: { id: string; username: string; name: string }[] = []
  for (const emp of employeeNames) {
    const created = await prisma.user.upsert({
      where: { username: emp.username },
      update: {},
      create: { username: emp.username, password: employeePassword, name: emp.name, role: 'employee' }
    })
    employees.push(created)
  }
  console.log(`   Created ${employees.length} employees`)

  // Create meals
  console.log('🍽️  Creating meals...')
  const meals = [
    { name: 'Thịt kho tàu', type: 'main' },
    { name: 'Chả lá lốt', type: 'main' },
    { name: 'Cá kho tộ', type: 'main' },
    { name: 'Gà nướng đất sét', type: 'main' },
    { name: 'Bún chả Hà Nội', type: 'main' },
    { name: 'Thịt bò xào', type: 'main' },
    { name: 'Cá alaska', type: 'main' },
    { name: 'Cải xào tỏi', type: 'vegetable' },
    { name: 'Su su luộc', type: 'vegetable' },
    { name: 'Đỗ quả xào', type: 'vegetable' },
    { name: 'Rau muống luộc', type: 'vegetable' },
    { name: 'Đậu phụ nhồi thịt', type: 'vegetable' },
    { name: 'Cà rốt xào', type: 'vegetable' },
    { name: 'Bông cải hấp', type: 'vegetable' },
    { name: 'Chuối', type: 'dessert' },
    { name: 'Dưa hấu', type: 'dessert' },
    { name: 'Nước ép cam', type: 'dessert' },
    { name: 'Chè đậu đỏ', type: 'dessert' },
  ]

  const createdMeals: { id: string; type: string }[] = []
  for (const meal of meals) {
    const created = await prisma.meal.create({ data: meal })
    createdMeals.push(created)
  }
  console.log(`   Created ${createdMeals.length} meals`)

  // Create holidays
  console.log('📅 Creating holidays...')
  const holidays = [
    { date: new Date('2026-01-01'), description: 'Tết Dương lịch' },
    { date: new Date('2026-04-30'), description: 'Ngày Giải phóng miền Nam' },
    { date: new Date('2026-05-01'), description: 'Ngày Quốc tế Lao động' },
    { date: new Date('2026-09-02'), description: 'Ngày Quốc khánh' },
    { date: new Date('2026-04-14'), description: 'Tết Nguyên đán 2026' },
    { date: new Date('2026-04-15'), description: 'Tết Nguyên đán 2026' },
    { date: new Date('2026-04-16'), description: 'Tết Nguyên đán 2026' },
    { date: new Date('2026-04-17'), description: 'Tết Nguyên đán 2026' },
    { date: new Date('2026-04-18'), description: 'Tết Nguyên đán 2026' },
    { date: new Date('2026-05-23'), description: 'Ngày sinh nhật công ty' },
  ]

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: { date: holiday.date },
      update: {},
      create: holiday
    })
  }
  console.log(`   Created ${holidays.length} holidays`)

  // Calculate date ranges
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pastStart = new Date(today)
  pastStart.setDate(today.getDate() - 60) // 60 days back

  const futureEnd = new Date(today)
  futureEnd.setDate(today.getDate() + 30) // 30 days forward

  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)

  // Get holiday dates for skipping
  const holidayDates = new Set(
    holidays.map(h => h.date.toISOString().split('T')[0])
  )

  // Create daily menus and registrations
  console.log('📊 Creating daily menus and registrations...')

  const allDates = getDatesBetween(pastStart, futureEnd)
  let menusCreated = 0
  let registrationsCreated = 0
  let overridesCreated = 0

  for (const date of allDates) {
    const dateStr = date.toISOString().split('T')[0]

    // Skip holidays
    if (holidayDates.has(dateStr)) {
      continue
    }

    // Create daily menu
    const dailyMenu = await prisma.dailyMenu.create({
      data: { date }
    })
    menusCreated++

    // Add meals to menu
    const mainMeals = createdMeals.filter(m => m.type === 'main')
    const vegMeals = createdMeals.filter(m => m.type === 'vegetable')
    const dessertMeals = createdMeals.filter(m => m.type === 'dessert')

    const dayOfWeek = date.getDay()
    const mealIndex = Math.floor(Math.abs(date.getTime()) / 86400000) % mainMeals.length

    await prisma.dailyMenuMeal.createMany({
      data: [
        { dailyMenuId: dailyMenu.id, mealId: mainMeals[mealIndex % mainMeals.length].id, sortOrder: 0 },
        { dailyMenuId: dailyMenu.id, mealId: vegMeals[mealIndex % vegMeals.length].id, sortOrder: 1 },
        { dailyMenuId: dailyMenu.id, mealId: vegMeals[(mealIndex + 2) % vegMeals.length].id, sortOrder: 2 },
        { dailyMenuId: dailyMenu.id, mealId: dessertMeals[mealIndex % dessertMeals.length].id, sortOrder: 3 },
      ]
    })

    // Create registrations for each employee
    for (const emp of employees) {
      // Randomly decide if employee registers (80% chance on past/current days, 90% on future)
      const isPastOrPresent = date <= today
      const willRegister = isPastOrPresent
        ? Math.random() < 0.8
        : Math.random() < 0.9

      if (!willRegister) continue

      // Random status: 85% eating, 15% not_eating
      const status = Math.random() < 0.85 ? 'eating' : 'not_eating'

      const registration = await prisma.registration.create({
        data: {
          userId: emp.id,
          date,
          status,
          note: Math.random() < 0.1 ? 'Không ăn được món này' : null
        }
      })
      registrationsCreated++

      // Add some overrides (mostly for past dates)
      if (isPastOrPresent && Math.random() < 0.1) {
        const originalStatus = status
        const newStatus = originalStatus === 'eating' ? 'not_eating' : 'eating'

        await prisma.registrationOverride.create({
          data: {
            registrationId: registration.id,
            performedBy: employees[0].id, // admin
            newStatus,
            note: 'Thay đổi do yêu cầu',
            originalStatus
          }
        })
        overridesCreated++
      }
    }
  }

  console.log(`   Created ${menusCreated} daily menus`)
  console.log(`   Created ${registrationsCreated} registrations`)
  console.log(`   Created ${overridesCreated} registration overrides`)

  // Create audit logs
  console.log('📝 Creating audit logs...')
  const auditActions = ['USER_CREATED', 'USER_DELETED', 'REGISTRATION_OVERRIDE', 'CUTOFF_UPDATED', 'REPORT_EXPORTED'] as const

  for (let i = 0; i < 50; i++) {
    const randomDate = new Date(pastStart.getTime() + Math.random() * (today.getTime() - pastStart.getTime()))

    await prisma.auditLog.create({
      data: {
        action: auditActions[Math.floor(Math.random() * auditActions.length)],
        entityType: ['user', 'registration', 'cutoff', 'report'][Math.floor(Math.random() * 4)],
        entityId: employees[Math.floor(Math.random() * employees.length)]?.id || 'admin',
        performedBy: employees[0].id,
        details: 'Test audit log entry',
        createdAt: randomDate
      }
    })
  }
  console.log('   Created 50 audit log entries')

  console.log('\n✅ Seed data created successfully!')
  console.log('\n📋 Summary:')
  console.log(`   - ${employees.length} employees (login: nguyenvana / employee123)`)
  console.log(`   - ${createdMeals.length} meals`)
  console.log(`   - ${holidays.length} holidays`)
  console.log(`   - ${menusCreated} daily menus (60 days back to 30 days forward)`)
  console.log(`   - ${registrationsCreated} registrations`)
  console.log(`   - Admin login: admin / admin123`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })