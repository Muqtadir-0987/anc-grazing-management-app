const prisma = require('../lib/prisma')
const { calcPaddockFields } = require('./calculations')

async function create(propertyId, { name, sizeHa, stacRating }) {
  const { kgdmPerHa, totalKgdm } = calcPaddockFields(Number(sizeHa), Number(stacRating))

  return prisma.paddock.create({
    data: {
      propertyId,
      name: name.trim(),
      sizeHa: Number(sizeHa),
      stacRating: Number(stacRating),
      kgdmPerHa,
      totalKgdm,
    },
  })
}

async function listByProperty(propertyId) {
  return prisma.paddock.findMany({
    where: { propertyId },
    orderBy: { name: 'asc' },
  })
}

async function update(id, user, { name, sizeHa, stacRating }) {
  const paddock = await prisma.paddock.findUnique({ where: { id } })
  if (!paddock) throw Object.assign(new Error('Paddock not found.'), { status: 404 })

  // Property isolation: grazier can only touch their own paddocks
  if (user.role !== 'admin' && paddock.propertyId !== user.propertyId) {
    throw Object.assign(new Error('Access denied.'), { status: 403 })
  }

  const data = {}
  if (name) data.name = name.trim()
  if (sizeHa != null) data.sizeHa = Number(sizeHa)
  if (stacRating != null) data.stacRating = Number(stacRating)

  // Recalculate if size or STAC changed
  const newSize = data.sizeHa ?? paddock.sizeHa
  const newStac = data.stacRating ?? paddock.stacRating
  const { kgdmPerHa, totalKgdm } = calcPaddockFields(newSize, newStac)
  data.kgdmPerHa = kgdmPerHa
  data.totalKgdm = totalKgdm

  return prisma.paddock.update({ where: { id }, data })
}

async function remove(id, user) {
  const paddock = await prisma.paddock.findUnique({ where: { id } })
  if (!paddock) throw Object.assign(new Error('Paddock not found.'), { status: 404 })
  if (user.role !== 'admin' && paddock.propertyId !== user.propertyId) {
    throw Object.assign(new Error('Access denied.'), { status: 403 })
  }
  await prisma.paddock.delete({ where: { id } })
}

module.exports = { create, listByProperty, update, remove }
