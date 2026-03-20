const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  vendor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:       { type: String, required: true },
  description:{ type: String, default: '' },
  products:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
