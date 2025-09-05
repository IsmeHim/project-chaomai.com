// backend/router/properties.js

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

// ========= สร้าง slug ให้ปลอดภัย (ไม่ใช้ nanoid) =========
async function buildSafeUniqueSlug(rawTitle) {
  // 1) ลอง slugify ปกติ
  let base = slugify(rawTitle || '', { lower: true, strict: true, locale: 'th', trim: true });

  // 2) ถ้ายังว่าง ลองแทนเว้นวรรคเป็นขีด
  if (!base) base = (rawTitle || '').trim().replace(/\s+/g, '-').toLowerCase();

  // 3) ถ้ายังว่างอีก สร้าง fallback จาก timestamp
  if (!base) base = `p-${Date.now()}`;

  // 4) กันซ้ำใน DB ด้วย suffix -1, -2, ...
  let slug = base;
  let i = 1;
  // ใช้ exists() เร็วกว่า countDocuments()
  while (await Property.exists({ slug })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

// ====== Parse Google Maps URL (ลิงก์ยาว) ======
function parseLatLngFromGoogleUrl(url) {
  if (!url) return null;
  const s = decodeURIComponent(String(url).trim()).replace(/\u2212/g, "-");

  // !3dLAT!4dLNG → พิกัดจริงของสถานที่
  let m = s.match(/!3d(-?\d+(?:\.\d+)?)[^!]*!4d(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  // !2dLNG!3dLAT
  m = s.match(/!2d(-?\d+(?:\.\d+)?)[^!]*!3d(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[2], lng: +m[1] };

  // @lat,lng
  m = s.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: +m[1], lng: +m[2] };

  // q=lat,lng | ll=lat,lng | q=loc:lat,lng
  m = s.match(/[?&](?:q|ll)=(?:loc:)?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  // api=1&query=lat,lng
  m = s.match(/[?&]query=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  // /dir/.../lat,lng
  m = s.match(/\/dir\/[^/]*\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:[/?]|$)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  // daddr=lat,lng | destination=lat,lng | origin=lat,lng
  m = s.match(/[?&](?:daddr|destination|origin)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  return null;
}

// ---------- JSON helpers & amenities normalization ----------
function safeParseJSON(input, fallback = null) {
  if (input == null) return fallback;
  try { return JSON.parse(input); } catch { return fallback; }
}

function normalizeAmenities(a = {}) {
  const wifi = ['none','free','paid'].includes(a?.wifi) ? a.wifi : 'none';
  const parking = ['none','motorcycle','car_and_motorcycle'].includes(a?.parking) ? a.parking : 'none';

  const allowUtils = ['water','electricity','wifi','common_fee'];
  const utilitiesIncluded = Array.isArray(a?.utilitiesIncluded)
    ? a.utilitiesIncluded.filter(u => allowUtils.includes(u))
    : [];

  const f = a?.features || {};
  const features = {
    aircon: !!f.aircon,
    kitchen: !!f.kitchen,
    tv: !!f.tv,
    fridge: !!f.fridge,
    washingMachine: !!f.washingMachine,
    furnished: !!f.furnished,
  };

  return { wifi, parking, utilitiesIncluded, features };
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

    // อนุญาตเฉพาะ short link; ลิงก์ยาวให้ front ใช้ parser เอง
    if (!/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i.test(url)) {
      return res.status(400).json({ message: 'only short Google Maps URLs are supported' });
    }

    // ตาม redirect ไปจนสุด แล้วอ่าน URL สุดท้าย
    const resp = await fetchFn(url, { redirect: 'follow' });
    const finalUrl = resp.url || url;

    const coords = parseLatLngFromGoogleUrl(finalUrl);
    if (!coords || isNaN(coords.lat) || isNaN(coords.lng)) {
      return res.status(422).json({
        message: 'Could not extract coordinates from final URL. Please paste the full Google Maps link or enter lat/lng manually.',
        finalUrl
      });
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

    // รับ amenities จาก multipart ด้วย field 'amenities' (stringified JSON)
    const amenitiesRaw = safeParseJSON(req.body.amenities, null);
    const amenities = normalizeAmenities(amenitiesRaw || {});

    if (!title || !category) {
      return res.status(400).json({ message: 'title & category required' });
    }

    // ใช้ตัวสร้าง slug แบบกันว่าง/กันซ้ำ
    const slug = await buildSafeUniqueSlug(title);

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

    // คำนวณพิกัด
    let coords;
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      coords = [parseFloat(lng), parseFloat(lat)];
    } else {
      const p = parseLatLngFromGoogleUrl(googleMapUrl);
      if (p && !isNaN(p.lat) && !isNaN(p.lng)) coords = [p.lng, p.lat];
    }

    const doc = await Property.create({
      title,
      slug,
      description,
      owner: req.user.id,
      category,
      type: type || null,
      price,
      bedrooms,
      bathrooms,
      area,
      address,
      googleMapUrl,
      location: coords ? { type: 'Point', coordinates: coords } : undefined,
      images,
      amenities,                 // <-- บันทึก amenities
      approvalStatus: 'pending', // 🔰 เข้า workflow อนุมัติ
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error(e);
    if (e?.errors?.slug?.kind === 'required') {
      return res.status(400).json({ message: 'slug is required but missing' });
    }
    if (e?.code === 11000 && e?.keyPattern?.slug) {
      return res.status(409).json({ message: 'slug already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// ====== PUBLIC LIST (หน้าเว็บ) ======
// router.get('/properties', async (req, res) => {
//   const list = await Property.find({
//     status: 'published',
//     isActive: true,
//     approvalStatus: 'approved',
//   })
//     .populate('category', 'name slug')
//     .populate('type', 'name slug')
//     .sort({ createdAt: -1 });

//   res.json(list);
// });
// ====== PUBLIC LIST (หน้าเว็บ) ======
// backend/router/properties.js  (แทนที่ GET /properties เดิม)
router.get('/properties', async (req, res) => {
  const {
    category,     // ObjectId ของหมวด
    type,         // ObjectId ของประเภท
    q,            // ค้นชื่อ
    minPrice,
    maxPrice,
    sort = '-createdAt',   // หรือ 'price' , '-price'
    page = 1,
    pageSize = 24,
  } = req.query;

  const filter = {
    status: 'published',
    isActive: true,
    approvalStatus: 'approved',
  };
  if (category) filter.category = category;
  if (type) filter.type = type;

  //if (q) filter.title = new RegExp(String(q).trim(), 'i');
  // แนะนำ (ครอบหลายฟิลด์)
  if (q) {
    const rx = new RegExp(String(q).trim().replace(/\s+/g, '.*'), 'i');
    filter.$or = [
      { title: rx },
      { address: rx },
      { subdistrict: rx },
      { district: rx },
      { province: rx },
      { description: rx },
    ];
  }
  if (minPrice) filter.price = { ...(filter.price||{}), $gte: Number(minPrice) };
  if (maxPrice) filter.price = { ...(filter.price||{}), $lte: Number(maxPrice) };

  const sortObj = sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, parseInt(pageSize, 10) || 24);
  const skip = (p - 1) * ps;

  const [items, total] = await Promise.all([
    Property.find(filter)
      .populate('category', 'name slug')
      .populate('type', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(ps),
    Property.countDocuments(filter),
  ]);

  res.json({ items, total, page: p, pageSize: ps });
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
  const filter = req.user.role === 'admin' ? {} : { owner: req.user.id };

  const { approvalStatus } = req.query;
  if (approvalStatus && ['pending', 'approved', 'rejected'].includes(approvalStatus)) {
    filter.approvalStatus = approvalStatus;
  }

  const list = await Property.find(filter)
    .populate('owner', 'username name')
    .sort({ createdAt: -1 });

  res.json(list);
});

// ====== UPDATE ======
router.patch(
  '/properties/:id',
  auth,
  ensureOwnerOrAdmin,
  upload.array('images', 10),
  async (req, res) => {
    const doc = await Property.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });

    const isOwner = String(doc.owner) === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Forbidden' });

    const {
      title, description, price, bedrooms, bathrooms, area,
      address, googleMapUrl, category, type, lat, lng, isActive, status,
      removeImages,
      coverFilename, coverNewIndex,
      // admin only
      approvalStatus, approvalReason,
      // 👇 เพิ่มรับ amenities (stringified JSON)
      amenities: amenitiesStr,
    } = req.body;

    // --------- อัปเดตฟิลด์ข้อมูล ---------
    if (title) {
      doc.title = title;
      doc.slug = await buildSafeUniqueSlug(title);
    }
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

    // --------- พิกัด ---------
    let coords;
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      coords = [parseFloat(lng), parseFloat(lat)];
    } else {
      const p = parseLatLngFromGoogleUrl(googleMapUrl);
      if (p && !isNaN(p.lat) && !isNaN(p.lng)) coords = [p.lng, p.lat];
    }
    if (coords) {
      doc.location = { type: 'Point', coordinates: coords };
    } else if (lat === '' && lng === '') {
      doc.location = undefined;
    }

    // --------- ลบรูปเก่า ---------
    let removeList = [];
    if (removeImages) {
      try { removeList = JSON.parse(removeImages); } catch {}
    }
    if (removeList.length) {
      const toRemove = doc.images.filter(img => removeList.includes(img.filename));
      await deleteImages(toRemove);
      doc.images = doc.images.filter(img => !removeList.includes(img.filename));
    }

    // --------- เพิ่มรูปใหม่ ---------
    if (req.files?.length) {
      const start = doc.images.length;
      doc.images.push(...req.files.map((f, i) => ({
        filename: f.filename,
        url: publicUrl(f.filename),
        size: f.size,
        mimetype: f.mimetype,
        isCover: false,
        sortOrder: start + i,
      })));
    }

    // --------- ตั้งรูปปก ---------
    let coverSet = false;
    if (coverFilename) {
      const fname = String(coverFilename);
      doc.images.forEach((im) => { im.isCover = (im.filename === fname); });
      coverSet = doc.images.some((im) => im.isCover);
    } else if (coverNewIndex != null && req.files?.length) {
      const idx = Math.max(0, Math.min(parseInt(coverNewIndex, 10) || 0, req.files.length - 1));
      const picked = req.files[idx]?.filename;
      if (picked) {
        doc.images.forEach((im) => { im.isCover = (im.filename === picked); });
        coverSet = true;
      }
    }
    if (!coverSet && doc.images.length && !doc.images.some((im) => im.isCover)) {
      doc.images[0].isCover = true;
    }

    // --------- อัปเดต amenities (ถ้าส่งมา) ---------
    if (amenitiesStr !== undefined) {
      const amenitiesObj = safeParseJSON(amenitiesStr, null);
      if (amenitiesObj) {
        doc.amenities = normalizeAmenities(amenitiesObj);
      }
    }

    // --------- อนุมัติ (admin เท่านั้น) ---------
    if (isAdmin && approvalStatus && ['pending','approved','rejected'].includes(approvalStatus)) {
      doc.approvalStatus = approvalStatus;
      doc.approvalReason = approvalStatus === 'rejected' ? (approvalReason || '') : '';
      doc.approvedBy = req.user.id;
      doc.approvedAt = new Date();
    }

    // ✅ ถ้าเป็นเจ้าของ (ไม่ใช่แอดมิน) แก้ไขเมื่อไร -> ส่งเข้ารออนุมัติใหม่เสมอ
    if (!isAdmin && isOwner) {
      doc.approvalStatus = 'pending';
      doc.approvalReason = '';
      doc.approvedBy = undefined;
      doc.approvedAt = undefined;
    }

    await doc.save();
    await doc.populate('owner', 'username name');

    res.json(doc);
  }
);

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

// สำหรับเจ้าของ/แอดมิน: อ่านประกาศนี้ได้เสมอ
router.get('/owner/properties/:id', auth, ensureOwnerOrAdmin, async (req, res) => {
  const doc = await Property.findById(req.params.id)
    .populate('owner', 'username name')
    .populate('category', 'name')
    .populate('type', 'name');

  if (!doc) return res.status(404).json({ message: 'Not found' });

  const isOwner = String(doc.owner?._id || doc.owner) === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Forbidden' });

  res.json(doc);
});

module.exports = router;
