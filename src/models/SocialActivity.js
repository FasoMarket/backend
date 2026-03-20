const mongoose = require('mongoose');

const socialActivitySchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  type:     { type: String, enum: ['review', 'purchase', 'wishlist'], required: true },
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  review:   { type: mongoose.Schema.Types.ObjectId, ref: 'Review',  default: null },
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

socialActivitySchema.index({ product: 1, type: 1 });

module.exports = mongoose.model('SocialActivity', socialActivitySchema);
