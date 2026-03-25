require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const propertyRoutes = require('./routes/properties')
const paddockRoutes = require('./routes/paddocks')
const mobRoutes = require('./routes/mobs')
const eventRoutes = require('./routes/events')
const planRoutes = require('./routes/plans')
const dashboardRoutes = require('./routes/dashboard')
const reportRoutes = require('./routes/reports')
const errorHandler = require('./middleware/errorHandler')

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ── Routes ──
app.use('/api/auth', authRoutes)
app.use('/api', propertyRoutes)
app.use('/api', paddockRoutes)
app.use('/api', mobRoutes)
app.use('/api', eventRoutes)
app.use('/api', planRoutes)
app.use('/api', dashboardRoutes)
app.use('/api', reportRoutes)

// ── Health check ──
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
