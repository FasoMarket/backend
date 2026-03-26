const AdminSettings  = require('../models/AdminSettings');
const VendorSettings = require('../models/VendorSettings');
const User           = require('../models/User');
const bcrypt         = require('bcrypt');
const crypto         = require('crypto');

// Générer un UUID v4 compatible CommonJS
const generateUUID = () => {
  return crypto.randomUUID();
};

// ── ADMIN ──────────────────────────────────────────────────────────────────────

exports.getAdminSettings = async (req, res) => {
  try {
    // findOneAndUpdate avec upsert = crée si n'existe pas
    let settings = await AdminSettings.findOne({ singleton: true });
    if (!settings) settings = await AdminSettings.create({ singleton: true });
    res.json({ success: true, settings });
  } catch (err) {
    console.error("ADMIN SETTINGS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAdminSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      { singleton: true },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      { singleton: true },
      { $set: { theme: req.body } },
      { new: true, upsert: true }
    );
    res.json({ success: true, theme: settings.theme });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSecurity = async (req, res) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      { singleton: true },
      { $set: { security: req.body } },
      { new: true, upsert: true }
    );
    res.json({ success: true, security: settings.security });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAdminNotifications = async (req, res) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      { singleton: true },
      { $set: { notifications: req.body } },
      { new: true, upsert: true }
    );
    res.json({ success: true, notifications: settings.notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBilling = async (req, res) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      { singleton: true },
      { $set: { billing: req.body } },
      { new: true, upsert: true }
    );
    res.json({ success: true, billing: settings.billing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateApi = async (req, res) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      { singleton: true },
      { $set: { 'api.webhookUrl': req.body.webhookUrl } },
      { new: true, upsert: true }
    );
    res.json({ success: true, api: settings.api });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.regenerateApiKey = async (req, res) => {
  try {
    const newKey = `fm_${generateUUID().replace(/-/g, '')}`;
    const settings = await AdminSettings.findOneAndUpdate(
      { singleton: true },
      { $set: { 'api.apiKey': newKey } },
      { new: true, upsert: true }
    );
    res.json({ success: true, apiKey: settings.api.apiKey });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── VENDOR ─────────────────────────────────────────────────────────────────────

exports.getVendorSettings = async (req, res) => {
  try {
    let settings = await VendorSettings.findOne({ vendor: req.user._id });
    if (!settings) settings = await VendorSettings.create({ vendor: req.user._id });
    res.json({ success: true, settings });
  } catch (err) {
    console.error('❌ getVendorSettings Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateVendorSettings = async (req, res) => {
  try {
    const settings = await VendorSettings.findOneAndUpdate(
      { vendor: req.user._id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateVendorNotifications = async (req, res) => {
  try {
    const settings = await VendorSettings.findOneAndUpdate(
      { vendor: req.user._id },
      { $set: { notifications: req.body } },
      { new: true, upsert: true }
    );
    res.json({ success: true, notifications: settings.notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStoreSettings = async (req, res) => {
  try {
    const settings = await VendorSettings.findOneAndUpdate(
      { vendor: req.user._id },
      { $set: { store: req.body } },
      { new: true, upsert: true }
    );
    res.json({ success: true, store: settings.store });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePaymentSettings = async (req, res) => {
  try {
    const settings = await VendorSettings.findOneAndUpdate(
      { vendor: req.user._id },
      { $set: { payment: req.body } },
      { new: true, upsert: true }
    );
    res.json({ success: true, payment: settings.payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── USER / CLIENT ──────────────────────────────────────────────────────────────

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updates = { name, email, phone };
    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, message: 'Profil mis à jour', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await bcrypt.compare(currentPassword, user.password)))
      return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUserNotifications = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { notificationPrefs: req.body } },
      { new: true }
    );
    res.json({ success: true, message: 'Préférences mises à jour' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
