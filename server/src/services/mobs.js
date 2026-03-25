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
  })
}

async function create(propertyId, { name }) {
  return prisma.mob.create({
    data: { propertyId, name: name.trim() },
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
  return prisma.stockFlowEntry.findMany({
    where: { mobId },
    include: { stockClass: true },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  })
}

async function addStockFlowEntry(mobId, user, { stockClassId, month, year, seasonType, numberOfAnimals, averageWeightKg }) {
  const mob = await prisma.mob.findUnique({ where: { id: mobId } })
  if (!mob) throw Object.assign(new Error('Mob not found.'), { status: 404 })
  if (user.role !== 'admin' && mob.propertyId !== user.propertyId) {
    throw Object.assign(new Error('Access denied.'), { status: 403 })
  }

  // Validate weight range
  const stockClass = await prisma.stockClass.findUnique({ where: { id: stockClassId } })
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
      stockClassId,
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
  const mobs = await prisma.mob.findMany({
    where: { propertyId },
    include: {
      stockFlowEntries: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 1, // latest entry per mob for current demand
      },
    },
  })

  let totalLsu = 0
  let totalKgdmDemand = 0

  const mobSummaries = mobs.map((mob) => {
    const latest = mob.stockFlowEntries[0]
    if (latest) {
      totalLsu += latest.lsu
      totalKgdmDemand += latest.kgdmTotal
    }
    return {
      mobId: mob.id,
      mobName: mob.name,
      lsu: latest?.lsu ?? 0,
      kgdmDaily: latest?.kgdmTotal ?? 0,
    }
  })

  return {
    totalLsu: Math.round(totalLsu * 100) / 100,
    totalKgdmDemand: Math.round(totalKgdmDemand * 100) / 100,
    mobs: mobSummaries,
  }
}

module.exports = { listByProperty, create, listStockClasses, getStockFlow, addStockFlowEntry, getFeedDemandSummary }
