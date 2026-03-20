const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  reporter:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  reason:      { type: String, enum: ['fake', 'inappropriate', 'wrong_price', 'out_of_stock', 'other'], required: true },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'reviewed', 'ignored'], default: 'pending' },
}, { timestamps: true });

reportSchema.index({ product: 1, reporter: 1 }, { unique: true });
module.exports = mongoose.model('Report', reportSchema);
