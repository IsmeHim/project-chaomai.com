const express = require('express');
const User = require('../model/User');
const { requireRole } = require('../middleware/roles');
const auth = require('../middleware/auth'); // ของโปรเจกต์คุณ
const router = express.Router();

// --- sort helper ---
const ALLOWED_SORT = new Set(['createdAt','username','email','role','status','verified']);
function parseSort(sortStr = '-createdAt') {
  let s = String(sortStr || '').trim();
  let dir = 1;
  if (s.startsWith('-')) { dir = -1; s = s.slice(1); }
  if (!ALLOWED_SORT.has(s)) s = 'createdAt';
  return { [s]: dir };
}

// GET /api/users
// supports: q, role=all|user|owner|admin, status=all|active|suspended,
// verified=true|false (or verify=verified|unverified|all), sort, page, pageSize
router.get('/users', auth, requireRole('admin'),  async (req, res) => {
  try {
    const {
      q = '',
      role = 'all',
      status = 'all',
      verified: verifiedRaw,
      verify: verifyRaw,
      sort = '-createdAt',
      page = 1,
      pageSize = 10,
    } = req.query;

    const filter = {};
    if (role !== 'all') filter.role = role;
    if (status !== 'all') filter.status = status;

    // รองรับทั้ง verified=bool และ verify=verified|unverified|all
    let v = verifiedRaw;
    if (verifyRaw) {
      if (verifyRaw === 'verified') v = 'true';
      else if (verifyRaw === 'unverified') v = 'false';
      else v = 'all';
    }
    if (v === 'true' || v === true) filter.verified = true;
    else if (v === 'false' || v === false) filter.verified = false;

    if (q && String(q).trim()) {
      const regex = new RegExp(String(q).trim(), 'i');
      filter.$or = [{ name: regex }, { username: regex }, { email: regex }, { phone: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 10));

    const [total, docs] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort(parseSort(sort))
        .skip((pageNum - 1) * sizeNum)
        .limit(sizeNum)
        .lean(),
    ]);

    const items = docs.map(u => ({
      id: String(u._id),
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: u.role,                 // ✅ เพิ่มให้ UI ใช้
      listings: u.listings ?? 0,
      createdAt: u.createdAt,       // ✅ สำหรับ UsersManager
      joinedAt: u.createdAt?.toISOString?.().slice(0, 10), // ✅ คงไว้ให้ OwnersManager
      status: u.status,
      verified: !!u.verified,
    }));

    const totalPages = Math.max(1, Math.ceil(total / sizeNum));
    // ✅ ใส่ทั้ง items และ data เพื่อเข้ากันได้สองหน้า
    res.json({ items, data: items, total, page: pageNum, pageSize: sizeNum, totalPages });
  } catch (err) {
    console.error('GET /users error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ PATCH รวม: /api/users/:id  (รับ role/status/verified/name/phone)
router.patch('/users/:id', auth, async (req, res) => {
  try {
     const isAdmin = req.user.role === 'admin';
    const isSelf  = req.user.id === req.params.id;

    // สิทธิ์:
    // - admin: แก้ได้ทุกฟิลด์ใน allowAll
    // - self : แก้ได้แค่ name/phone
    if (!isAdmin && !isSelf) return res.status(403).json({ message: 'Forbidden' });

    const allowAll  = ['role', 'status', 'verified', 'name', 'phone'];
    const allowSelf = ['name', 'phone'];
    const allow = isAdmin ? allowAll : allowSelf;

    const update = {};
    for (const k of allow) if (k in req.body) update[k] = req.body[k];

    if ('role' in update && !['user','owner','admin'].includes(update.role))
      return res.status(400).json({ message: 'Invalid role' });
    if ('status' in update && !['active','suspended'].includes(update.status))
      return res.status(400).json({ message: 'Invalid status' });
    if ('verified' in update) update.verified = Boolean(update.verified);

    const u = await User.findByIdAndUpdate(req.params.id, update, { new: true, lean: true });
    if (!u) return res.status(404).json({ message: 'Not found' });

    return res.json({
      id: String(u._id),
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: u.role,
      listings: u.listings ?? 0,
      createdAt: u.createdAt,
      joinedAt: u.createdAt?.toISOString?.().slice(0,10),
      status: u.status,
      verified: !!u.verified,
    });
  } catch (e) {
    console.error('PATCH /users/:id error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// (คง endpoint เดิมไว้ เพื่อ OwnersManager ใช้งานต่อ)
router.patch('/users/:id/status', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'ok' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:id/verify', auth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.verified = !user.verified;
    await user.save();
    res.json({ message: 'ok', verified: user.verified });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/users/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const r = await User.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
