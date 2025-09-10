// backend/router/admin.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const User = require('../model/User');

const router = express.Router();

// ===== Multer config: uploads/profile =====
const PROFILE_DIR = path.join(process.cwd(), 'uploads', 'profile');

// ensure dir
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

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ===== helpers =====
function toPublicProfilePath(filename) {
  // เก็บลง DB เป็นพาธสาธารณะ เช่น '/uploads/profile/xxx.png'
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
  // p เป็น '/uploads/profile/xxx.png'
  const full = path.join(process.cwd(), p.replace(/^\//, ''));
  try { fs.unlinkSync(full); } catch { /* ignore */ }
}

// =========================================================
//  GET /api/admin/settings/me
//  - อ่านข้อมูลผู้ใช้ปัจจุบัน (ใช้ในหน้า Settings)
// =========================================================
router.get('/admin/settings/me', auth, requireRole('admin'), async (req, res) => {
  const me = await User.findById(req.user.id).lean();
  if (!me) return res.status(404).json({ message: 'Not found' });
  res.json({
    id: String(me._id),
    username: me.username,
    email: me.email,
    name: me.name || '',
    phone: me.phone || '',
    role: me.role,
    profile: me.profile || null, // รูปโปรไฟล์ (ถ้ามี)
  });
});

// =========================================================
//  PATCH /api/admin/settings/profile
//  - อัปเดตโปรไฟล์ (ชื่อ, เบอร์, อีเมล, ยูสเซอร์เนม)
// =========================================================
router.patch('/admin/settings/profile', auth, requireRole('admin'), async (req, res) => {
  try {
    const allow = ['name', 'phone', 'email', 'username'];
    const update = {};
    for (const k of allow) if (k in req.body) update[k] = String(req.body[k] || '').trim();

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
    });
  } catch (e) {
    console.error('PATCH /settings/profile', e);
    res.status(400).json({ message: e.message || 'Bad Request' });
  }
});

// =========================================================
/*  PATCH /api/admin/settings/password
    body: { currentPw, newPw }
    - เทียบ currentPw กับ hash เดิม
    - เซ็ต new hash ด้วย bcrypt
*/
// =========================================================
router.patch('/admin/settings/password', auth, requireRole('admin'), async (req, res) => {
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
/*  POST /api/admin/settings/profile/avatar
    - อัปโหลดไฟล์รูป (field name: 'avatar')
    - ลบไฟล์เก่าถ้ามี
*/
// =========================================================
router.post('/admin/settings/profile/avatar', auth, requireRole('admin'), upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'กรุณาอัปโหลดรูป' });

  const me = await User.findById(req.user.id);
  if (!me) return res.status(404).json({ message: 'Not found' });

  // ลบรูปเก่า
  await removeOldFileIfExists(me.profile);

  // เก็บ path ใหม่
  const pub = toPublicProfilePath(req.file.filename);
  me.profile = pub;
  await me.save();

  res.json({ message: 'อัปโหลดสำเร็จ', profile: pub });
});

// =========================================================
/*  DELETE /api/admin/settings/profile/avatar
    - ลบไฟล์รูปโปรไฟล์ + เคลียร์ฟิลด์
*/
// =========================================================
router.delete('/admin/settings/profile/avatar', auth, requireRole('admin'), async (req, res) => {
  const me = await User.findById(req.user.id);
  if (!me) return res.status(404).json({ message: 'Not found' });

  await removeOldFileIfExists(me.profile);
  me.profile = null;
  await me.save();

  res.json({ message: 'ลบรูปโปรไฟล์แล้ว', profile: null });
});

module.exports = router;
