const prisma = require('../lib/prisma')
const { calcStockFlowFields } = require('./calculations')

// Weight validation by stock class name
const WEIGHT_RANGES = {
  'Calves': { min: 30, max: 200 },
  'Lambs': { min: 30, max: 200 },
  'Weaners': { min: 80, max: 300 },
  'Cows': { min: 250, max: 700 },
  'Ewes': { min: 250, max: 700 },
  'Bulls': { min: 350, max: 900 },
  'Cull Cows': { min: 200, max: 650 },
}

async function listByProperty(propertyId) {
  return prisma.mob.findMany({
    where: { propertyId },
    orderBy: { name: 'asc' },
    select: { id: true, propertyId: true, name: true, stockClasses: true, createdAt: true },
  })
}

async function create(propertyId, { name, stockClasses = [] }) {
  return prisma.mob.create({
    data: { propertyId, name: name.trim(), stockClasses },
  })
}

async function listStockClasses() {
  return prisma.stockClass.findMany({ orderBy: { name: 'asc' } })
}

async function getStockFlow(mobId, user) {
  const mob = await prisma.mob.findUnique({ where: { id: mobId } })
  if (!mob) throw Object.assign(new Error('Mob not found.'), { status: 404 })
  if (user.role !== 'admin' && mob.propertyId !== user.propertyId) {
    throw Object.assign(new Error('Access denied.'), { status: 403 })
  }
  const entries = await prisma.stockFlowEntry.findMany({
    where: { mobId },
    include: { stockClass: true },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  })
  // Return stockClass as name string so the frontend can build consistent entry keys
  return entries.map((e) => ({ ...e, stockClass: e.stockClass.name }))
}

async function addStockFlowEntry(mobId, user, { stockClass: stockClassName, stockClassId, month, year, seasonType, numberOfAnimals, averageWeightKg }) {
  const mob = await prisma.mob.findUnique({ where: { id: mobId } })
  if (!mob) throw Object.assign(new Error('Mob not found.'), { status: 404 })
  if (user.role !== 'admin' && mob.propertyId !== user.propertyId) {
    throw Object.assign(new Error('Access denied.'), { status: 403 })
  }

  // Accept stock class by name or by ID
  const stockClass = stockClassName
    ? await prisma.stockClass.findFirst({ where: { name: stockClassName } })
    : await prisma.stockClass.findUnique({ where: { id: stockClassId } })
  if (!stockClass) throw Object.assign(new Error('Stock class not found.'), { status: 400 })

  const weight = Number(averageWeightKg)
  if (weight < stockClass.minWeightKg || weight > stockClass.maxWeightKg) {
    throw Object.assign(
      new Error(`Average weight must be between ${stockClass.minWeightKg} kg and ${stockClass.maxWeightKg} kg for ${stockClass.name}.`),
      { status: 400 }
    )
  }

  const { lsu, kgdmu, kgdmTotal } = calcStockFlowFields(Number(numberOfAnimals), weight)

  return prisma.stockFlowEntry.create({
    data: {
      mobId,
      stockClassId: stockClass.id,
      month: Number(month),
      year: Number(year),
      seasonType,
      numberOfAnimals: Number(numberOfAnimals),
      averageWeightKg: weight,
      lsu,
      kgdmu,
      kgdmTotal,
    },
  })
}

async function getFeedDemandSummary(propertyId) {
  const [property, mobs, paddocks] = await Promise.all([
    prisma.property.findUnique({ where: { id: propertyId } }),
    prisma.mob.findMany({
      where: { propertyId },
      include: { stockFlowEntries: { orderBy: [{ year: 'asc' }, { month: 'asc' }] } },
    }),
    prisma.paddock.findMany({ where: { propertyId } }),
  ])

  let totalLsu = 0
  let dormantTotal = 0
  let growingTotal = 0

  const mobSummaries = mobs.map((mob) => {
    let mobDormant = 0
    let mobGrowing = 0
    mob.stockFlowEntries.forEach((e) => {
      if (e.seasonType === 'dormant') mobDormant += e.kgdmTotal
      else mobGrowing += e.kgdmTotal
    })
    const latest = mob.stockFlowEntries[mob.stockFlowEntries.length - 1]
    if (latest) totalLsu += latest.lsu
    dormantTotal += mobDormant
    growingTotal += mobGrowing
    return { name: mob.name, dormant: Math.round(mobDormant), growing: Math.round(mobGrowing) }
  })

  // Feed days remaining: total paddock KgDM / daily demand (latest entries sum)
  const totalPaddockKgdm = paddocks.reduce((sum, p) => sum + p.totalKgdm, 0)
  const latestDailyDemand = mobs.reduce((sum, mob) => {
    const latest = mob.stockFlowEntries[mob.stockFlowEntries.length - 1]
    return sum + (latest?.kgdmTotal ?? 0)
  }, 0)
  const feedDaysRemaining = latestDailyDemand > 0 ? Math.floor(totalPaddockKgdm / latestDailyDemand) : 0

  // Period: earliest to latest entry across all mobs
  const allEntries = mobs.flatMap((m) => m.stockFlowEntries)
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const periodFrom = allEntries.length
    ? `${MONTH_NAMES[allEntries[0].month - 1]} ${allEntries[0].year}`
    : '—'
  const last = allEntries[allEntries.length - 1]
  const periodTo = last ? `${MONTH_NAMES[last.month - 1]} ${last.year}` : '—'

  // Season label periods
  const dormantMonths = allEntries.filter((e) => e.seasonType === 'dormant')
  const growingMonths = allEntries.filter((e) => e.seasonType === 'growing')
  const dormantPeriod = dormantMonths.length ? `${dormantMonths.length} dormant month(s)` : 'No dormant entries'
  const growingPeriod = growingMonths.length ? `${growingMonths.length} growing month(s)` : 'No growing entries'

  return {
    propertyName: property?.name ?? '',
    periodFrom,
    periodTo,
    dormantTotal: Math.round(dormantTotal),
    growingTotal: Math.round(growingTotal),
    dormantPeriod,
    growingPeriod,
    feedDaysRemaining,
    totalLsu: Math.round(totalLsu * 100) / 100,
    mobs: mobSummaries,
  }
}

module.exports = { listByProperty, create, listStockClasses, getStockFlow, addStockFlowEntry, getFeedDemandSummary }
