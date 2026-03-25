const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not logged in.' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload // { userId, role, propertyId }
    next()
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' })
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' })
  }
  next()
}

// Graziers can only access their own property.
// propertyId comes from JWT — never from the URL.
function requirePropertyAccess(req, res, next) {
  if (req.user.role === 'admin') return next()
  const requestedId = req.params.propertyId || req.params.id
  if (requestedId && requestedId !== req.user.propertyId) {
    return res.status(403).json({ error: 'Access denied.' })
  }
  next()
}

module.exports = { requireAuth, requireAdmin, requirePropertyAccess }
