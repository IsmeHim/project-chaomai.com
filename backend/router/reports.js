const express = require('express');
const Report = require('../model/Report');
const Property = require('../model/Property');
const { requireRole } = require('../middleware/roles'); // มีแล้ว
const auth = require('../middleware/auth'); // ✅ ใช้ middleware ของคุณ
const router = express.Router();

// ✅ สมมติว่ามี middleware auth ที่ set req.user จาก JWT
// function requireAuth(req, res, next) {
//   if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
//   next();
// }

/** --- [POST] สร้างรายงานโดยผู้ใช้ทั่วไป --- */
router.post('/reports', auth, async (req, res) => {
  try {
    const { propertyId, reason, detail, pageUrl } = req.body || {};
    if (!propertyId || !reason) {
      return res.status(400).json({ message: 'ต้องมี propertyId และ reason' });
    }
    const rpt = await Report.create({
      propertyId,
      reporterId: req.user._id,
      reason, detail: detail || '', pageUrl: pageUrl || ''
    });
    res.json(rpt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'สร้างรายงานไม่สำเร็จ' });
  }
});

/** --- [GET] แอดมินดูรายการรายงาน --- */
router.get('/reports', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status, reason, q } = req.query || {};
    const cond = {};
    if (status && status !== 'all') cond.status = status;
    if (reason && reason !== 'all') cond.reason = reason;

    // ค้นคำ
    const list = await Report.find(cond)
      .sort({ createdAt: -1 })
      .populate('propertyId', 'title address owner images isActive status approvalStatus updatedAt createdAt')
      .populate('reporterId', 'username name email');

    let filtered = list;
    if (q) {
      const rx = new RegExp(String(q).replace(/\s+/g, '.*'), 'i');
      filtered = list.filter(item =>
        rx.test(item?.propertyId?.title || '') ||
        rx.test(item?.propertyId?.address || '') ||
        rx.test(item?.reporterId?.username || '') ||
        rx.test(item?.reporterId?.name || '')
      );
    }
    res.json(filtered);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'ดึงรายงานไม่สำเร็จ' });
  }
});

/** --- [PATCH] แก้สถานะรายงาน (resolve) --- */
router.patch('/reports/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status = 'resolved' } = req.body || {};
    const doc = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'ไม่พบรายการ' });
    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'อัปเดตไม่สำเร็จ' });
  }
});

/** --- [POST] Action: บล็อกประกาศ (isActive:false) --- */
router.post('/reports/:id/block-property', auth, requireRole('admin'), async (req, res) => {
  try {
    const rpt = await Report.findById(req.params.id).populate('propertyId', '_id isActive');
    if (!rpt) return res.status(404).json({ message: 'ไม่พบรายการ' });
    const p = await Property.findByIdAndUpdate(rpt.propertyId._id, { isActive: false }, { new: true });
    // ปิดรายงานพร้อมกัน
    await Report.findByIdAndUpdate(rpt._id, { status: 'resolved' });
    res.json({ ok: true, property: p });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'บล็อกประกาศไม่สำเร็จ' });
  }
});

/** --- [DELETE] Action: ลบประกาศ --- */
// router.delete('/reports/:id/delete-property', auth, requireRole('admin'), async (req, res) => {
//   try {
//     const rpt = await Report.findById(req.params.id).populate('propertyId', '_id');
//     if (!rpt) return res.status(404).json({ message: 'ไม่พบรายการ' });
//     await Property.findByIdAndDelete(rpt.propertyId._id);
//     await Report.findByIdAndUpdate(rpt._id, { status: 'resolved' });
//     res.json({ ok: true });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: 'ลบประกาศไม่สำเร็จ' });
//   }
// });
// router/reports.js

// ... import เดิมทั้งหมด

/** --- [DELETE] Action: ลบประกาศ + ลบรายงานที่เกี่ยวข้องทั้งหมด --- */
router.delete('/reports/:id/delete-property', auth, requireRole('admin'), async (req, res) => {
  try {
    const rpt = await Report.findById(req.params.id).populate('propertyId', '_id');
    if (!rpt) return res.status(404).json({ message: 'ไม่พบรายการ' });

    // ลบประกาศ
    await Property.findByIdAndDelete(rpt.propertyId._id);

    // ลบรายงานทั้งหมดที่อ้างประกาศนี้
    await Report.deleteMany({ propertyId: rpt.propertyId._id });

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'ลบประกาศไม่สำเร็จ' });
  }
});

/** --- [POST] Action: เลิกบล็อกประกาศ (isActive:true) + ปิดรายงาน --- */
router.post('/reports/:id/unblock-property', auth, requireRole('admin'), async (req, res) => {
  try {
    const rpt = await Report.findById(req.params.id).populate('propertyId', '_id isActive');
    if (!rpt) return res.status(404).json({ message: 'ไม่พบรายการ' });

    const p = await Property.findByIdAndUpdate(
      rpt.propertyId._id,
      { isActive: true },
      { new: true }
    );

    // ปิดรายงานนี้ด้วย (กันตกค้าง)
    await Report.findByIdAndUpdate(rpt._id, { status: 'resolved' });

    res.json({ ok: true, property: p });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'เลิกบล็อกไม่สำเร็จ' });
  }
});

/** --- [DELETE] ลบรายงานเฉพาะรายการ (ไม่ยุ่งประกาศ) --- */
router.delete('/reports/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const rpt = await Report.findByIdAndDelete(req.params.id);
    if (!rpt) return res.status(404).json({ message: 'ไม่พบรายการ' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'ลบรายงานไม่สำเร็จ' });
  }
});


module.exports = router;
