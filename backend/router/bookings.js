// router/bookings.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../model/Booking');
const Property = require('../model/Property');
const auth = require('../middleware/auth');

/** --- ตัวอย่าง middleware auth แบบง่าย ---
 * สมมุติว่าคุณมีระบบ auth เดิมอยู่แล้ว (req.user)
 * ถ้ายังไม่มี ให้แทนด้วยการเช็ค token ตามระบบของคุณ
 */

/** คำนวณราคาแบบต่อ "วัน" จากราคาต่อเดือนของ Property:
 *  ratePerDay = pricePerMonth / 30, ปัดขึ้นทั้งจำนวนวัน (ขั้นต่ำ 1 วัน)
 */
function calcTotal(pricePerMonth, start, end) {
  const ms = Math.max(new Date(end) - new Date(start), 0);
  const days = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  const perDay = Number(pricePerMonth || 0) / 30;
  return Math.round(perDay * days);
}

// POST /api/bookings  => สร้างคำขอเช่า
router.post('/bookings', auth, async (req, res) => {
  try {
    const { propertyId, startDate, endDate, note, phone } = req.body;
    if (!propertyId || !startDate) {
      return res.status(400).json({ message: 'กรอกข้อมูลไม่ครบ (อย่างน้อยต้องมีวันเริ่ม)' });
    }

    // ตรวจความยาวเบอร์แบบกว้าง ๆ (รองรับไทย 9–11 หลัก หรือมี + นำหน้า)
    if (!phone || !/^\+?\d{9,15}$/.test(String(phone).replace(/\s|-/g,''))) {
      return res.status(400).json({ message: 'โปรดกรอกเบอร์โทรที่ถูกต้อง' });
    }

    const prop = await Property.findById(propertyId).populate('owner');
    if (!prop) return res.status(404).json({ message: 'ไม่พบทรัพย์' });

    // กัน self-booking
    if (String(prop.owner?._id || prop.owner) === String(req.user.id)) {
      return res.status(400).json({ message: 'เจ้าของประกาศไม่สามารถเช่าของตนเองได้' });
    }

    // ตรวจทับช่วงวันที่กับรายการที่ยัง active
    const start = new Date(startDate);
    const end   = endDate ? new Date(endDate) : null;

    // ตรวจทับช่วงวันที่กับรายการที่ยัง active
    // กรณีผู้จอง "ไม่กำหนดวันสิ้นสุด" => ทับกับงานที่ openEnded อยู่แล้ว หรือ
    // งานที่มี endDate >= start
    // กรณีมี endDate => ใช้สูตรช่วงทับ + เผื่อชนกับงาน openEnded
    const activeStatuses = ['pending', 'approved', 'paid'];
    const overlap = await Booking.findOne({
      property: prop._id,
      status: { $in: activeStatuses },
      $or: end
        ? [
            { startDate: { $lte: end }, endDate: { $gte: start } }, // ช่วงทับปกติ
            { openEnded: true, startDate: { $lte: end } }           // อีกฝั่งเปิดปลาย
          ]
        : [
            { openEnded: true },                    // มีงานเปิดปลายอยู่แล้ว
            { endDate: { $gte: start } }            // งานมีปลายแต่ยังลากเลยวันเริ่มใหม่
          ],
    });
    if (overlap) {
      return res.status(409).json({ message: 'ช่วงเวลานี้ถูกจองแล้ว กรุณาเลือกช่วงอื่น' });
    }

    const total = end ? calcTotal(prop.price, startDate, endDate) : 0;

    const doc = await Booking.create({
      property: prop._id,
      owner: prop.owner?._id || prop.owner,
      renter: req.user.id,
      renterPhone: String(phone).replace(/\s|-/g,''),
      startDate: start,
      endDate: end || undefined,
      openEnded: !end,
      status: 'pending',
      currency: 'THB',
      pricePerMonth: prop.price || 0,
      totalAmount: total,
      monthlyEstimate: prop.price || 0,
      note: note || ''
    });

    res.json(doc);
  } catch (err) {
    console.error('create booking error', err);
    res.status(500).json({ message: 'สร้างการจองไม่สำเร็จ' });
  }
});

// GET /api/bookings?role=owner|renter&status=...
router.get('/bookings', auth, async (req, res) => {
  try {
    const { role, status } = req.query;
    const q = {};
    if (role === 'owner') q.owner = req.user.id;
    else q.renter = req.user.id;
    if (status) q.status = status;

    const rows = await Booking.find(q)
      .sort({ createdAt: -1 })
      .populate([
        { path: 'property', select: 'title price images address type category' },
        { path: 'renter', select: 'username name profile phone' },
        { path: 'owner',  select: 'username name profile' }
      ]);
    res.json({ items: rows });
  } catch (err) {
    console.error('list bookings error', err);
    res.status(500).json({ message: 'โหลดการจองไม่สำเร็จ' });
  }
});

// PATCH /api/bookings/:id/status  (เจ้าของ: approve/decline/cancel, ผู้เช่า: cancel)
router.patch('/bookings/:id/status', auth, async (req, res) => {
  try {
    const { action, note } = req.body; // 'approve' | 'decline' | 'cancel' | 'complete'
    const doc = await Booking.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'ไม่พบรายการ' });

    const isOwner = String(doc.owner) === String(req.user.id);
    const isRenter = String(doc.renter) === String(req.user.id);

    if (action === 'approve' || action === 'decline' || action === 'complete') {
      if (!isOwner) return res.status(403).json({ message: 'เฉพาะเจ้าของเท่านั้น' });
    }
    if (action === 'cancel' && !(isOwner || isRenter)) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ยกเลิก' });
    }

    if (action === 'approve')   doc.status = 'approved';
    if (action === 'decline')   doc.status = 'declined';
    if (action === 'complete')  doc.status = 'completed';
    if (action === 'cancel')    doc.status = 'cancelled';
    if (note) doc.note = note;

    await doc.save();
    const full = await Booking.findById(doc._id).populate([
      { path: 'property', select: 'title price images address type category' },
      { path: 'renter', select: 'username name profile' },
      { path: 'owner',  select: 'username name profile' }
    ]);
    res.json(full);
  } catch (err) {
    console.error('update booking status error', err);
    res.status(500).json({ message: 'อัปเดตสถานะไม่สำเร็จ' });
  }
});

module.exports = router;
