const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', index: true, required: true },
}, { timestamps: true });

// กันซ้ำ: user + property ต้องไม่ซ้ำกัน
WishlistSchema.index({ user: 1, property: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', WishlistSchema);
