const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const dashboardService = require('../services/dashboard')

// GET /api/dashboard
router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardData(req.user)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

module.exports = router
