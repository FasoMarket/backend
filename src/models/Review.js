const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product',  required: true },
  vendor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  order:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order',    required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String, trim: true, maxlength: 1000 },
  reply:    { type: String, default: null },     // réponse du vendeur
  repliedAt:{ type: Date,   default: null },
  isVisible:{ type: Boolean, default: true },
}, { timestamps: true });

// Un client ne peut laisser qu'un avis par commande/produit
reviewSchema.index({ order: 1, product: 1 }, { unique: true });
reviewSchema.index({ vendor: 1 });
reviewSchema.index({ product: 1 });

module.exports = mongoose.model('Review', reviewSchema);
