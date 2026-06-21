import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

const action = process.argv[2]
const username = process.argv[3]

async function main() {
  if (action === 'disable') {
    const u = await prisma.user.update({ where: { username }, data: { isActive: false } })
    console.log(`Disabled ${u.username}, isActive=${u.isActive}`)
  } else if (action === 'enable') {
    const u = await prisma.user.update({ where: { username }, data: { isActive: true } })
    console.log(`Enabled ${u.username}, isActive=${u.isActive}`)
  } else if (action === 'list') {
    const users = await prisma.user.findMany({ select: { id: true, username: true, name: true, role: true, isActive: true, tokenVersion: true } })
    console.log(JSON.stringify(users, null, 2))
  } else if (action === 'bump-token') {
    const u = await prisma.user.update({ where: { username }, data: { tokenVersion: { increment: 1 } } })
    console.log(`Bumped tokenVersion for ${u.username}, now=${u.tokenVersion}`)
  } else {
    console.error('Usage: node qa-db.mjs <disable|enable|list|bump-token> [username]')
    process.exit(1)
  }
}

main().finally(() => prisma.$disconnect())