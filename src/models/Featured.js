const mongoose = require('mongoose');

const featuredSchema = new mongoose.Schema({
  type:     { type: String, enum: ['product', 'store'], required: true },
  refId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  order:    { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  addedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Featured', featuredSchema);
