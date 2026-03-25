const prisma = require('../lib/prisma')
const { computeSrcc } = require('./plans')

async function gatherReportData(propertyId, interval) {
  const now = new Date()
  let since = new Date()

  if (interval === 'weekly') since.setDate(now.getDate() - 7)
  else if (interval === 'monthly') since.setMonth(now.getMonth() - 1)
  else since.setMonth(now.getMonth() - 3) // quarterly

  const [property, mobs, events, paddocks] = await Promise.all([
    prisma.property.findUnique({ where: { id: propertyId } }),
    prisma.mob.findMany({
      where: { propertyId },
      include: {
        stockFlowEntries: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1,
        },
      },
    }),
    prisma.stockEvent.findMany({
      where: { mob: { propertyId }, date: { gte: since } },
      include: { mob: true, stockClass: true },
      orderBy: { date: 'desc' },
    }),
    prisma.paddock.findMany({ where: { propertyId } }),
  ])

  const { srccRatio, srccStatus } = await computeSrcc(propertyId)

  let totalLsu = 0
  let totalKgdmDemand = 0
  mobs.forEach((mob) => {
    const latest = mob.stockFlowEntries[0]
    if (latest) {
      totalLsu += latest.lsu
      totalKgdmDemand += latest.kgdmTotal
    }
  })

  return { property, mobs, events, paddocks, srccRatio, srccStatus, totalLsu, totalKgdmDemand, interval, since, now }
}

// ── CSV (Node.js built-in string building — no library) ──
async function generateCsv(propertyId, interval) {
  const d = await gatherReportData(propertyId, interval)

  const lines = []

  // Header
  lines.push(`ANC Grazing Management Report`)
  lines.push(`Property,${d.property.name}`)
  lines.push(`Location,${d.property.location ?? ''}`)
  lines.push(`Period,${d.since.toISOString().slice(0, 10)} to ${d.now.toISOString().slice(0, 10)}`)
  lines.push(`Interval,${d.interval}`)
  lines.push(`SR:CC Ratio,${d.srccRatio}`)
  lines.push(`SR:CC Status,${d.srccStatus}`)
  lines.push(`Total LSU,${d.totalLsu}`)
  lines.push(`Total KgDM Daily Demand,${d.totalKgdmDemand}`)
  lines.push('')

  // Mob summary
  lines.push('MOB SUMMARY')
  lines.push('Mob Name,Animals,LSU,KgDM Daily')
  d.mobs.forEach((mob) => {
    const e = mob.stockFlowEntries[0]
    lines.push(`"${mob.name}",${e?.numberOfAnimals ?? 0},${e?.lsu ?? 0},${e?.kgdmTotal ?? 0}`)
  })
  lines.push('')

  // Stock events
  lines.push('STOCK EVENTS')
  lines.push('Date,Mob,Stock Class,Event Type,Quantity,Notes')
  d.events.forEach((ev) => {
    lines.push(
      `${ev.date.toISOString().slice(0, 10)},"${ev.mob.name}","${ev.stockClass.name}",${ev.eventType},${ev.quantity},"${ev.notes ?? ''}"`
    )
  })
  lines.push('')

  // Paddocks
  lines.push('PADDOCK SUMMARY')
  lines.push('Paddock,Size (ha),STAC Rating,KgDM/ha,Total KgDM')
  d.paddocks.forEach((p) => {
    lines.push(`"${p.name}",${p.sizeHa},${p.stacRating},${p.kgdmPerHa},${p.totalKgdm}`)
  })

  return lines.join('\n')
}

// ── PDF (jsPDF) ──
async function generatePdf(propertyId, interval) {
  const { jsPDF } = require('jspdf')
  const d = await gatherReportData(propertyId, interval)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 20
  let y = margin

  function line(text, fontSize = 10, bold = false) {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(text, margin, y)
    y += fontSize * 0.5 + 2
    if (y > 270) { doc.addPage(); y = margin }
  }

  function gap() { y += 4 }

  // Title
  line('ANC Grazing Management Report', 16, true)
  gap()
  line(`Property: ${d.property.name}`, 11)
  line(`Location: ${d.property.location ?? 'N/A'}`, 11)
  line(`Period: ${d.since.toISOString().slice(0, 10)} → ${d.now.toISOString().slice(0, 10)}`, 11)
  line(`Interval: ${d.interval}`, 11)
  gap()

  // SR:CC
  line('SR:CC Summary', 13, true)
  line(`SR:CC Ratio: ${d.srccRatio}  (${d.srccStatus.toUpperCase()})`, 11)
  line(`Total LSU: ${d.totalLsu}`, 11)
  line(`Total KgDM Daily Demand: ${d.totalKgdmDemand} kg`, 11)
  gap()

  // Mobs
  line('Mob Summary', 13, true)
  d.mobs.forEach((mob) => {
    const e = mob.stockFlowEntries[0]
    line(`  ${mob.name}: ${e?.numberOfAnimals ?? 0} head | LSU ${e?.lsu ?? 0} | ${e?.kgdmTotal ?? 0} KgDM/day`, 10)
  })
  gap()

  // Events
  line('Stock Events', 13, true)
  if (d.events.length === 0) {
    line('  No events recorded in this period.', 10)
  } else {
    d.events.forEach((ev) => {
      line(`  ${ev.date.toISOString().slice(0, 10)} | ${ev.mob.name} | ${ev.stockClass.name} | ${ev.eventType} × ${ev.quantity}`, 10)
    })
  }
  gap()

  // Paddocks
  line('Paddock Summary', 13, true)
  d.paddocks.forEach((p) => {
    line(`  ${p.name}: ${p.sizeHa} ha | STAC ${p.stacRating} | ${p.kgdmPerHa} KgDM/ha | ${p.totalKgdm} KgDM total`, 10)
  })

  return Buffer.from(doc.output('arraybuffer'))
}

module.exports = { generateCsv, generatePdf }
