/**
 * Seed script — run once after migration: npm run db:seed
 * Creates stock classes and an admin user.
 */
require('dotenv').config()
const bcrypt = require('bcrypt')
const prisma = require('./lib/prisma')

const STOCK_CLASSES = [
  { name: 'Calves',     minWeightKg: 30,  maxWeightKg: 200 },
  { name: 'Lambs',      minWeightKg: 30,  maxWeightKg: 200 },
  { name: 'Weaners',    minWeightKg: 80,  maxWeightKg: 300 },
  { name: 'Cows',       minWeightKg: 250, maxWeightKg: 700 },
  { name: 'Ewes',       minWeightKg: 250, maxWeightKg: 700 },
  { name: 'Bulls',      minWeightKg: 350, maxWeightKg: 900 },
  { name: 'Cull Cows',  minWeightKg: 200, maxWeightKg: 650 },
]

async function main() {
  console.log('Seeding stock classes...')
  for (const sc of STOCK_CLASSES) {
    await prisma.stockClass.upsert({
      where: { name: sc.name },
      update: sc,
      create: sc,
    })
  }
  console.log('✓ Stock classes seeded')

  // Create default admin user
  const adminEmail = 'admin@aus-nc.com'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const passwordHash = await bcrypt.hash('changeme123', 10)
    await prisma.user.create({
      data: {
        name: 'ANC Admin',
        email: adminEmail,
        passwordHash,
        role: 'admin',
      },
    })
    console.log(`✓ Admin user created — email: ${adminEmail}  password: changeme123`)
    console.log('  ⚠️  Change the admin password immediately after first login!')
  } else {
    console.log('✓ Admin user already exists')
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
