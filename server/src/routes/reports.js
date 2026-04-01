const express = require('express')
const router = express.Router()
const { requireAuth, requirePropertyAccess } = require('../middleware/auth')
const reportService = require('../services/reports')

// POST /api/properties/:propertyId/reports
router.post('/properties/:propertyId/reports', requireAuth, requirePropertyAccess, async (req, res, next) => {
  try {
    const { format = 'pdf', interval = 'monthly' } = req.body
    const propertyId = req.params.propertyId

    if (!['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Format must be pdf or csv.' })
    }
    if (!['weekly', 'monthly', 'quarterly'].includes(interval)) {
      return res.status(400).json({ error: 'Interval must be weekly, monthly, or quarterly.' })
    }

    if (format === 'csv') {
      const csv = await reportService.generateCsv(propertyId, interval)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="anc-report-${propertyId}.csv"`)
      return res.send(csv)
    }

    const pdfBuffer = await reportService.generatePdf(propertyId, interval)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="anc-report-${propertyId}.pdf"`)
    return res.send(pdfBuffer)
  } catch (err) {
    next(err)
  }
})

module.exports = router
