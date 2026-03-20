const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  // Singleton — un seul document pour toute la plateforme
  singleton: { type: Boolean, default: true, unique: true },

  // Apparence
  theme: {
    mode:         { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    primaryColor: { type: String, default: '#16a34a' }, // vert FasoMarket
  },

  // Sécurité
  security: {
    require2FA:          { type: Boolean, default: false },
    passwordMinLength:   { type: Number,  default: 8 },
    sessionTimeoutMins:  { type: Number,  default: 60 },
    maxLoginAttempts:    { type: Number,  default: 5 },
  },

  // Notifications
  notifications: {
    emailOnNewOrder:    { type: Boolean, default: true },
    emailOnNewVendor:   { type: Boolean, default: true },
    pushOnNewMessage:   { type: Boolean, default: true },
    pushOnLowStock:     { type: Boolean, default: true },
  },

  // Facturation / Paiement
  billing: {
    commissionRate:     { type: Number,  default: 5 },   // % commission plateforme
    orangeMoneyKey:     { type: String,  default: '' },
    moovMoneyKey:       { type: String,  default: '' },
    corisBankKey:       { type: String,  default: '' },
  },

  // API & Webhooks
  api: {
    webhookUrl:         { type: String,  default: '' },
    apiKey:             { type: String,  default: '' },
  },

}, { timestamps: true });

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
