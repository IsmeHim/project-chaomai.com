// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.header('x-auth-token');

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // รองรับทุกฟิลด์ที่เคยใช้ใน token
    const id = decoded.id || decoded.userId || decoded._id;
    req.user = { id: String(id), role: decoded.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
