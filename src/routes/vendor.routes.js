const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const { protect, authorize, checkVendorApproval } = require('../middlewares/auth.middleware');

router.get('/store', protect, authorize('vendor'), vendorController.getMyStore);
router.get('/orders', protect, authorize('vendor'), checkVendorApproval, vendorController.getVendorOrders);
router.get('/stats', protect, authorize('vendor'), checkVendorApproval, vendorController.getVendorStats);
router.put('/orders/:orderId/status', protect, authorize('vendor'), checkVendorApproval, vendorController.updateOrderStatus);

// ── CODES PROMO ────────────────────────────────────────────────────────────────
router.post('/promo-codes', protect, authorize('vendor'), checkVendorApproval, vendorController.createPromoCode);
router.get('/promo-codes', protect, authorize('vendor'), checkVendorApproval, vendorController.getMyPromoCodes);
router.put('/promo-codes/:id', protect, authorize('vendor'), checkVendorApproval, vendorController.updatePromoCode);
router.delete('/promo-codes/:id', protect, authorize('vendor'), checkVendorApproval, vendorController.deletePromoCode);

module.exports = router;
