// router/wishlists.js
const express = require('express');
const auth = require('../middleware/auth');
const Wishlist = require('../model/Wishlist');
const Property = require('../model/Property');

const router = express.Router();

// GET — เหมือนเดิม
router.get('/wishlists', auth, async (req, res) => {
  if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });

  const rows = await Wishlist.find({ user: req.user._id })
    .populate({ path: 'property', select: 'title price address images approvalStatus' })
    .sort('-createdAt');

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

// POST — เพิ่ม runValidators + setDefaultsOnInsert + guard
router.post('/wishlists/:propertyId', auth, async (req, res) => {
  if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });
  const { propertyId } = req.params;

  const exists = await Property.exists({ _id: propertyId });
  if (!exists) return res.status(404).json({ message: 'ไม่พบรายการ' });

  await Wishlist.updateOne(
    { user: req.user._id, property: propertyId },
    { $set: { user: req.user._id, property: propertyId } }, // เซ็ตค่าชัดเจน
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json({ ok: true });
});

// DELETE — guard เพิ่ม
router.delete('/wishlists/:propertyId', auth, async (req, res) => {
  if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });
  const { propertyId } = req.params;
  await Wishlist.deleteOne({ user: req.user._id, property: propertyId });
  res.json({ ok: true });
});

module.exports = router;
