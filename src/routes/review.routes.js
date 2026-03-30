const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const reviewController = require('../controllers/review.controller');

// Routes publiques
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/vendor/:vendorId', reviewController.getVendorReviews);

// Routes protégées (client)
router.post('/', protect, reviewController.createReview);
router.get('/my-reviews', protect, reviewController.getMyReviews);
router.put('/:reviewId', protect, reviewController.updateReview);
router.delete('/:reviewId', protect, reviewController.deleteReview);

// Routes protégées (vendeur)
router.post('/:reviewId/reply', protect, reviewController.replyToReview);

module.exports = router;
