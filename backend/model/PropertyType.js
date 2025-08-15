const mongoose = require('mongoose');

const PropertyTypeSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  slug:   { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

PropertyTypeSchema.index({ name: 1, category: 1 }, { unique: true }); // ชื่อไม่ซ้ำในหมวดเดียวกัน

module.exports = mongoose.model('PropertyType', PropertyTypeSchema);
