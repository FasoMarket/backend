const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  vendor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  name:       { type: String, required: true },
  type:       { type: String, enum: ['percentage', 'fixed'], required: true },
  value:      { type: Number, required: true },
  products:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // vide = tous les produits
  minQuantity:{ type: Number, default: 1 },
  startDate:  { type: Date,   required: true },
  endDate:    { type: Date,   required: true },
  isActive:   { type: Boolean, default: true },
  usedCount:  { type: Number,  default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);
