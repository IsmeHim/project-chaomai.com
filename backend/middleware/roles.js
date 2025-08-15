module.exports.requireRole = (role) => {
  return (req, res, next) => {
    // ต้องมี middleware auth ก่อนหน้านี้ ที่ set req.user จาก JWT
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
};
