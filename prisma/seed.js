const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@naijaharvest.com'
  const username = process.env.ADMIN_USERNAME || 'admin'
  const passwordPlain = process.env.ADMIN_PASSWORD || 'adminpass'
  const passwordHash = await bcrypt.hash(passwordPlain, 10)

  console.log('Seeding admin user...')
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      username,
      email: adminEmail,
      passwordHash,
      status: 'ACTIVE',
      role: 'ADMIN'
    }
  })
  console.log('Admin user seeded')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })