const mongoose = require('mongoose');

const vendorWalletSchema = new mongoose.Schema({
  vendor:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance:         { type: Number, default: 0 },
  pendingBalance:  { type: Number, default: 0 },
  totalEarned:     { type: Number, default: 0 },
  totalPaid:       { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  lastPayoutAt:    { type: Date, default: null },
  paymentInfo: {
    method:  { type: String, enum: ['orange_money', 'moov_money', 'coris_money', 'bank_transfer'], default: 'orange_money' },
    number:  { type: String, default: '' },
    name:    { type: String, default: '' },
  },
}, { timestamps: true });

module.exports = mongoose.model('VendorWallet', vendorWalletSchema);
