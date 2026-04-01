const prisma = require('../lib/prisma')

const VALID_EVENT_TYPES = ['death', 'purchase', 'sale', 'transfer', 'vaccination', 'treatment']

async function listByProperty(propertyId) {
  return prisma.stockEvent.findMany({
    where: { mob: { propertyId } },
    include: { mob: true, stockClass: true, createdBy: { select: { name: true } } },
    orderBy: { date: 'desc' },
  })
}

async function create(user, { mobId, stockClassId, eventType, quantity, date, notes }) {
  // Validate event type
  if (!VALID_EVENT_TYPES.includes(eventType)) {
    throw Object.assign(new Error(`Event type must be one of: ${VALID_EVENT_TYPES.join(', ')}.`), { status: 400 })
  }

  // Validate quantity is a positive integer
  const qty = Number(quantity)
  if (!Number.isInteger(qty) || qty <= 0) {
    throw Object.assign(new Error('Quantity must be a positive whole number.'), { status: 400 })
  }

  // Verify mob belongs to the user's property
  const mob = await prisma.mob.findUnique({ where: { id: mobId } })
  if (!mob) throw Object.assign(new Error('Mob not found.'), { status: 404 })
  if (user.role !== 'admin' && mob.propertyId !== user.propertyId) {
    throw Object.assign(new Error('Access denied.'), { status: 403 })
  }

  // Validate quantity doesn't exceed current mob total for that stock class
  // (only relevant for death, sale, transfer)
  if (['death', 'sale', 'transfer'].includes(eventType)) {
    const currentTotal = await getCurrentMobTotal(mobId, stockClassId)
    if (qty > currentTotal) {
      const stockClass = await prisma.stockClass.findUnique({ where: { id: stockClassId } })
      throw Object.assign(
        new Error(`Quantity (${qty}) exceeds current ${stockClass?.name ?? 'stock class'} total (${currentTotal}).`),
        { status: 400 }
      )
    }
  }

  return prisma.stockEvent.create({
    data: {
      mobId,
      stockClassId,
      eventType,
      quantity: qty,
      date: new Date(date),
      notes: notes?.trim() || null,
      createdByUserId: user.userId,
    },
    include: { mob: true, stockClass: true },
  })
}

// Sum purchases minus deaths/sales/transfers to get current headcount
async function getCurrentMobTotal(mobId, stockClassId) {
  const events = await prisma.stockEvent.findMany({
    where: { mobId, stockClassId },
    select: { eventType: true, quantity: true },
  })

  // Also pull the starting number from stock flow entries
  const latestEntry = await prisma.stockFlowEntry.findFirst({
    where: { mobId, stockClassId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  let total = latestEntry?.numberOfAnimals ?? 0

  for (const e of events) {
    if (e.eventType === 'purchase') total += e.quantity
    if (['death', 'sale', 'transfer'].includes(e.eventType)) total -= e.quantity
  }

  return Math.max(0, total)
}

module.exports = { listByProperty, create, getCurrentMobTotal }
