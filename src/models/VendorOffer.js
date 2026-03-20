const mongoose = require('mongoose');

const vendorOfferSchema = new mongoose.Schema({
  vendor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  targets:     { type: String, enum: ['all_buyers', 'recent_buyers', 'specific'], default: 'all_buyers' },
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  title:       { type: String, required: true },
  message:     { type: String, required: true },
  promoCode:   { type: String, default: null },
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  sentAt:      { type: Date, default: null },
  sentCount:   { type: Number, default: 0 },
  status:      { type: String, enum: ['draft', 'sent'], default: 'draft' },
}, { timestamps: true });

module.exports = mongoose.model('VendorOffer', vendorOfferSchema);
