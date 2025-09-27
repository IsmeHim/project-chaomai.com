// models/Booking.js
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

/** ปรับให้ generic ได้: รองรับสิ่งที่ให้เช่าได้หลายชนิดในอนาคต
 *  ตอนนี้เราจะใช้ property เป็นหลัก (อ้างอิง Property)
 *  แต่กันช่อง itemType,itemId ไว้เผื่อมี "อุปกรณ์ให้เช่า" ฯลฯ
 */
const bookingSchema = new Schema({
  // อ้างถึง property (หลักในระบบตอนนี้)
  property: { type: Types.ObjectId, ref: 'Property', required: true },

  // เจ้าของทรัพย์ ณ เวลาจอง (สำเนาไว้เพื่อ query เร็ว)
  owner: { type: Types.ObjectId, ref: 'User', required: true },

  // ผู้เช่า (คนที่กดจอง)
  renter: { type: Types.ObjectId, ref: 'User', required: true },

  // snapshot เบอร์ผู้เช่าตอนจอง (กันผู้ใช้ไปแก้โปรไฟล์ภายหลัง)
  renterPhone: { type: String, trim: true },

  // เผื่ออนาคต: case เช่าสิ่งอื่น
  itemType: { type: String, enum: ['property'], default: 'property' },

  // ช่วงวันที่เช่า
  startDate:   { type: Date, required: true },
  endDate:     { type: Date },              // ✅ ไม่บังคับแล้ว
  openEnded:   { type: Boolean, default: false }, // ✅ ใหม่: ไม่กำหนดวันสิ้นสุด

  // สถานะการจอง/เช่า
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'cancelled', 'paid', 'completed'],
    default: 'pending'
  },

  // สแน็ปราคา ณ เวลาจอง (ไม่พึ่งพา price ปัจจุบัน)
  currency: { type: String, default: 'THB' },
  pricePerMonth: { type: Number, default: 0 }, // ราคาต่อเดือนของทรัพย์ ณ วันจอง
  totalAmount: { type: Number, default: 0 },   // ถ้า openEnded อาจเป็น 0 หรือไม่ตั้ง
  monthlyEstimate: { type: Number, default: 0 }, // ✅ ใหม่: ค่าประมาณรายเดือนเวลายังไม่กำหนด endDate

  // หมายเหตุ/เหตุผลปฏิเสธ/ยกเลิก
  note: { type: String, default: '' },
}, { timestamps: true });

// ป้องกันชนกัน: ช่วงวันทับกับ booking ที่ยัง active
bookingSchema.index(
  { property: 1, startDate: 1, endDate: 1, status: 1 },
  { name: 'property_dates_status' }
);

module.exports = mongoose.model('Booking', bookingSchema);
