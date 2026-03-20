const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:           { type: String, enum: ['percentage', 'fixed'], required: true },
  value:          { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxUses:        { type: Number, default: null },
  usedCount:      { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },
  startDate:      { type: Date, default: Date.now },
  endDate:        { type: Date, default: null },
  usedBy:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
