const express = require('express');
const router  = express.Router();

const authRoutes         = require('./auth.routes');
const userRoutes         = require('./user.routes');
const productRoutes      = require('./product.routes');
const orderRoutes        = require('./order.routes');
const cartRoutes         = require('./cart.routes');
const vendorRoutes       = require('./vendor.routes');
const adminRoutes        = require('./admin.routes');
const storeRoutes        = require('./store.routes');
const paymentRoutes      = require('./payment.routes');
const settingsRoutes     = require('./settings.routes');
const messageRoutes      = require('./message.routes');
const notificationRoutes = require('./notification.routes');
const communicationRoutes = require('./communication.routes');
const uploadRoutes       = require('./upload.routes');

const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../config/multer');

const isVendeur    = authorize('vendor');
const isAdmin      = authorize('admin');

const vendorAdvancedCtrl = require('../controllers/vendorAdvancedController');
const clientCtrl         = require('../controllers/clientAdvancedController');
const relationCtrl       = require('../controllers/relationController');

// ── FAVORIS ───────────────────────────────────────────────────────────────────
router.get   ('/wishlist',                   protect, clientCtrl.getWishlist);
router.post  ('/wishlist/:productId',        protect, clientCtrl.addToWishlist);
router.delete('/wishlist/:productId',        protect, clientCtrl.removeFromWishlist);
router.get   ('/wishlist/:productId/status', protect, clientCtrl.checkWishlistStatus);

// ── HISTORIQUE NAVIGATION ─────────────────────────────────────────────────────
router.post  ('/history/:productId',         protect, clientCtrl.addToHistory);
router.get   ('/history',                    protect, clientCtrl.getHistory);
router.delete('/history',                    protect, clientCtrl.clearHistory);

// ── ADRESSES ──────────────────────────────────────────────────────────────────
router.get   ('/addresses',                  protect, clientCtrl.getAddresses);
router.post  ('/addresses',                  protect, clientCtrl.createAddress);
router.put   ('/addresses/:id',              protect, clientCtrl.updateAddress);
router.delete('/addresses/:id',              protect, clientCtrl.deleteAddress);
router.patch ('/addresses/:id/default',      protect, clientCtrl.setDefaultAddress);

// ── COMMANDES CLIENT AVANCÉES ─────────────────────────────────────────────────
// (Removed conflicting /orders routes that are handled by orderRoutes below)
router.put   ('/orders/:id/cancel',          protect, clientCtrl.cancelOrder);
router.get   ('/orders/:id/timeline',        protect, clientCtrl.getOrderTimeline);
router.get   ('/orders/:id/invoice',         protect, clientCtrl.downloadInvoice);

// ── LITIGES ───────────────────────────────────────────────────────────────────
router.post  ('/disputes',                   protect, clientCtrl.openDispute);
router.get   ('/disputes/my-disputes',       protect, clientCtrl.getMyDisputes);
router.get   ('/disputes/:id',               protect, clientCtrl.getDisputeDetail);

// ── REMBOURSEMENTS ────────────────────────────────────────────────────────────
router.post  ('/refunds',                    protect, clientCtrl.requestRefund);
router.get   ('/refunds/my-refunds',         protect, clientCtrl.getMyRefunds);

// ── AVIS (Client) ─────────────────────────────────────────────────────────────
router.post  ('/reviews',                     protect, clientCtrl.createReview);
router.get   ('/reviews/my-reviews',          protect, clientCtrl.getMyReviews);
router.put   ('/reviews/:id',                 protect, clientCtrl.updateReview);
router.delete('/reviews/:id',                 protect, clientCtrl.deleteReview);

// ── SIGNALEMENT ───────────────────────────────────────────────────────────────
router.post  ('/reports',                    protect, clientCtrl.reportProduct);

// ── CODE PROMO ────────────────────────────────────────────────────────────────
router.post  ('/promo-codes/validate',       protect, clientCtrl.validatePromoCode);

// ── STATS ET RECOMMANDATIONS ──────────────────────────────────────────────────
router.get   ('/client/stats',               protect, clientCtrl.getClientStats);
router.get   ('/client/recommendations',     protect, clientCtrl.getRecommendations);

// ── PRÉFÉRENCES NOTIFICATIONS ─────────────────────────────────────────────────
router.put   ('/auth/notification-prefs',    protect, clientCtrl.updateNotificationPrefs);

// ── PRODUITS AVANCÉS ──────────────────────────────────────────────────────────
router.post  ('/vendor/products/:id/images',         protect, isVendeur, upload.array('images', 6), vendorAdvancedCtrl.addProductImages);
router.delete('/vendor/products/:id/images',         protect, isVendeur, vendorAdvancedCtrl.deleteProductImage);
router.patch ('/vendor/products/:id/stock',          protect, isVendeur, vendorAdvancedCtrl.updateStock);
router.patch ('/vendor/products/:id/promotion',      protect, isVendeur, vendorAdvancedCtrl.setProductPromotion);
router.get   ('/vendor/products/low-stock',          protect, isVendeur, vendorAdvancedCtrl.getLowStockProducts);

// ── COLLECTIONS ───────────────────────────────────────────────────────────────
router.get   ('/vendor/collections',                 protect, isVendeur, vendorAdvancedCtrl.getCollections);
router.post  ('/vendor/collections',                 protect, isVendeur, vendorAdvancedCtrl.createCollection);
router.put   ('/vendor/collections/:id',             protect, isVendeur, vendorAdvancedCtrl.updateCollection);
router.delete('/vendor/collections/:id',             protect, isVendeur, vendorAdvancedCtrl.deleteCollection);
router.post  ('/vendor/collections/:id/products',    protect, isVendeur, vendorAdvancedCtrl.addProductToCollection);
router.delete('/vendor/collections/:id/products/:productId', protect, isVendeur, vendorAdvancedCtrl.removeFromCollection);

// ── PROMOTIONS ────────────────────────────────────────────────────────────────
router.get   ('/vendor/promotions',                  protect, isVendeur, vendorAdvancedCtrl.getPromotions);
router.post  ('/vendor/promotions',                  protect, isVendeur, vendorAdvancedCtrl.createPromotion);
router.put   ('/vendor/promotions/:id',              protect, isVendeur, vendorAdvancedCtrl.updatePromotion);
router.delete('/vendor/promotions/:id',              protect, isVendeur, vendorAdvancedCtrl.deletePromotion);
router.patch ('/vendor/promotions/:id/toggle',       protect, isVendeur, vendorAdvancedCtrl.togglePromotion);

// ── COMMANDES AVANCÉES VENDEUR ────────────────────────────────────────────────
router.get   ('/vendor/orders-advanced',             protect, isVendeur, vendorAdvancedCtrl.getOrders);
router.get   ('/vendor/orders-advanced/:id',         protect, isVendeur, vendorAdvancedCtrl.getOrderDetail);
router.put   ('/vendor/orders-advanced/:id/status',  protect, isVendeur, vendorAdvancedCtrl.updateOrderStatus);

// ── AVIS ──────────────────────────────────────────────────────────────────────
router.get   ('/vendor/reviews',                     protect, isVendeur, vendorAdvancedCtrl.getReviews);
router.post  ('/vendor/reviews/:id/reply',           protect, isVendeur, vendorAdvancedCtrl.replyToReview);
router.get   ('/vendor/reviews/stats',               protect, isVendeur, vendorAdvancedCtrl.getReviewStats);
router.get   ('/reviews/product/:productId',         vendorAdvancedCtrl.getProductReviews);
router.get   ('/reviews/store/:vendorId',            vendorAdvancedCtrl.getStoreReviews);

// ── ANALYTIQUES VENDEUR ───────────────────────────────────────────────────────
router.get   ('/vendor/analytics/overview',          protect, isVendeur, vendorAdvancedCtrl.getOverview);
router.get   ('/vendor/analytics/revenue',           protect, isVendeur, vendorAdvancedCtrl.getRevenueChart);
router.get   ('/vendor/analytics/top-products',      protect, isVendeur, vendorAdvancedCtrl.getTopProducts);
router.get   ('/vendor/analytics/orders-trend',      protect, isVendeur, vendorAdvancedCtrl.getOrdersTrend);

// ── FINANCES ──────────────────────────────────────────────────────────────────
router.get   ('/vendor/finances/summary',            protect, isVendeur, vendorAdvancedCtrl.getFinancialSummary);
router.get   ('/vendor/finances/history',            protect, isVendeur, vendorAdvancedCtrl.getPaymentHistory);

// ══════════════════════════════════════════════════════════════════════════════
// NOUVELLES RELATIONS
// ══════════════════════════════════════════════════════════════════════════════

// ── VENDEUR → CLIENT : Offres ciblées ─────────────────────────────────────────
router.get   ('/vendor/offers',                      protect, isVendeur, relationCtrl.getMyOffers);
router.post  ('/vendor/offers',                      protect, isVendeur, relationCtrl.createOffer);
router.post  ('/vendor/offers/:id/send',             protect, isVendeur, relationCtrl.sendOffer);
router.delete('/vendor/offers/:id',                  protect, isVendeur, relationCtrl.deleteOffer);
router.get   ('/vendor/buyers',                      protect, isVendeur, relationCtrl.getMyBuyers);

// ── WALLET VENDEUR ────────────────────────────────────────────────────────────
router.get   ('/vendor/wallet',                      protect, isVendeur, relationCtrl.getMyWallet);
router.get   ('/vendor/payouts',                     protect, isVendeur, relationCtrl.getMyPayouts);
router.put   ('/vendor/wallet/payment-info',         protect, isVendeur, relationCtrl.updatePaymentInfo);

// ── ADMIN → VENDEUR : Paiements ───────────────────────────────────────────────
router.get   ('/admin/payouts',                      protect, isAdmin, relationCtrl.getAllPayouts);
router.get   ('/admin/payouts/pending',              protect, isAdmin, relationCtrl.getPendingPayouts);
router.get   ('/admin/vendors/:id/wallet',           protect, isAdmin, relationCtrl.getVendorWallet);
router.get   ('/admin/vendors/:id/earnings',         protect, isAdmin, relationCtrl.getVendorEarnings);
router.post  ('/admin/payouts',                      protect, isAdmin, relationCtrl.processPayout);
router.put   ('/admin/payouts/:id/confirm',          protect, isAdmin, relationCtrl.confirmPayout);
router.put   ('/admin/payouts/:id/fail',             protect, isAdmin, relationCtrl.failPayout);

// ── CLIENT → CLIENT : Social ──────────────────────────────────────────────────
router.get   ('/social/product/:productId',          relationCtrl.getProductSocialProof);
router.get   ('/social/recommendations/trending',    relationCtrl.getTrendingProducts);
router.put   ('/social/privacy',                     protect, relationCtrl.updateSocialPrivacy);

// ── MODULES ROUTEURS (sub-routers) ────────────────────────────────────────────
router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/products',      productRoutes);
router.use('/orders',        orderRoutes);
router.use('/cart',          cartRoutes);
router.use('/vendor',        vendorRoutes);
router.use('/admin',         adminRoutes);
router.use('/stores',        storeRoutes);
router.use('/payments',      paymentRoutes);   // FIXED: was /payment
router.use('/settings',      settingsRoutes);
router.use('/messages',      messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/communications', communicationRoutes);
router.use('/upload',        uploadRoutes);

module.exports = router;
