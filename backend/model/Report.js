const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: { type: String, enum: ['scam','incorrect','duplicate','offensive','other'], required: true },
  detail: { type: String, default: '' },
  pageUrl: { type: String, default: '' },
  status: { type: String, enum: ['open','resolved'], default: 'open', index: true },
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
