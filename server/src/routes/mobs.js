const express = require('express')
const router = express.Router()
const { requireAuth, requirePropertyAccess } = require('../middleware/auth')
const mobService = require('../services/mobs')

// GET /api/properties/:propertyId/mobs
router.get('/properties/:propertyId/mobs', requireAuth, requirePropertyAccess, async (req, res, next) => {
  try {
    const mobs = await mobService.listByProperty(req.params.propertyId)
    res.json(mobs)
  } catch (err) {
    next(err)
  }
})

// POST /api/properties/:propertyId/mobs
router.post('/properties/:propertyId/mobs', requireAuth, requirePropertyAccess, async (req, res, next) => {
  try {
    const { name, stockClasses } = req.body
    if (!name) return res.status(400).json({ error: 'Mob name is required.' })
    const mob = await mobService.create(req.params.propertyId, { name, stockClasses })
    res.status(201).json(mob)
  } catch (err) {
    next(err)
  }
})

// GET /api/stock-classes
router.get('/stock-classes', requireAuth, async (req, res, next) => {
  try {
    const classes = await mobService.listStockClasses()
    res.json(classes)
  } catch (err) {
    next(err)
  }
})

// GET /api/mobs/:id/stock-flow
router.get('/mobs/:id/stock-flow', requireAuth, async (req, res, next) => {
  try {
    const entries = await mobService.getStockFlow(req.params.id, req.user)
    res.json(entries)
  } catch (err) {
    next(err)
  }
})

// POST /api/mobs/:id/stock-flow
router.post('/mobs/:id/stock-flow', requireAuth, async (req, res, next) => {
  try {
    const { stockClass, stockClassId, month, year, seasonType, numberOfAnimals, averageWeightKg } = req.body
    if ((!stockClass && !stockClassId) || !month || !year || !seasonType || !numberOfAnimals || !averageWeightKg) {
      return res.status(400).json({ error: 'All stock flow fields are required.' })
    }
    const entry = await mobService.addStockFlowEntry(req.params.id, req.user, {
      stockClass, stockClassId, month, year, seasonType, numberOfAnimals, averageWeightKg,
    })
    res.status(201).json(entry)
  } catch (err) {
    next(err)
  }
})

// GET /api/properties/:propertyId/feed-demand
router.get('/properties/:propertyId/feed-demand', requireAuth, requirePropertyAccess, async (req, res, next) => {
  try {
    const summary = await mobService.getFeedDemandSummary(req.params.propertyId)
    res.json(summary)
  } catch (err) {
    next(err)
  }
})

module.exports = router
