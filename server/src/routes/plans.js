const express = require('express')
const router = express.Router()
const { requireAuth, requirePropertyAccess } = require('../middleware/auth')
const planService = require('../services/plans')

// POST /api/properties/:propertyId/plans
router.post('/properties/:propertyId/plans', requireAuth, requirePropertyAccess, async (req, res, next) => {
  try {
    const { seasonType, startDate, endDate } = req.body
    if (!seasonType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Season type, start date, and end date are required.' })
    }
    const plan = await planService.create(req.params.propertyId, { seasonType, startDate, endDate })
    res.status(201).json(plan)
  } catch (err) {
    next(err)
  }
})

// GET /api/plans/:id
router.get('/plans/:id', requireAuth, async (req, res, next) => {
  try {
    const plan = await planService.getById(req.params.id, req.user)
    if (!plan) return res.status(404).json({ error: 'Plan not found.' })
    res.json(plan)
  } catch (err) {
    next(err)
  }
})

// POST /api/plans/:id/allocations
router.post('/plans/:id/allocations', requireAuth, async (req, res, next) => {
  try {
    const { paddockId, mobId } = req.body
    if (!paddockId || !mobId) {
      return res.status(400).json({ error: 'Paddock and mob are required.' })
    }
    const allocation = await planService.addAllocation(req.params.id, req.user, { paddockId, mobId })
    res.status(201).json(allocation)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/allocations/:id
router.delete('/allocations/:id', requireAuth, async (req, res, next) => {
  try {
    await planService.removeAllocation(req.params.id, req.user)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router
