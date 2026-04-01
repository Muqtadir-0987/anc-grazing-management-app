const express = require('express')
const router = express.Router()
const { requireAuth, requirePropertyAccess } = require('../middleware/auth')
const eventService = require('../services/events')

// GET /api/properties/:propertyId/events
router.get('/properties/:propertyId/events', requireAuth, requirePropertyAccess, async (req, res, next) => {
  try {
    const events = await eventService.listByProperty(req.params.propertyId)
    res.json(events)
  } catch (err) {
    next(err)
  }
})

// POST /api/events
router.post('/events', requireAuth, async (req, res, next) => {
  try {
    const { mobId, stockClassId, eventType, quantity, date, notes } = req.body
    if (!mobId || !stockClassId || !eventType || !quantity || !date) {
      return res.status(400).json({ error: 'Mob, stock class, event type, quantity, and date are required.' })
    }
    const event = await eventService.create(req.user, {
      mobId, stockClassId, eventType, quantity, date, notes,
    })
    res.status(201).json(event)
  } catch (err) {
    next(err)
  }
})

module.exports = router
