const mongoose = require('mongoose');

const vendorPayoutSchema = new mongoose.Schema({
  vendor:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  processedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:        { type: Number, required: true },
  grossAmount:   { type: Number, required: true },
  commission:    { type: Number, required: true },
  commissionRate:{ type: Number, required: true },
  period: {
    startDate: { type: Date },
    endDate:   { type: Date },
  },
  orders:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  paymentMethod: { type: String, enum: ['orange_money', 'moov_money', 'coris_money', 'bank_transfer'], required: true },
  paymentNumber: { type: String, required: true },
  reference:     { type: String, required: true, unique: true },
  status:        { type: String, enum: ['pending', 'processing', 'paid', 'failed'], default: 'pending' },
  notes:         { type: String, default: '' },
  paidAt:        { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('VendorPayout', vendorPayoutSchema);
