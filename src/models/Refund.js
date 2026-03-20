const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order',  required: true },
  client:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  amount:      { type: Number, required: true, min: 0 },
  reason:      { type: String, required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending' },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  processedAt: { type: Date, default: null },
  notes:       { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Refund', refundSchema);
