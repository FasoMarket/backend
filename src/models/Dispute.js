const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order',  required: true },
  initiator:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  against:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  reason:      { type: String, required: true },
  description: { type: String, required: true },
  evidence:    [{ type: String }],
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved_client', 'resolved_vendor', 'closed'],
    default: 'open',
  },
  resolution: { type: String, default: '' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
