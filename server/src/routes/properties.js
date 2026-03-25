const express = require('express')
const router = express.Router()
const { requireAuth, requireAdmin, requirePropertyAccess } = require('../middleware/auth')
const propertyService = require('../services/properties')

// GET /api/properties — grazier: own only; admin: all
router.get('/properties', requireAuth, async (req, res, next) => {
  try {
    const properties = await propertyService.list(req.user)
    res.json(properties)
  } catch (err) {
    next(err)
  }
})

// POST /api/properties — admin only
router.post('/properties', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, location, totalAreaHa, financialYearStart } = req.body
    if (!name || !totalAreaHa) {
      return res.status(400).json({ error: 'Property name and total area are required.' })
    }
    const property = await propertyService.create({ name, location, totalAreaHa, financialYearStart })
    res.status(201).json(property)
  } catch (err) {
    next(err)
  }
})

// GET /api/properties/:id
router.get('/properties/:id', requireAuth, requirePropertyAccess, async (req, res, next) => {
  try {
    const property = await propertyService.getById(req.params.id)
    if (!property) return res.status(404).json({ error: 'Property not found.' })
    res.json(property)
  } catch (err) {
    next(err)
  }
})

module.exports = router
