const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name:   { type: String, required: true, unique: true, trim: true },
  slug:   { type: String, required: true, unique: true },
  icon:   { type: String, default: '' }, // เก็บ URL ไอคอน (ถ้ามี)
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
