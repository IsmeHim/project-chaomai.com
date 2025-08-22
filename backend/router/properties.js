// backend/router/properties.js
// ⬆️ ปรับชื่อไฟล์ตามโปรเจกต์ของคุณ (เช่น router/index.js) ได้เลย

const express = require('express');
const auth = require('../middleware/auth');
const { upload, UPLOAD_ROOT } = require('../middleware/upload');
const Property = require('../model/Property');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// ใช้ fetch ได้ทั้ง Node18+ หรือ fallback node-fetch
const fetchFn = global.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

const ensureOwnerOrAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role === 'owner' || req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Forbidden' });
};

const publicUrl = (filename) => `/uploads/properties/${filename}`;

// ====== Parse Google Maps URL (ยาว) ======
function parseLatLngFromGoogleUrl(url) {
  if (!url) return null;
  const s = decodeURIComponent(String(url).trim()).replace(/\u2212/g, "-");

  let m = s.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: +m[1], lng: +m[2] };

  m = s.match(/[?&](?:q|ll)=(?:loc:)?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  m = s.match(/[?&]query=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  m = s.match(/\/dir\/[^/]*\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:[/?]|$)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  m = s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  m = s.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[2], lng: +m[1] };

  m = s.match(/[?&](?:daddr|destination|origin)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  return null;
}

async function deleteImages(files = []) {
  await Promise.all(
    files.map((img) =>
      fs.promises.unlink(path.join(UPLOAD_ROOT, img.filename)).catch(() => {})
    )
  );
}

// ====== NEW: /utils/expand-gmaps — รองรับลิงก์สั้น maps.app.goo.gl ======
router.get('/utils/expand-gmaps', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'url required' });
    if (!/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i.test(url)) {
      return res.status(400).json({ message: 'only short Google Maps URLs are supported' });
    }
    const resp = await fetchFn(url, { redirect: 'follow' });
    const finalUrl = resp.url || url;

    const coords = parseLatLngFromGoogleUrl(finalUrl);
    if (!coords) {
      return res.status(422).json({ message: 'Could not extract coordinates from final URL', finalUrl });
    }
    res.json({ finalUrl, ...coords });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ====== CREATE ======
router.post('/properties', auth, ensureOwnerOrAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const {
      title, description, price, bedrooms, bathrooms, area,
      address, googleMapUrl, category, type, lat, lng
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: 'title & category required' });
    }

    const slug = slugify(title, { lower: true, strict: true, locale: 'th' });

    // ใช้ coverIndex จาก body
    let coverIdx = parseInt(req.body.coverIndex, 10);
    const filesCount = (req.files || []).length;
    if (!Number.isInteger(coverIdx)) coverIdx = 0;
    if (filesCount > 0) {
      coverIdx = Math.max(0, Math.min(coverIdx, filesCount - 1));
    } else {
      coverIdx = -1; // ไม่มีไฟล์
    }

    const images = (req.files || []).map((f, idx) => ({
      filename: f.filename,
      url: publicUrl(f.filename),
      size: f.size,
      mimetype: f.mimetype,
      isCover: idx === coverIdx,
      sortOrder: idx,
    }));

    let coords;
    if (lat && lng) coords = [parseFloat(lng), parseFloat(lat)];
    else {
      const p = parseLatLngFromGoogleUrl(googleMapUrl);
      if (p) coords = [p.lng, p.lat];
    }

    const doc = await Property.create({
      title, slug, description,
      owner: req.user.id,
      category,
      type: type || null,
      price, bedrooms, bathrooms, area,
      address, googleMapUrl,
      location: coords ? { type: 'Point', coordinates: coords } : undefined,
      images,
      // 🔰 ให้เข้า workflow อนุมัติ
      approvalStatus: 'pending',
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ====== PUBLIC LIST (หน้าเว็บ) ======
router.get('/properties', async (req, res) => {
  // สำหรับ public page: โชว์เฉพาะที่เผยแพร่/active/approved
  const list = await Property.find({
    status: 'published',
    isActive: true,
    approvalStatus: 'approved',
  })
    .populate('category', 'name slug')
    .populate('type', 'name slug')
    .sort({ createdAt: -1 });

  res.json(list);
});

// ====== PUBLIC DETAIL ======
router.get('/properties/:id', async (req, res) => {
  const doc = await Property.findById(req.params.id)
    .populate('owner', 'username name')
    .populate('category', 'name slug')
    .populate('type', 'name slug');
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

// ====== OWNER/ADMIN LIST ======
router.get('/owner/properties', auth, ensureOwnerOrAdmin, async (req, res) => {
  // owner เห็นของตัวเอง / admin เห็นทั้งหมด
  const filter = req.user.role === 'admin' ? {} : { owner: req.user.id };

  const { approvalStatus } = req.query;
  if (approvalStatus && ['pending', 'approved', 'rejected'].includes(approvalStatus)) {
    filter.approvalStatus = approvalStatus;
  }

  const list = await Property.find(filter)
    .populate('owner', 'username name') // ✅ เพื่อให้ชื่อเจ้าของแสดง
    .sort({ createdAt: -1 });

  res.json(list);
});

// ====== UPDATE ======
router.patch('/properties/:id', auth, ensureOwnerOrAdmin, upload.array('images', 10), async (req, res) => {
  const doc = await Property.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const isOwner = String(doc.owner) === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Forbidden' });

  const {
    title, description, price, bedrooms, bathrooms, area,
    address, googleMapUrl, category, type, lat, lng, isActive, status,
    removeImages,
    // ✅ เฉพาะแอดมินเท่านั้น
    approvalStatus, approvalReason
  } = req.body;

  if (title) { doc.title = title; doc.slug = slugify(title, { lower: true, strict: true, locale: 'th' }); }
  if (description !== undefined) doc.description = description;
  if (price !== undefined) doc.price = price;
  if (bedrooms !== undefined) doc.bedrooms = bedrooms;
  if (bathrooms !== undefined) doc.bathrooms = bathrooms;
  if (area !== undefined) doc.area = area;
  if (address !== undefined) doc.address = address;
  if (googleMapUrl !== undefined) doc.googleMapUrl = googleMapUrl;
  if (category) doc.category = category;
  if (type !== undefined) doc.type = type || null;
  if (isActive !== undefined) doc.isActive = isActive;
  if (status !== undefined) doc.status = status;

  // พิกัด
  let coords;
  if (lat && lng) coords = [parseFloat(lng), parseFloat(lat)];
  else {
    const p = parseLatLngFromGoogleUrl(googleMapUrl);
    if (p) coords = [p.lng, p.lat];
  }
  if (coords) doc.location = { type: 'Point', coordinates: coords };

  // ลบรูป
  let removeList = [];
  if (removeImages) {
    try { removeList = JSON.parse(removeImages); } catch {}
  }
  if (removeList.length) {
    const toRemove = doc.images.filter(img => removeList.includes(img.filename));
    await deleteImages(toRemove);
    doc.images = doc.images.filter(img => !removeList.includes(img.filename));
  }

  // เพิ่มรูปใหม่
  if (req.files?.length) {
    const start = doc.images.length;
    doc.images.push(...req.files.map((f, i) => ({
      filename: f.filename,
      url: publicUrl(f.filename),
      size: f.size,
      mimetype: f.mimetype,
      isCover: start === 0 && i === 0 ? true : false,
      sortOrder: start + i,
    })));
  }

  // ✅ เปลี่ยนสถานะอนุมัติได้เฉพาะแอดมิน
  if (isAdmin && approvalStatus && ['pending','approved','rejected'].includes(approvalStatus)) {
    doc.approvalStatus = approvalStatus;
    doc.approvalReason = approvalStatus === 'rejected' ? (approvalReason || '') : '';
    doc.approvedBy = req.user.id;
    doc.approvedAt = new Date();
  }

  await doc.save();

  // เติม owner ให้เสมอ (สำหรับหน้าอนุมัติ)
  await doc.populate('owner', 'username name');

  res.json(doc);
});

// ====== DELETE ======
router.delete('/properties/:id', auth, ensureOwnerOrAdmin, async (req, res) => {
  const doc = await Property.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const isOwner = String(doc.owner) === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Forbidden' });

  await deleteImages(doc.images || []);
  await doc.deleteOne();
  res.json({ message: 'Deleted' });
});

module.exports = router;
