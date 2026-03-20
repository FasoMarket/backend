const mongoose = require('mongoose');

const vendorSettingsSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // Notifications
  notifications: {
    emailOnNewOrder:    { type: Boolean, default: true },
    emailOnMessage:     { type: Boolean, default: true },
    pushOnLowStock:     { type: Boolean, default: true },
    lowStockThreshold:  { type: Number,  default: 5 },
  },

  // Boutique
  store: {
    autoAcceptOrders:   { type: Boolean, default: false },
    showPhoneNumber:    { type: Boolean, default: true },
    allowMessages:      { type: Boolean, default: true },
    vacationMode:       { type: Boolean, default: false },
    vacationMessage:    { type: String,  default: '' },
  },

  // Paiement
  payment: {
    orangeMoneyNumber:  { type: String, default: '' },
    moovMoneyNumber:    { type: String, default: '' },
  },

}, { timestamps: true });

module.exports = mongoose.model('VendorSettings', vendorSettingsSchema);
