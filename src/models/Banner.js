const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  subtitle:  { type: String, default: '' },
  image:     { type: String, required: true },
  link:      { type: String, default: '' },
  position:  { type: String, enum: ['hero', 'home_middle', 'home_bottom'], default: 'hero' },
  isActive:  { type: Boolean, default: true },
  order:     { type: Number, default: 0 },
  startDate: { type: Date, default: null },
  endDate:   { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
