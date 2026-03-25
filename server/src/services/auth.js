const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const SALT_ROUNDS = 10
// Same message for wrong email OR wrong password — prevents email enumeration
const INVALID_CREDENTIALS = 'Invalid email or password.'

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } })

  // Always run bcrypt even if user not found to prevent timing attacks
  const hash = user?.passwordHash ?? '$2b$10$invalidhashtopreventtimingattack000000000000000'
  const valid = await bcrypt.compare(password, hash)

  if (!user || !valid) {
    const err = new Error(INVALID_CREDENTIALS)
    err.status = 401
    throw err
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, propertyId: user.propertyId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )

  return { token, role: user.role, name: user.name }
}

async function createUser({ name, email, password, propertyId, role = 'grazier' }) {
  const existing = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  })
  if (existing) {
    const err = new Error('A user with that email already exists.')
    err.status = 400
    throw err
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      propertyId: propertyId || null,
    },
    select: { id: true, name: true, email: true, role: true, propertyId: true },
  })

  return user
}

module.exports = { login, createUser }
