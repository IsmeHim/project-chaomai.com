const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        default: null,
    },
    role: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },
    name: { type: String, default: '' },

    // ฟิลด์ใหม่สำหรับหน้า Become Owner
    company:     { type: String, default: '', trim: true },
    lineId:      { type: String, default: '', trim: true },
    facebookUrl: { type: String, default: '', trim: true },
    address:     { type: String, default: '', trim: true },
    about:       { type: String, default: '', trim: true },

    status: { type: String, enum:['active','suspended'], default:'active', index: true },
    verified: { type: Boolean, default: false },
    listings: { type: Number, default: 0 },

}, { timestamps: true })

// ย้ำ index (กันกรณี schema เคยสร้างก่อนหน้า)
// UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);