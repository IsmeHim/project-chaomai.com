// backend/middleware/auth.js
const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const token = bearer || req.header('x-auth-token') // รองรับทั้งสองแบบ

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // รองรับหลายรูปแบบ payload ที่เคยเซ็นไว้
    const id = decoded.id || decoded.userId || decoded._id
    req.user = { id, role: decoded.role }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
