const express = require('express');
const auth = require('../middleware/auth');
const Wishlist = require('../model/Wishlist');
const Property = require('../model/Property');

const router = express.Router();

/**
 * GET /api/wishlists
 * คืนรายการที่ถูกใจของ user ปัจจุบัน
 */
router.get('/wishlists', auth, async (req, res) => {
  const rows = await Wishlist.find({ user: req.user._id })
    .populate({
      path: 'property',
      select: 'title price address images approvalStatus', // เลือก field ที่ต้องใช้
    })
    .sort('-createdAt');

  // map ให้ client ใช้ง่าย
  const items = rows
    .filter(w => !!w.property)
    .map(w => {
      const p = w.property;
      const imgs = Array.isArray(p.images) ? p.images : [];
      const cover = imgs.find(im => im.isCover) || imgs[0];
      return {
        id: String(p._id),
        title: p.title,
        price: Number(p.price || 0),
        address: p.address || '-',
        image: cover?.url || null,
        approved: p.approvalStatus === 'approved',
        wishedAt: w.createdAt,
      };
    });

  res.json({ items });
});

/**
 * POST /api/wishlists/:propertyId
 * เพิ่มเข้า wishlist (idempotent: ถ้ามีอยู่แล้วจะตอบ 200 เฉย ๆ)
 */
router.post('/wishlists/:propertyId', auth, async (req, res) => {
  const { propertyId } = req.params;
  // ตรวจว่ามี property จริง
  const exists = await Property.exists({ _id: propertyId });
  if (!exists) return res.status(404).json({ message: 'ไม่พบรายการ' });

  await Wishlist.updateOne(
    { user: req.user._id, property: propertyId },
    { $setOnInsert: { user: req.user._id, property: propertyId } },
    { upsert: true }
  );

  res.json({ ok: true });
});

/**
 * DELETE /api/wishlists/:propertyId
 * เอาออกจาก wishlist (idempotent: ไม่มีอยู่ก็ถือว่าสำเร็จ)
 */
router.delete('/wishlists/:propertyId', auth, async (req, res) => {
  const { propertyId } = req.params;
  await Wishlist.deleteOne({ user: req.user._id, property: propertyId });
  res.json({ ok: true });
});

module.exports = router;
