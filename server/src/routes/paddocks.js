const express = require('express')
const router = express.Router()
const { requireAuth, requirePropertyAccess } = require('../middleware/auth')
const paddockService = require('../services/paddocks')

// POST /api/properties/:propertyId/paddocks
router.post('/properties/:propertyId/paddocks', requireAuth, requirePropertyAccess, async (req, res, next) => {
  try {
    const { name, sizeHa, stacRating } = req.body
    if (!name || !sizeHa || !stacRating) {
      return res.status(400).json({ error: 'Name, size, and STAC rating are required.' })
    }
    const paddock = await paddockService.create(req.params.propertyId, { name, sizeHa, stacRating })
    res.status(201).json(paddock)
  } catch (err) {
    next(err)
  }
})

// GET /api/properties/:propertyId/paddocks
router.get('/properties/:propertyId/paddocks', requireAuth, requirePropertyAccess, async (req, res, next) => {
  try {
    const paddocks = await paddockService.listByProperty(req.params.propertyId)
    res.json(paddocks)
  } catch (err) {
    next(err)
  }
})

// PUT /api/paddocks/:id
router.put('/paddocks/:id', requireAuth, async (req, res, next) => {
  try {
    const { name, sizeHa, stacRating } = req.body
    const paddock = await paddockService.update(req.params.id, req.user, { name, sizeHa, stacRating })
    res.json(paddock)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/paddocks/:id
router.delete('/paddocks/:id', requireAuth, async (req, res, next) => {
  try {
    await paddockService.remove(req.params.id, req.user)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router
