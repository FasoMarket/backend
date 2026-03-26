const Product    = require('../models/Product');
const Order      = require('../models/Order');
const Review     = require('../models/Review');
const Promotion  = require('../models/Promotion');
const Collection = require('../models/Collection');
const User       = require('../models/User');
const Store      = require('../models/Store');
const { sendNotification } = require('../socket/socketManager');

// ── PRODUITS AVANCÉS ──────────────────────────────────────────────────────────

exports.addProductImages = async (req, res) => {
  try {
    if (!req.files?.length)
      return res.status(400).json({ success: false, message: 'Aucune image fournie' });

    const newImages = req.files.map(f => `/uploads/${f.filename}`);
    const product   = await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id },
      { $push: { images: { $each: newImages } } },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable' });
    res.json({ success: true, images: product.images });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id },
      { $pull: { images: imageUrl } }
    );
    res.json({ success: true, message: 'Image supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { stock, operation } = req.body;
    // operation: 'set' | 'add' | 'subtract'
    const update = operation === 'add'
      ? { $inc: { stock:  stock } }
      : operation === 'subtract'
      ? { $inc: { stock: -stock } }
      : { $set: { stock } };

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id },
      update,
      { new: true }
    );

    // Alerte stock faible
    const io = req.app.get('io');
    if (product.stock < 10 && product.stock > 0) {
      await sendNotification(io, {
        recipientId: req.user._id,
        type:    'low_stock',
        title:   '⚠️ Stock faible',
        message: `Il ne reste que ${product.stock} unité(s) pour "${product.name}"`,
        link:    '/vendor/products',
        data:    { productId: product._id },
      });
    }
    if (product.stock === 0) {
      await Product.findByIdAndUpdate(product._id, { status: 'rupture' });
    }

    res.json({ success: true, stock: product.stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.setProductPromotion = async (req, res) => {
  try {
    const { isOnSale, salePrice, saleEndDate } = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id },
      { $set: { 'promotion.isOnSale': isOnSale, 'promotion.salePrice': salePrice, 'promotion.saleEndDate': saleEndDate } },
      { new: true }
    );
    res.json({ success: true, promotion: product.promotion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = 10; // Utiliser le même seuil que getVendorStats
    const products = await Product.find({
      vendor: req.user._id,
      stock:  { $lt: threshold },
      status: { $ne: 'deleted' },
    }).sort('stock');
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── COLLECTIONS ───────────────────────────────────────────────────────────────

exports.getCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ vendor: req.user._id })
      .populate('products', 'name images price stock')
      .sort('-createdAt');
    res.json({ success: true, collections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCollection = async (req, res) => {
  try {
    const { name, description, products } = req.body;
    const collection = await Collection.create({
      vendor: req.user._id, name, description, products: products || [],
    });

    // Broadcast collection creation
    const io = req.app.get('io');
    if (io) {
      const { broadcastCollectionCreated } = require('../socket/socketManager');
      broadcastCollectionCreated(io, collection);
    }

    res.status(201).json({ success: true, collection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id },
      req.body,
      { new: true }
    );

    // Broadcast collection update
    const io = req.app.get('io');
    if (io) {
      const { broadcastCollectionUpdated } = require('../socket/socketManager');
      broadcastCollectionUpdated(io, collection);
    }

    res.json({ success: true, collection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const collectionId = req.params.id;
    await Collection.findOneAndDelete({ _id: collectionId, vendor: req.user._id });

    // Broadcast collection deletion
    const io = req.app.get('io');
    if (io) {
      const { broadcastCollectionDeleted } = require('../socket/socketManager');
      broadcastCollectionDeleted(io, collectionId);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addProductToCollection = async (req, res) => {
  try {
    const { productId } = req.body;
    await Collection.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id },
      { $addToSet: { products: productId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeFromCollection = async (req, res) => {
  try {
    await Collection.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id },
      { $pull: { products: req.params.productId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PROMOTIONS ────────────────────────────────────────────────────────────────

exports.getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({ vendor: req.user._id })
      .populate('products', 'name images price')
      .sort('-createdAt');
    res.json({ success: true, promotions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.create({ ...req.body, vendor: req.user._id });

    // Appliquer la promo sur les produits concernés
    const productFilter = promotion.products.length
      ? { _id: { $in: promotion.products }, vendor: req.user._id }
      : { vendor: req.user._id };

    await Product.updateMany(productFilter, {
      $set: {
        'promotion.isOnSale':   true,
        'promotion.salePrice':  null, // sera calculé dynamiquement
        'promotion.saleEndDate':promotion.endDate,
      },
    });

    // Broadcast promotion creation
    const io = req.app.get('io');
    if (io) {
      const { broadcastPromotionCreated } = require('../socket/socketManager');
      broadcastPromotionCreated(io, promotion);
    }

    res.status(201).json({ success: true, promotion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id },
      req.body,
      { new: true }
    );

    // Broadcast promotion update
    const io = req.app.get('io');
    if (io) {
      const { broadcastPromotionUpdated } = require('../socket/socketManager');
      broadcastPromotionUpdated(io, promotion);
    }

    res.json({ success: true, promotion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const promotionId = req.params.id;
    await Promotion.findOneAndDelete({ _id: promotionId, vendor: req.user._id });

    // Broadcast promotion deletion
    const io = req.app.get('io');
    if (io) {
      const { broadcastPromotionDeleted } = require('../socket/socketManager');
      broadcastPromotionDeleted(io, promotionId);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.togglePromotion = async (req, res) => {
  try {
    const promo    = await Promotion.findOne({ _id: req.params.id, vendor: req.user._id });
    promo.isActive = !promo.isActive;
    await promo.save();

    // Broadcast promotion update
    const io = req.app.get('io');
    if (io) {
      const { broadcastPromotionUpdated } = require('../socket/socketManager');
      broadcastPromotionUpdated(io, promo);
    }

    res.json({ success: true, isActive: promo.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── COMMANDES AVANCÉES ────────────────────────────────────────────────────────

exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;

    // Vérifier que req.user existe
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    const match = { 'items.vendor': req.user._id };
    if (status) match.status = status;
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate)   match.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(match)
      .populate('customer', 'name email phone avatar')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Filtrer uniquement les items de ce vendeur
    const filtered = orders.map(o => ({
      ...o.toObject(),
      items: o.items.filter(i => i.vendor?.toString() === req.user._id.toString()),
      vendorTotal: o.items
        .filter(i => i.vendor?.toString() === req.user._id.toString())
        .reduce((sum, i) => sum + (i.subtotal || 0), 0),
    }));

    const total = await Order.countDocuments(match);
    res.json({ success: true, orders: filtered, total, page: Number(page) });
  } catch (err) {
    console.error('❌ Erreur getOrders:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, 'items.vendor': req.user._id })
      .populate('customer', 'name email phone avatar');
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });

    const vendorItems = order.items.filter(i => i.vendor?.toString() === req.user._id.toString());
    res.json({ success: true, order: { ...order.toObject(), items: vendorItems } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const io         = req.app.get('io');

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, 'items.vendor': req.user._id },
      { $set: { status } },
      { new: true }
    ).populate('customer', 'name _id');

    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });

    // Notifier le client
    const messages = {
      confirmed:  { title: '✅ Commande confirmée',  msg: 'Votre commande a été confirmée par le vendeur' },
      processing: { title: '⚙️ En préparation',      msg: 'Votre commande est en cours de préparation' },
      shipped:    { title: '🚚 Commande expédiée !', msg: 'Votre commande est en route vers vous' },
      delivered:  { title: '🎉 Commande livrée !',   msg: 'Votre commande a bien été livrée' },
      cancelled:  { title: '❌ Commande annulée',    msg: 'Votre commande a été annulée' },
    };

    if (messages[status]) {
      await sendNotification(io, {
        recipientId: order.customer._id,
        type:    `order_${status}`,
        title:   messages[status].title,
        message: messages[status].msg,
        link:    `/my-orders/${order._id}`,
        data:    { orderId: order._id },
      });
    }

    // Mettre à jour soldCount des produits si livré
    if (status === 'delivered') {
      const vendorItems = order.items.filter(i => i.vendor?.toString() === req.user._id.toString());
      for (const item of vendorItems) {
        await Product.findByIdAndUpdate(item.product, { $inc: { soldCount: item.quantity } });
      }
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── AVIS ──────────────────────────────────────────────────────────────────────

exports.getReviews = async (req, res) => {
  try {
    const { rating, page = 1, limit = 20, replied } = req.query;
    const filtre = { vendor: req.user._id };
    if (rating)  filtre.rating = Number(rating);
    if (replied === 'true')  filtre.reply = { $ne: null };
    if (replied === 'false') filtre.reply = null;

    const reviews = await Review.find(filtre)
      .populate('customer', 'name avatar')
      .populate('product',  'name images')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Review.countDocuments(filtre);
    res.json({ success: true, reviews, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.replyToReview = async (req, res) => {
  try {
    const { reply } = req.body;
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id },
      { reply, repliedAt: new Date() },
      { new: true }
    ).populate('customer', 'name _id');

    if (!review) return res.status(404).json({ success: false, message: 'Avis introuvable' });

    // Notifier le client de la réponse
    const io = req.app.get('io');
    await sendNotification(io, {
      recipientId: review.customer._id,
      type:    'new_message',
      title:   '💬 Le vendeur a répondu à votre avis',
      message: reply.length > 80 ? reply.substring(0, 80) + '...' : reply,
      link:    `/products/${review.product}`,
    });

    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReviewStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      { $match: { vendor: req.user._id } },
      {
        $group: {
          _id:         null,
          average:     { $avg: '$rating' },
          total:       { $sum: 1 },
          replied:     { $sum: { $cond: [{ $ne: ['$reply', null] }, 1, 0] } },
          stars5:      { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          stars4:      { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          stars3:      { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          stars2:      { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          stars1:      { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        },
      },
    ]);

    res.json({ success: true, stats: stats[0] || { average: 0, total: 0, replied: 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Routes publiques avis
exports.createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;

    // Vérifier que la commande existe et est livrée
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
      status: 'delivered',
    });
    if (!order) return res.status(400).json({ success: false, message: 'Vous ne pouvez noter que les commandes livrées' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable' });

    const review = await Review.create({
      product: productId,
      vendor:  product.vendor,
      customer:req.user._id,
      order:   orderId,
      rating,
      comment,
    });

    // Recalculer la note moyenne du produit
    const agg = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Product.findByIdAndUpdate(productId, {
      'rating.average': Math.round((agg[0]?.avg || 0) * 10) / 10,
      'rating.count':   agg[0]?.count || 0,
    });

    // Notifier le vendeur
    const io = req.app.get('io');
    await sendNotification(io, {
      recipientId: product.vendor,
      type:    'avis',
      title:   `⭐ Nouvel avis ${rating}/5`,
      message: `${req.user.name} a laissé un avis sur "${product.name}"`,
      link:    '/vendor/reviews',
      data:    { reviewId: review._id, rating },
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'Vous avez déjà noté ce produit pour cette commande' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isVisible: true })
      .populate('customer', 'name avatar')
      .sort('-createdAt');
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStoreReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ vendor: req.params.vendorId, isVisible: true })
      .populate('customer', 'name avatar')
      .populate('product',  'name images')
      .sort('-createdAt')
      .limit(20);
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ANALYTIQUES VENDEUR ───────────────────────────────────────────────────────

exports.getOverview = async (req, res) => {
  try {
    const vendorId   = req.user._id;
    const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalProducts, totalOrders, ordersThisMonth,
      revenueAll, revenueMonth, avgRating,
      pendingOrders, lowStock,
    ] = await Promise.all([
      Product.countDocuments({ vendor: vendorId, status: { $ne: 'deleted' } }),
      Order.countDocuments({ 'items.vendor': vendorId }),
      Order.countDocuments({ 'items.vendor': vendorId, createdAt: { $gte: startMonth } }),
      Order.aggregate([
        { $match: { 'items.vendor': vendorId, status: 'delivered' } },
        { $unwind: '$items' },
        { $match: { 'items.vendor': vendorId } },
        { $group: { _id: null, total: { $sum: '$items.subtotal' } } },
      ]),
      Order.aggregate([
        { $match: { 'items.vendor': vendorId, status: 'delivered', createdAt: { $gte: startMonth } } },
        { $unwind: '$items' },
        { $match: { 'items.vendor': vendorId } },
        { $group: { _id: null, total: { $sum: '$items.subtotal' } } },
      ]),
      Review.aggregate([
        { $match: { vendor: vendorId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ 'items.vendor': vendorId, status: 'pending' }),
      Product.countDocuments({ vendor: vendorId, stock: { $lt: 10 } }),
    ]);

    // Commission plateforme (5% par défaut)
    const grossRevenue = revenueAll[0]?.total || 0;
    const commission   = grossRevenue * 0.05;
    const netRevenue   = grossRevenue - commission;

    res.json({
      success: true,
      overview: {
        totalProducts,
        totalOrders,
        ordersThisMonth,
        grossRevenue,
        revenueThisMonth: revenueMonth[0]?.total || 0,
        commission,
        netRevenue,
        avgRating:    Math.round((avgRating[0]?.avg || 0) * 10) / 10,
        totalReviews: avgRating[0]?.count || 0,
        pendingOrders,
        lowStock,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRevenueChart = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days  = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const start = new Date();
    start.setDate(start.getDate() - days);

    const data = await Order.aggregate([
      { $match: { 'items.vendor': req.user._id, status: 'delivered', createdAt: { $gte: start } } },
      { $unwind: '$items' },
      { $match: { 'items.vendor': req.user._id } },
      {
        $group: {
          _id:      { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue:  { $sum: '$items.subtotal' },
          orders:   { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', revenue: 1, orders: 1, _id: 0 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { 'items.vendor': req.user._id, status: 'delivered' } },
      { $unwind: '$items' },
      { $match: { 'items.vendor': req.user._id } },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { name: '$product.name', image: { $arrayElemAt: ['$product.images', 0] }, totalSold: 1, revenue: 1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrdersTrend = async (req, res) => {
  try {
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const data = await Order.aggregate([
      { $match: { 'items.vendor': req.user._id, createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── FINANCES ──────────────────────────────────────────────────────────────────

exports.getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { 'items.vendor': req.user._id, status: 'delivered' };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate)   match.createdAt.$lte = new Date(endDate);
    }

    const revenue = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $match: { 'items.vendor': req.user._id } },
      { $group: { _id: null, gross: { $sum: '$items.subtotal' }, orders: { $sum: 1 } } },
    ]);

    const gross      = revenue[0]?.gross  || 0;
    const commission = gross * 0.05;
    const net        = gross - commission;

    res.json({
      success: true,
      summary: {
        grossRevenue: gross,
        commission,
        netRevenue: net,
        totalOrders: revenue[0]?.orders || 0,
        avgOrderValue: revenue[0]?.orders ? Math.round(gross / revenue[0].orders) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const orders = await Order.find({
      'items.vendor': req.user._id,
      status: 'delivered',
    })
      .select('totalAmount createdAt customer reference_paiement')
      .populate('customer', 'name')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({ success: true, history: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
