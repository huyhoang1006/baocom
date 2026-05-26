import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminPassword, name: 'Administrator', role: 'admin' }
  })

  // Create employee users
  const employeePassword = await bcrypt.hash('employee123', 12)
  const employees = [
    { username: 'hungpx', name: 'Hùng PX' },
    { username: 'nguyenvana', name: 'Nguyễn Văn A' },
    { username: 'tranthib', name: 'Trần Thị B' },
    { username: 'levanc', name: 'Lê Văn C' },
    { username: 'phamthid', name: 'Phạm Thị D' },
    { username: 'hoangvane', name: 'Hoàng Văn E' }
  ]

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { username: emp.username },
      update: {},
      create: { username: emp.username, password: employeePassword, name: emp.name, role: 'employee' }
    })
  }

  // Create meals
  const meals = [
    { name: 'Thịt kho tàu', type: 'main' },
    { name: 'Chả lá lốt', type: 'main' },
    { name: 'Cá kho tộ', type: 'main' },
    { name: 'Gà nướng đất sét', type: 'main' },
    { name: 'Bún chả Hà Nội', type: 'main' },
    { name: 'Cải xào', type: 'vegetable' },
    { name: 'Su su luộc', type: 'vegetable' },
    { name: 'Thịt gà rang', type: 'vegetable' },
    { name: 'Đỗ quả xào', type: 'vegetable' },
    { name: 'Rau muống luộc', type: 'vegetable' },
    { name: 'Đậu phụ nhồi thịt', type: 'vegetable' },
    { name: 'Cà rốt xào', type: 'vegetable' },
    { name: 'Bông cải hấp', type: 'vegetable' },
    { name: 'Đu đủ luộc', type: 'vegetable' },
    { name: 'Rau mùi', type: 'vegetable' },
    { name: 'Chuối', type: 'dessert' },
    { name: 'Dưa hấu', type: 'dessert' },
    { name: 'Nước ép cam', type: 'dessert' },
    { name: 'Kem vani', type: 'dessert' },
    { name: 'Chè đậu đỏ', type: 'dessert' }
  ]

  const createdMeals: { id: string; type: string }[] = []
  for (const meal of meals) {
    const created = await prisma.meal.create({ data: meal })
    createdMeals.push(created)
  }

  // Create weekly menus for current week
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)

  for (let i = 0; i < 5; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    date.setHours(0, 0, 0, 0)

    const dailyMenu = await prisma.dailyMenu.create({ data: { date } })

    const mainMeals = createdMeals.filter(m => m.type === 'main')
    const vegMeals = createdMeals.filter(m => m.type === 'vegetable')
    const dessertMeals = createdMeals.filter(m => m.type === 'dessert')

    const dayIndex = i % mainMeals.length

    await prisma.dailyMenuMeal.create({
      data: { dailyMenuId: dailyMenu.id, mealId: mainMeals[dayIndex].id, sortOrder: 0 }
    })
    await prisma.dailyMenuMeal.create({
      data: { dailyMenuId: dailyMenu.id, mealId: vegMeals[(dayIndex * 2) % vegMeals.length].id, sortOrder: 1 }
    })
    await prisma.dailyMenuMeal.create({
      data: { dailyMenuId: dailyMenu.id, mealId: vegMeals[(dayIndex * 2 + 1) % vegMeals.length].id, sortOrder: 2 }
    })
    await prisma.dailyMenuMeal.create({
      data: { dailyMenuId: dailyMenu.id, mealId: dessertMeals[dayIndex % dessertMeals.length].id, sortOrder: 3 }
    })
  }

  console.log('Seeding complete!')
  console.log('Admin login: admin / admin123')
  console.log('Employee login: nguyenvana / employee123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })