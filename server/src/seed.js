/**
 * Seed script — run once after migration: npm run db:seed
 * Creates stock classes, an admin user, and a default grazier account with demo data.
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

  // ── Admin user ──────────────────────────────────────────────────────────
  const adminEmail = 'admin@aus-nc.com'
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('changeme123', 10)
    await prisma.user.create({
      data: { name: 'ANC Admin', email: adminEmail, passwordHash, role: 'admin' },
    })
    console.log(`✓ Admin user created    — email: ${adminEmail}  password: changeme123`)
  } else {
    console.log('✓ Admin user already exists')
  }

  // ── Grazier user with demo property ─────────────────────────────────────
  const grazierEmail = 'grazier@granitedowns.com'
  const existingGrazier = await prisma.user.findUnique({ where: { email: grazierEmail } })
  if (!existingGrazier) {
    // Property
    const property = await prisma.property.create({
      data: { name: 'Granite Downs', location: 'Toowong QLD', totalAreaHa: 5000, financialYearStart: 7 },
    })

    // Paddocks
    await prisma.paddock.createMany({
      data: [
        { propertyId: property.id, name: 'North Flats',   sizeHa: 200, stacRating: 9,  kgdmPerHa: 101.25, totalKgdm: 20250 },
        { propertyId: property.id, name: 'Hill Country',  sizeHa: 350, stacRating: 6,  kgdmPerHa: 67.5,   totalKgdm: 23625 },
        { propertyId: property.id, name: 'River Flats',   sizeHa: 180, stacRating: 12, kgdmPerHa: 135,    totalKgdm: 24300 },
      ],
    })

    // Mobs
    const mobDryCows = await prisma.mob.create({
      data: { propertyId: property.id, name: 'Dry Cows', stockClasses: ['Cows', 'Calves'] },
    })
    const mobSteers = await prisma.mob.create({
      data: { propertyId: property.id, name: 'Steers', stockClasses: ['Weaners'] },
    })

    // Stock classes lookup
    const cowsClass    = await prisma.stockClass.findFirst({ where: { name: 'Cows' } })
    const weanerClass  = await prisma.stockClass.findFirst({ where: { name: 'Weaners' } })

    // Stock flow entries (server-calculated values)
    const currentMonth = new Date().getMonth() + 1
    const currentYear  = new Date().getFullYear()
    const season       = [7, 8, 9, 10].includes(currentMonth) ? 'dormant' : 'growing'

    await prisma.stockFlowEntry.create({
      data: {
        mobId: mobDryCows.id, stockClassId: cowsClass.id,
        month: currentMonth, year: currentYear, seasonType: season,
        numberOfAnimals: 120, averageWeightKg: 480,
        lsu: 128, kgdmu: 1088, kgdmTotal: 130560,
      },
    })
    await prisma.stockFlowEntry.create({
      data: {
        mobId: mobSteers.id, stockClassId: weanerClass.id,
        month: currentMonth, year: currentYear, seasonType: season,
        numberOfAnimals: 85, averageWeightKg: 210,
        lsu: 39.67, kgdmu: 337.2, kgdmTotal: 28660,
      },
    })

    // Grazier account linked to this property
    const passwordHash = await bcrypt.hash('grazier123', 10)
    await prisma.user.create({
      data: { name: 'Granite Grazier', email: grazierEmail, passwordHash, role: 'grazier', propertyId: property.id },
    })

    console.log(`✓ Grazier user created  — email: ${grazierEmail}  password: grazier123`)
    console.log('  Property: Granite Downs | 3 paddocks | 2 mobs with stock flow data')
  } else {
    console.log('✓ Grazier user already exists')
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
