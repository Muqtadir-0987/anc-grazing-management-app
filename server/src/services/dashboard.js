const prisma = require('../lib/prisma')
const { computeSrcc } = require('./plans')

async function getDashboardData(user) {
  if (user.role === 'admin') {
    return getAdminDashboard()
  }
  return getGrazierDashboard(user.propertyId)
}

async function getGrazierDashboard(propertyId) {
  const [property, paddocks, mobs, latestPlan] = await Promise.all([
    prisma.property.findUnique({ where: { id: propertyId } }),
    prisma.paddock.findMany({ where: { propertyId } }),
    prisma.mob.findMany({
      where: { propertyId },
      include: {
        stockFlowEntries: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1,
        },
        allocations: {
          include: { paddock: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.grazingPlan.findFirst({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Aggregate metrics
  let totalLsu = 0
  let totalKgdmDemand = 0
  const mobSummaries = mobs.map((mob) => {
    const latest = mob.stockFlowEntries[0]
    if (latest) {
      totalLsu += latest.lsu
      totalKgdmDemand += latest.kgdmTotal
    }
    const currentPaddock = mob.allocations[0]?.paddock
    return {
      id: mob.id,
      name: mob.name,
      headCount: latest?.numberOfAnimals ?? 0,
      paddockName: currentPaddock?.name ?? null,
      lsu: latest?.lsu ?? 0,
    }
  })

  // Feed days remaining: total KgDM available across all paddocks / daily demand
  const totalPaddockKgdm = paddocks.reduce((sum, p) => sum + p.totalKgdm, 0)
  const feedDaysRemaining = totalKgdmDemand > 0
    ? Math.floor(totalPaddockKgdm / totalKgdmDemand)
    : 0

  // SR:CC
  const { srccRatio, srccStatus } = await computeSrcc(propertyId)

  // Alerts
  const alerts = []
  if (srccRatio >= 0.85 && srccRatio < 1.0) {
    const nearMob = mobSummaries.find((m) => m.paddockName)
    alerts.push(
      `SR:CC at ${srccRatio.toFixed(2)} — approaching threshold.${nearMob ? ` Review paddock allocation for ${nearMob.name}.` : ''}`
    )
  }
  if (srccStatus === 'overstocked') {
    alerts.push(`SR:CC at ${srccRatio.toFixed(2)} — property is overstocked. Action required.`)
  }

  return {
    propertyName: property?.name ?? '',
    seasonType: latestPlan?.seasonType ?? 'dormant',
    feedDaysRemaining,
    totalKgdmDemand: Math.round(totalKgdmDemand),
    totalLsu: Math.round(totalLsu * 10) / 10,
    activePaddocks: paddocks.length,
    srcc: srccRatio,
    srccStatus,
    mobs: mobSummaries,
    alerts,
  }
}

async function getAdminDashboard() {
  const properties = await prisma.property.findMany({
    include: { paddocks: true, mobs: true },
  })

  const propertySummaries = await Promise.all(
    properties.map(async (p) => {
      const { srccRatio, srccStatus } = await computeSrcc(p.id)
      return {
        id: p.id,
        name: p.name,
        location: p.location,
        totalAreaHa: p.totalAreaHa,
        mobCount: p.mobs.length,
        paddockCount: p.paddocks.length,
        srcc: srccRatio,
        srccStatus,
      }
    })
  )

  return { properties: propertySummaries }
}

module.exports = { getDashboardData }
