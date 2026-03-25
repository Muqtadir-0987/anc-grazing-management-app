const prisma = require('../lib/prisma')
const { calcGrazePeriod, calcSrcc } = require('./calculations')

async function create(propertyId, { seasonType, startDate, endDate }) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalPlanDays = Math.round((end - start) / (1000 * 60 * 60 * 24))

  if (totalPlanDays <= 0) {
    throw Object.assign(new Error('End date must be after start date.'), { status: 400 })
  }

  // Calculate SR:CC at time of plan creation
  const { srccRatio, srccStatus } = await computeSrcc(propertyId)

  return prisma.grazingPlan.create({
    data: {
      propertyId,
      seasonType,
      startDate: start,
      endDate: end,
      totalPlanDays,
      srccRatio,
      srccStatus,
    },
  })
}

async function getById(id, user) {
  const plan = await prisma.grazingPlan.findUnique({
    where: { id },
    include: {
      allocations: {
        include: { paddock: true, mob: true },
      },
    },
  })
  if (!plan) return null
  if (user.role !== 'admin' && plan.propertyId !== user.propertyId) {
    throw Object.assign(new Error('Access denied.'), { status: 403 })
  }
  return plan
}

async function addAllocation(planId, user, { paddockId, mobId }) {
  const plan = await prisma.grazingPlan.findUnique({ where: { id: planId } })
  if (!plan) throw Object.assign(new Error('Plan not found.'), { status: 404 })
  if (user.role !== 'admin' && plan.propertyId !== user.propertyId) {
    throw Object.assign(new Error('Access denied.'), { status: 403 })
  }

  const paddock = await prisma.paddock.findUnique({ where: { id: paddockId } })
  if (!paddock) throw Object.assign(new Error('Paddock not found.'), { status: 404 })

  // Get mob's latest daily KgDM demand
  const latestEntry = await prisma.stockFlowEntry.findFirst({
    where: { mobId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  const mobDailyDemand = latestEntry?.kgdmTotal ?? 0
  const grazePeriodDays = calcGrazePeriod(paddock.totalKgdm, mobDailyDemand)
  const surplusDeficitKgdm = paddock.totalKgdm - mobDailyDemand * grazePeriodDays

  const allocation = await prisma.paddockAllocation.create({
    data: {
      planId,
      paddockId,
      mobId,
      grazePeriodDays: Math.round(grazePeriodDays * 100) / 100,
      surplusDeficitKgdm: Math.round(surplusDeficitKgdm * 100) / 100,
    },
    include: { paddock: true, mob: true },
  })

  // Recalculate and update SR:CC on the plan
  const { srccRatio, srccStatus } = await computeSrcc(plan.propertyId)
  await prisma.grazingPlan.update({
    where: { id: planId },
    data: { srccRatio, srccStatus },
  })

  return allocation
}

async function removeAllocation(id, user) {
  const allocation = await prisma.paddockAllocation.findUnique({
    where: { id },
    include: { plan: true },
  })
  if (!allocation) throw Object.assign(new Error('Allocation not found.'), { status: 404 })
  if (user.role !== 'admin' && allocation.plan.propertyId !== user.propertyId) {
    throw Object.assign(new Error('Access denied.'), { status: 403 })
  }
  await prisma.paddockAllocation.delete({ where: { id } })

  // Recalculate SR:CC after removal
  const { srccRatio, srccStatus } = await computeSrcc(allocation.plan.propertyId)
  await prisma.grazingPlan.update({
    where: { id: allocation.planId },
    data: { srccRatio, srccStatus },
  })
}

// SR:CC = total farm LSU / total carrying capacity LSU
async function computeSrcc(propertyId) {
  const [entries, paddocks] = await Promise.all([
    prisma.stockFlowEntry.findMany({
      where: { mob: { propertyId } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
    prisma.paddock.findMany({ where: { propertyId } }),
  ])

  // Latest entry per mob
  const seenMobs = new Set()
  let totalLsu = 0
  for (const e of entries) {
    if (!seenMobs.has(e.mobId)) {
      totalLsu += e.lsu
      seenMobs.add(e.mobId)
    }
  }

  const totalCarryingCapacity = paddocks.reduce((sum, p) => sum + p.totalKgdm, 0) / 8.5
  return calcSrcc(totalLsu, totalCarryingCapacity)
}

module.exports = { create, getById, addAllocation, removeAllocation, computeSrcc }
