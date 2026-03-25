const express = require('express')
const router = express.Router()
const { requireAuth, requireAdmin } = require('../middleware/auth')
const authService = require('../services/auth')

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }
    const result = await authService.login(email.trim().toLowerCase(), password)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/create-user  (admin only)
router.post('/create-user', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, email, password, propertyId } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' })
    }
    const user = await authService.createUser({ name, email, password, propertyId })
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
})

module.exports = router
