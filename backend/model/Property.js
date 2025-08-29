const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  filename: String,
  url: String,
  size: Number,
  mimetype: String,
  isCover: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, { _id: false });

const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug:  { type: String, required: true, unique: true },
  description: String,

  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  type:     { type: mongoose.Schema.Types.ObjectId, ref: 'PropertyType' },

  price: { type: Number, default: 0 },
  bedrooms: Number,
  bathrooms: Number,
  area: Number,

  address: String,
  googleMapUrl: String,

  // GeoJSON
  location: {
    type: { type: String, enum: ['Point'],},
    coordinates: {
      type: [Number],
      // อนุญาตให้ว่างได้ แต่ถ้ามีต้องเป็นคู่ [lng, lat]
      validate: {
        validator: (v) => v == null || (Array.isArray(v) && v.length === 2),
        message: 'coordinates must be [lng, lat]',
      },}
  },

  images: [ImageSchema],

  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['draft', 'published'], default: 'published' },

  // ✅ ฟิลด์การอนุมัติ
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  approvalReason: { type: String, default: '' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,

  amenities: {
    wifi: { type: String, enum: ['none', 'free', 'paid'], default: 'none' },
    parking: { type: String, enum: ['none', 'motorcycle', 'car_and_motorcycle'], default: 'none' },
    utilitiesIncluded: [{ type: String, enum: ['water', 'electricity', 'wifi', 'common_fee'] }], // ค่าน้ำ/ค่าไฟ/เน็ต/ค่าส่วนกลาง ที่ “รวมแล้ว”
    features: {
      aircon: { type: Boolean, default: false },          // แอร์
      kitchen: { type: Boolean, default: false },         // ครัว (เตรียมครัวได้)
      tv: { type: Boolean, default: false },              // ทีวี
      fridge: { type: Boolean, default: false },          // ตู้เย็น
      washingMachine: { type: Boolean, default: false },  // เครื่องซักผ้า
      furnished: { type: Boolean, default: false }        // มีเฟอร์นิเจอร์ (เตียง/ตู้/โต๊ะ)
    }
  },
}, { timestamps: true });

PropertySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Property', PropertySchema);
