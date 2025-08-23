const express = require('express');
const User = require('../model/User');
const router = express.Router();

// GET /api/users?role=owner&q=&status=active|suspended|all&verify=verified|unverified|all&page=1&pageSize=8
router.get('/users', async (req, res) => {
  try {
    const {
      role = 'owner',
      q = '',
      status = 'all',
      verify = 'all',
      page = 1,
      pageSize = 8,
    } = req.query;

    const filter = {};
    if (role !== 'all') filter.role = role;

    // สถานะ
    if (status !== 'all') filter.status = status;

    // ยืนยันตัวตน
    if (verify === 'verified') filter.verified = true;
    if (verify === 'unverified') filter.verified = false;

    // ค้นหาแบบ OR หลายฟิลด์
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { name: regex },
        { username: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 8));

    const [total, data] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 }) // ใหม่สุดก่อน
        .skip((pageNum - 1) * sizeNum)
        .limit(sizeNum)
        .lean()
    ]);

    const totalPages = Math.max(1, Math.ceil(total / sizeNum));

    // map ให้ field ตรงกับ front
    const mapped = data.map(u => ({
      id: String(u._id),
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      listings: u.listings ?? 0,
      joinedAt: u.createdAt?.toISOString().slice(0,10),
      status: u.status,
      verified: !!u.verified,
    }));

    res.json({ data: mapped, total, page: pageNum, pageSize: sizeNum, totalPages });
  } catch (err) {
    console.error('GET /users error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH สลับ/ตั้งค่าสถานะ
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'active' | 'suspended'
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'ok' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH สลับ verified
router.patch('/users/:id/verify', async (req, res) => {
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

// DELETE ผู้ใช้ (ลบเจ้าของ)
router.delete('/users/:id', async (req, res) => {
  try {
    const r = await User.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
