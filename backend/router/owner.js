// backend/router/owner.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const User = require('../model/User');
const Property = require('../model/Property');

const router = express.Router();

// ===== Multer config: uploads/profile =====
const PROFILE_DIR = path.join(process.cwd(), 'uploads', 'profile');
fs.mkdirSync(PROFILE_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PROFILE_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safe = `${req.user.id}-${Date.now()}${ext}`;
    cb(null, safe);
  },
});
function fileFilter(req, file, cb) {
  const ok = /image\/(png|jpe?g|webp|gif|svg)/i.test(file.mimetype || '');
  if (!ok) return cb(new Error('Invalid image type'), false);
  cb(null, true);
}
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ===== helpers =====
function toPublicProfilePath(filename) {
  // เก็บลง DB เป็น path สาธารณะ เช่น '/uploads/profile/xxx.png'
  return `/uploads/profile/${filename}`;
}
async function uniqueCheck(model, id, { email, username }) {
  if (email) {
    const exist = await model.findOne({ email, _id: { $ne: id } }).lean();
    if (exist) throw new Error('อีเมลนี้ถูกใช้แล้ว');
  }
  if (username) {
    const exist = await model.findOne({ username, _id: { $ne: id } }).lean();
    if (exist) throw new Error('ชื่อผู้ใช้นี้ถูกใช้แล้ว');
  }
}
async function removeOldFileIfExists(p) {
  if (!p) return;
  const full = path.join(process.cwd(), p.replace(/^\//, ''));
  try { fs.unlinkSync(full); } catch { /* ignore */ }
}

// =========================================================
//  GET /api/owner/settings/me
//  - อ่านข้อมูลเจ้าของปัจจุบัน (ใช้โหลดหน้า Settings)
// =========================================================
router.get('/owner/settings/me', auth, requireRole('owner'), async (req, res) => {
  const me = await User.findById(req.user.id).lean();
  if (!me) return res.status(404).json({ message: 'Not found' });
  res.json({
    id: String(me._id),
    username: me.username,
    email: me.email,
    name: me.name || '',
    phone: me.phone || '',
    role: me.role,
    profile: me.profile || null,

    // เพิ่มฟิลด์ที่หน้า OwnerSettings ใช้
    about: me.about || '',
    facebookUrl: me.facebookUrl || '',
    lineId: me.lineId || '',
    address: me.address || '',
    company: me.company || '',
  });
});

// =========================================================
//  PATCH /api/owner/settings/profile
//  - อัปเดตโปรไฟล์ (รวมฟิลด์ owner เฉพาะ)
//  body: { username, email, name, phone, about, facebookUrl, lineId, address, company }
// =========================================================
router.patch('/owner/settings/profile', auth, requireRole('owner'), async (req, res) => {
  try {
    const allow = [
      'username', 'email', 'name', 'phone',
      'about', 'facebookUrl', 'lineId', 'address', 'company',
    ];
    const update = {};
    for (const k of allow) if (k in req.body) update[k] = String(req.body[k] ?? '').trim();

    await uniqueCheck(User, req.user.id, { email: update.email, username: update.username });

    const u = await User.findByIdAndUpdate(req.user.id, update, { new: true, lean: true });
    if (!u) return res.status(404).json({ message: 'Not found' });

    res.json({
      id: String(u._id),
      username: u.username,
      email: u.email,
      name: u.name || '',
      phone: u.phone || '',
      role: u.role,
      profile: u.profile || null,
      about: u.about || '',
      facebookUrl: u.facebookUrl || '',
      lineId: u.lineId || '',
      address: u.address || '',
      company: u.company || '',
    });
  } catch (e) {
    console.error('PATCH /owner/settings/profile', e);
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
});

// =========================================================
//  PATCH /api/owner/settings/password
//  body: { currentPw, newPw }
// =========================================================
router.patch('/owner/settings/password', auth, requireRole('owner'), async (req, res) => {
  const { currentPw, newPw } = req.body || {};
  if (!currentPw || !newPw) return res.status(400).json({ message: 'กรอกข้อมูลให้ครบ' });

  const me = await User.findById(req.user.id);
  if (!me) return res.status(404).json({ message: 'Not found' });

  const ok = await bcrypt.compare(String(currentPw), String(me.password));
  if (!ok) return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });

  const salt = await bcrypt.genSalt(10);
  me.password = await bcrypt.hash(String(newPw), salt);
  await me.save();

  res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
});

// =========================================================
//  POST /api/owner/settings/profile/avatar
//  form-data: avatar (file)
// =========================================================
router.post('/owner/settings/profile/avatar', auth, requireRole('owner'), upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'กรุณาอัปโหลดรูป' });

  const me = await User.findById(req.user.id);
  if (!me) return res.status(404).json({ message: 'Not found' });

  await removeOldFileIfExists(me.profile);

  const pub = toPublicProfilePath(req.file.filename);
  me.profile = pub;
  await me.save();

  res.json({ message: 'อัปโหลดสำเร็จ', profile: pub });
});

// =========================================================
//  DELETE /api/owner/settings/profile/avatar
// =========================================================
router.delete('/owner/settings/profile/avatar', auth, requireRole('owner'), async (req, res) => {
  const me = await User.findById(req.user.id);
  if (!me) return res.status(404).json({ message: 'Not found' });

  await removeOldFileIfExists(me.profile);
  me.profile = null;
  await me.save();

  res.json({ message: 'ลบรูปโปรไฟล์แล้ว', profile: null });
});


// ====== PUBLIC: อ่านโปรไฟล์สาธารณะ ======
// GET /api/public/owners/:slug
router.get('/public/owners/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const query = /^[0-9a-fA-F]{24}$/.test(slug) ? { _id: slug } : { username: slug };

    const user = await User.findOne(query).select(
      'username name phone lineId facebookUrl company address about profile verified createdAt'
      // ตัด 'listings' ออกจาก select เพื่อให้ค่าไปจากการนับจริง
    ).lean();

    if (!user) return res.status(404).json({ message: 'Owner not found' });

    // ✅ นับจำนวนประกาศจริงที่เผยแพร่/ใช้งาน/อนุมัติแล้ว
    const filter = {
      owner: user._id,
      status: 'published',
      isActive: true,
      approvalStatus: 'approved',
    };
    const listingsCount = await Property.countDocuments(filter);

    res.json({
      id: String(user._id),
      username: user.username,
      name: user.name || user.username,
      phone: user.phone || '',
      lineId: user.lineId || '',
      facebookUrl: user.facebookUrl || '',
      company: user.company || '',
      address: user.address || '',
      about: user.about || '',
      profile: user.profile || null,
      verified: !!user.verified,
      joinedAt: user.createdAt,

      // ✅ ใช้ค่าที่นับจริง
      listings: listingsCount,
    });
  } catch (e) {
    console.error('GET /public/owners/:slug', e);
    res.status(500).json({ message: 'Internal error' });
  }
});


// ====== PUBLIC: ลิสต์ประกาศของเจ้าของ ======
// GET /api/public/owners/:slug/listings?page=1&pageSize=24&sort=-createdAt
router.get('/public/owners/:slug/listings', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    const query = /^[0-9a-fA-F]{24}$/.test(slug) ? { _id: slug } : { username: slug };
    const owner = await User.findOne(query).select('_id').lean();
    if (!owner) return res.status(404).json({ message: 'Owner not found' });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.max(1, Math.min(48, parseInt(req.query.pageSize, 10) || 24));
    const sort = String(req.query.sort || '-createdAt');
    const sortObj = sort.startsWith('-')
      ? { [sort.slice(1)]: -1 }
      : { [sort]: 1 };

    const filter = {
      owner: owner._id,
      status: 'published',
      isActive: true,
      approvalStatus: 'approved',
    };

    const [items, total] = await Promise.all([
      Property.find(filter)
        .populate('category', 'name slug')
        .populate('type', 'name slug')
        .sort(sortObj)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Property.countDocuments(filter),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (e) {
    console.error('GET /public/owners/:slug/listings', e);
    res.status(500).json({ message: 'Internal error' });
  }
});



module.exports = router;
