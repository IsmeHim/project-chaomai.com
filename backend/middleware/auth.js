// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../model/User');

module.exports = async function auth(req, res, next) {
  // รับได้ทั้ง Authorization: Bearer <token> และ x-auth-token
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.header('x-auth-token') || '');

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id || decoded.userId || decoded._id;

    // 🔎 ดึงผู้ใช้ “สดๆ” จาก DB เพื่อเช็คสถานะล่าสุดทุกครั้ง
    // เลือกเฉพาะฟิลด์ที่ต้องใช้ จะได้เร็วขึ้น
    const user = await User.findById(id).select('_id role username status').lean();
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    // ⛔ บล็อกถ้าบัญชีถูกระงับ
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' });
    }

    // ผูก user ลง req ให้ route อื่นใช้ต่อ
    req.user = {
      _id: String(user._id),  // สำหรับโค้ดที่ใช้ _id (เช่นเวอร์ชันเดิมของ wishlists router)
      id: String(user._id),
      role: user.role,
      username: user.username,
      status: user.status,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
