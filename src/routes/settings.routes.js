const express = require('express');
const router  = express.Router();
const settingsCtrl = require('../controllers/settings.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const isAdmin = authorize('admin');
const isVendor = authorize('vendor');

// Admin settings (singleton)
router.get ('/admin',            protect, isAdmin, settingsCtrl.getAdminSettings);
router.put ('/admin',            protect, isAdmin, settingsCtrl.updateAdminSettings);
router.put ('/admin/theme',      protect, isAdmin, settingsCtrl.updateTheme);
router.put ('/admin/security',   protect, isAdmin, settingsCtrl.updateSecurity);
router.put ('/admin/notifications', protect, isAdmin, settingsCtrl.updateAdminNotifications);
router.put ('/admin/billing',    protect, isAdmin, settingsCtrl.updateBilling);
router.put ('/admin/api',        protect, isAdmin, settingsCtrl.updateApi);
router.post('/admin/api/regenerate', protect, isAdmin, settingsCtrl.regenerateApiKey);

// Vendor settings
router.get ('/vendor',           protect, isVendor, settingsCtrl.getVendorSettings);
router.put ('/vendor',           protect, isVendor, settingsCtrl.updateVendorSettings);
router.put ('/vendor/notifications', protect, isVendor, settingsCtrl.updateVendorNotifications);
router.put ('/vendor/store',     protect, isVendor, settingsCtrl.updateStoreSettings);
router.put ('/vendor/payment',   protect, isVendor, settingsCtrl.updatePaymentSettings);

// User/Client settings (profil + préférences)
const upload = require('../config/multer');
router.put ('/profile',          protect, upload.single('avatar'), settingsCtrl.updateProfile);
router.put ('/change-password',  protect, settingsCtrl.changePassword);
router.put ('/notifications',    protect, settingsCtrl.updateUserNotifications);

module.exports = router;
