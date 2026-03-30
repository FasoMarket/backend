const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/sendResponse');
const asyncHandler = require('../utils/asyncHandler');

// Créer un avis
exports.createReview = asyncHandler(async (req, res) => {
  const { orderId, productId, rating, comment } = req.body;
  const customerId = req.user._id;

  // Vérifier que la commande existe et appartient au client
  const order = await Order.findById(orderId);
  if (!order) {
    return sendError(res, 404, 'Commande non trouvée');
  }
  if (order.user.toString() !== customerId.toString()) {
    return sendError(res, 403, 'Non autorisé');
  }

  // Vérifier que le produit existe
  const product = await Product.findById(productId);
  if (!product) {
    return sendError(res, 404, 'Produit non trouvé');
  }

  // Vérifier qu'un avis n'existe pas déjà
  const existingReview = await Review.findOne({ order: orderId, product: productId });
  if (existingReview) {
    return sendError(res, 400, 'Vous avez déjà laissé un avis pour ce produit');
  }

  // Créer l'avis
  const review = await Review.create({
    product: productId,
    vendor: product.vendor,
    customer: customerId,
    order: orderId,
    rating,
    comment: comment || ''
  });

  // Mettre à jour la note moyenne du produit
  await updateProductRating(productId);

  // Mettre à jour la note moyenne du vendeur
  await updateVendorRating(product.vendor);

  await review.populate('customer', 'name avatar');
  await review.populate('product', 'name');

  sendSuccess(res, 201, review, 'Avis créé avec succès');
});

// Récupérer les avis d'un produit
exports.getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const reviews = await Review.find({ product: productId, isVisible: true })
    .populate('customer', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ product: productId, isVisible: true });

  sendSuccess(res, 200, {
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  }, 'Avis récupérés');
});

// Récupérer les avis d'un vendeur
exports.getVendorReviews = asyncHandler(async (req, res) => {
  const { vendorId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const reviews = await Review.find({ vendor: vendorId, isVisible: true })
    .populate('customer', 'name avatar')
    .populate('product', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ vendor: vendorId, isVisible: true });

  // Calculer les statistiques
  const stats = await Review.aggregate([
    { $match: { vendor: require('mongoose').Types.ObjectId(vendorId), isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };

  if (stats.length > 0) {
    stats[0].ratingDistribution.forEach(rating => {
      distribution[rating]++;
    });
  }

  sendSuccess(res, 200, {
    reviews,
    stats: stats.length > 0 ? {
      averageRating: stats[0].averageRating.toFixed(1),
      totalReviews: stats[0].totalReviews,
      distribution
    } : {
      averageRating: 0,
      totalReviews: 0,
      distribution
    },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  }, 'Avis du vendeur récupérés');
});

// Mettre à jour un avis
exports.updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const customerId = req.user._id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return sendError(res, 404, 'Avis non trouvé');
  }

  if (review.customer.toString() !== customerId.toString()) {
    return sendError(res, 403, 'Non autorisé');
  }

  review.rating = rating || review.rating;
  review.comment = comment !== undefined ? comment : review.comment;

  await review.save();

  // Mettre à jour les notes moyennes
  await updateProductRating(review.product);
  await updateVendorRating(review.vendor);

  await review.populate('customer', 'name avatar');

  sendSuccess(res, 200, review, 'Avis mis à jour');
});

// Supprimer un avis
exports.deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const customerId = req.user._id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return sendError(res, 404, 'Avis non trouvé');
  }

  if (review.customer.toString() !== customerId.toString()) {
    return sendError(res, 403, 'Non autorisé');
  }

  const productId = review.product;
  const vendorId = review.vendor;

  await Review.findByIdAndDelete(reviewId);

  // Mettre à jour les notes moyennes
  await updateProductRating(productId);
  await updateVendorRating(vendorId);

  sendSuccess(res, 200, null, 'Avis supprimé');
});

// Répondre à un avis (vendeur)
exports.replyToReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { reply } = req.body;
  const vendorId = req.user._id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return sendError(res, 404, 'Avis non trouvé');
  }

  if (review.vendor.toString() !== vendorId.toString()) {
    return sendError(res, 403, 'Non autorisé');
  }

  review.reply = reply;
  review.repliedAt = new Date();

  await review.save();
  await review.populate('customer', 'name avatar');

  sendSuccess(res, 200, review, 'Réponse ajoutée');
});

// Récupérer les avis du client
exports.getMyReviews = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const reviews = await Review.find({ customer: customerId })
    .populate('product', 'name imageUrl')
    .populate('vendor', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ customer: customerId });

  sendSuccess(res, 200, {
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  }, 'Mes avis');
});

// Fonctions utilitaires
async function updateProductRating(productId) {
  const reviews = await Review.find({ product: productId, isVisible: true });
  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, { rating: 0, reviewCount: 0 });
    return;
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Product.findByIdAndUpdate(productId, {
    rating: parseFloat(averageRating.toFixed(1)),
    reviewCount: reviews.length
  });
}

async function updateVendorRating(vendorId) {
  const reviews = await Review.find({ vendor: vendorId, isVisible: true });
  if (reviews.length === 0) {
    await User.findByIdAndUpdate(vendorId, { vendorRating: 0, vendorReviewCount: 0 });
    return;
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await User.findByIdAndUpdate(vendorId, {
    vendorRating: parseFloat(averageRating.toFixed(1)),
    vendorReviewCount: reviews.length
  });
}
