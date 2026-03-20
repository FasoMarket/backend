const express  = require('express');
const router   = express.Router();
const adminCtrl    = require('../controllers/admin.controller');
const advancedCtrl = require('../controllers/adminAdvancedController');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../config/multer');

const admin = [protect, authorize('admin')];

// ── Vendeurs ──────────────────────────────────────────────────────────────────
router.get('/vendors',              ...admin, adminCtrl.getVendors);
router.put('/vendors/:id/approve',  ...admin, adminCtrl.approveVendor);
router.put('/vendors/:id/reject',   ...admin, adminCtrl.rejectVendor);

// ── Utilisateurs ──────────────────────────────────────────────────────────────
router.get('/users',     ...admin, adminCtrl.getUsers);
router.delete('/users/:id', ...admin, adminCtrl.deleteUser);

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', ...admin, adminCtrl.getStats);

// ── Catégories ────────────────────────────────────────────────────────────────
router.get   ('/categories',           ...admin, adminCtrl.getCategories);
router.post  ('/categories',           ...admin, adminCtrl.createCategory);
router.put   ('/categories/:id',       ...admin, adminCtrl.updateCategory);
router.delete('/categories/:id',       ...admin, adminCtrl.deleteCategory);

// ── Bannières ─────────────────────────────────────────────────────────────────
router.get   ('/banners',              ...admin, advancedCtrl.getBanners);
router.post  ('/banners',              ...admin, upload.single('image'), advancedCtrl.createBanner);
router.put   ('/banners/:id',          ...admin, upload.single('image'), advancedCtrl.updateBanner);
router.delete('/banners/:id',          ...admin, advancedCtrl.deleteBanner);
router.patch ('/banners/:id/toggle',   ...admin, advancedCtrl.toggleBanner);

// ── En vedette ────────────────────────────────────────────────────────────────
router.get   ('/featured',             ...admin, advancedCtrl.getFeatured);
router.post  ('/featured',             ...admin, advancedCtrl.addFeatured);
router.delete('/featured/:id',         ...admin, advancedCtrl.removeFeatured);

// ── Codes promo ───────────────────────────────────────────────────────────────
router.get   ('/promo-codes',          ...admin, advancedCtrl.getPromoCodes);
router.post  ('/promo-codes',          ...admin, advancedCtrl.createPromoCode);
router.put   ('/promo-codes/:id',      ...admin, advancedCtrl.updatePromoCode);
router.delete('/promo-codes/:id',      ...admin, advancedCtrl.deletePromoCode);
router.patch ('/promo-codes/:id/toggle',...admin, advancedCtrl.togglePromoCode);

// ── Litiges ───────────────────────────────────────────────────────────────────
router.get('/disputes',                        ...admin, advancedCtrl.getDisputes);
router.get('/disputes/:id',                    ...admin, advancedCtrl.getDisputeDetail);
router.put('/disputes/:id/resolve',            ...admin, advancedCtrl.resolveDispute);
router.put('/disputes/:id/close',              ...admin, advancedCtrl.closeDispute);

// ── Remboursements ────────────────────────────────────────────────────────────
router.get('/refunds',                         ...admin, advancedCtrl.getRefunds);
router.put('/refunds/:id/approve',             ...admin, advancedCtrl.approveRefund);
router.put('/refunds/:id/reject',              ...admin, advancedCtrl.rejectRefund);

// ── Communication ─────────────────────────────────────────────────────────────
router.get ('/announcements',                  ...admin, advancedCtrl.getAnnouncements);
router.post('/announcements/send',             ...admin, advancedCtrl.sendAnnouncement);

// ── Analytiques ───────────────────────────────────────────────────────────────
router.get('/analytics/overview',              ...admin, advancedCtrl.getOverview);
router.get('/analytics/revenue',               ...admin, advancedCtrl.getRevenueChart);
router.get('/analytics/top-products',          ...admin, advancedCtrl.getTopProducts);
router.get('/analytics/top-vendors',           ...admin, advancedCtrl.getTopVendors);
router.get('/analytics/orders-by-status',      ...admin, advancedCtrl.getOrdersByStatus);
router.get('/analytics/users-growth',          ...admin, advancedCtrl.getUsersGrowth);
router.get('/analytics/financial',             ...admin, advancedCtrl.getFinancialReport);

module.exports = router;


