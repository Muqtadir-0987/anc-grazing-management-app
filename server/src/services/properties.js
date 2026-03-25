const prisma = require('../lib/prisma')

async function list(user) {
  if (user.role === 'admin') {
    return prisma.property.findMany({ orderBy: { name: 'asc' } })
  }
  return prisma.property.findMany({
    where: { id: user.propertyId },
  })
}

async function create({ name, location, totalAreaHa, financialYearStart = 7 }) {
  return prisma.property.create({
    data: { name, location, totalAreaHa: Number(totalAreaHa), financialYearStart },
  })
}

async function getById(id) {
  return prisma.property.findUnique({
    where: { id },
    include: { paddocks: true },
  })
}

module.exports = { list, create, getById }
