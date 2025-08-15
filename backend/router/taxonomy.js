const express = require('express');
const slugify = require('slugify');
const Category = require('../model/Category');
const PropertyType = require('../model/PropertyType');
const { requireRole } = require('../middleware/roles');
const auth = require('../middleware/auth'); // ของโปรเจกต์คุณ

const router = express.Router();

const toSlug = (name) =>
  slugify(name, { lower: true, strict: true, locale: 'th' }) || name;

// ---------- Category ----------
router.get('/categories', async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const filter = q ? { name: new RegExp(q, 'i'), isActive: true  } : { isActive: true };
    const list = await Category.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/categories', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, icon, isActive = true } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name required' });

    const slug = toSlug(name);
    const exists = await Category.findOne({ $or: [{ name }, { slug }] });
    if (exists) return res.status(409).json({ message: 'Category exists' });

    const doc = await Category.create({ name, slug, icon, isActive });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/categories/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, icon, isActive } = req.body;
    const update = {};
    if (name) { update.name = name; update.slug = toSlug(name); }
    if (icon !== undefined) update.icon = icon;
    if (isActive !== undefined) update.isActive = isActive;

    const doc = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/categories/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await PropertyType.deleteMany({ category: req.params.id }); // ลบประเภทใต้หมวดด้วย (ถ้าต้องการ)
    const del = await Category.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ แอดมินดูหมวดทั้งหมด (ไม่กรอง isActive)
router.get('/categories/all', auth, requireRole('admin'), async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const filter = q ? { name: new RegExp(q, 'i') } : {};
    const list = await Category.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});


// ---------- Property Types ----------
router.get('/types', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const list = await PropertyType.find(filter).populate('category', 'name slug').sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/types', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, category, isActive = true } = req.body;
    if (!name?.trim() || !category) return res.status(400).json({ message: 'Name and category required' });

    const slug = toSlug(name);
    const exists = await PropertyType.findOne({ name, category });
    if (exists) return res.status(409).json({ message: 'Type exists in this category' });

    const doc = await PropertyType.create({ name, slug, category, isActive });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/types/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, category, isActive } = req.body;
    const update = {};
    if (name) { update.name = name; update.slug = toSlug(name); }
    if (category) update.category = category;
    if (isActive !== undefined) update.isActive = isActive;

    const doc = await PropertyType.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/types/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const del = await PropertyType.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
