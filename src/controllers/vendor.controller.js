const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const OrderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/sendResponse');
const { sendNotification } = require('../socket/socketManager');

// Obtenir la boutique du vendeur
exports.getMyStore = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id }).populate('owner', 'name email');

  if (!store) {
    return res.status(404).json({ message: 'Boutique non trouvée' });
  }

  sendSuccess(res, 200, store, 'Boutique récupérée');
});

// Obtenir les commandes du vendeur
exports.getVendorOrders = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });

  if (!store) {
    return res.status(404).json({ message: 'Boutique non trouvée' });
  }

  const orders = await Order.find({ 'items.store': store._id })
    .populate('user', 'name email')
    .populate('items.product')
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, orders, 'Commandes récupérées');
});

// Obtenir les statistiques du vendeur
exports.getVendorStats = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });

  if (!store) {
    return res.status(404).json({ message: 'Boutique non trouvée' });
  }

  const totalProducts = await Product.countDocuments({ store: store._id });
  const lowStockProducts = await Product.countDocuments({ 
    store: store._id, 
    stock: { $lt: 10 } 
  });

  const orderStatsArray = await OrderService.getVendorOrderStats(req.user._id);

  // Transformer le tableau en objet avec les totaux
  let totalRevenue = 0;
  let totalOrders = 0;
  
  if (Array.isArray(orderStatsArray)) {
    orderStatsArray.forEach(stat => {
      totalRevenue += stat.totalGrossRevenue || 0;
      totalOrders += stat.count || 0;
    });
  }

  const stats = {
    totalProducts,
    lowStockProducts,
    orderStats: {
      totalRevenue,
      totalOrders,
      byStatus: orderStatsArray
    },
    store: {
      id: store._id,
      name: store.name,
      rating: store.rating
    }
  };

  sendSuccess(res, 200, stats, 'Statistiques récupérées');
});

// Mettre à jour le statut d'une commande
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    return res.status(404).json({ message: 'Commande non trouvée' });
  }

  const store = await Store.findOne({ owner: req.user._id });
  const hasItem = order.items.some(item => item.store.toString() === store._id.toString());

  if (!hasItem) {
    return res.status(403).json({ message: 'Non autorisé' });
  }

  order.orderStatus = status;
  await order.save();

  // NOTIFICATION
  const io = req.app.get('io');
  const statusMessages = {
    confirmed:  { title: '✅ Commande confirmée',  msg: 'Votre commande a été confirmée par le vendeur',     link: `/my-orders/${order._id}` },
    processing: { title: '⚙️ En préparation',       msg: 'Votre commande est en cours de préparation',        link: `/my-orders/${order._id}` },
    shipped:    { title: '🚚 Commande expédiée !',  msg: 'Votre commande est en route vers vous',             link: `/my-orders/${order._id}` },
    delivered:  { title: '🎉 Commande livrée !',    msg: 'Votre commande a bien été livrée. Bonne utilisation !', link: `/my-orders/${order._id}` },
    cancelled:  { title: '❌ Commande annulée',     msg: 'Votre commande a malheureusement été annulée',      link: `/my-orders/${order._id}` },
  };

  const notifData = statusMessages[status];
  if (notifData) {
    await sendNotification(io, {
      recipientId: order.user,
      type: `order_${status}`,
      title: notifData.title,
      message: notifData.msg,
      link: notifData.link,
      data: { orderId: order._id },
    });
  }

  sendSuccess(res, 200, order, 'Statut mis à jour');
});


// ── CODES PROMO ────────────────────────────────────────────────────────────────

const PromoCode = require('../models/PromoCode');

// Créer un code promo
exports.createPromoCode = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    return res.status(404).json({ message: 'Boutique non trouvée' });
  }

  const { code, type, value, minOrderAmount, maxUses, startDate, endDate } = req.body;
  
  const promoCode = await PromoCode.create({
    code: code?.toUpperCase(),
    type,
    value,
    minOrderAmount: minOrderAmount || 0,
    maxUses: maxUses || null,
    startDate: startDate || new Date(),
    endDate: endDate || null,
    vendor: req.user._id,
    store: store._id,
    isActive: true
  });

  sendSuccess(res, 201, promoCode, 'Code promo créé avec succès');
});

// Obtenir les codes promo du vendeur
exports.getMyPromoCodes = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    return res.status(404).json({ message: 'Boutique non trouvée' });
  }

  const promoCodes = await PromoCode.find({ store: store._id }).sort({ createdAt: -1 });
  sendSuccess(res, 200, promoCodes, 'Codes promo récupérés');
});

// Mettre à jour un code promo
exports.updatePromoCode = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    return res.status(404).json({ message: 'Boutique non trouvée' });
  }

  const promoCode = await PromoCode.findById(req.params.id);
  if (!promoCode || promoCode.store.toString() !== store._id.toString()) {
    return res.status(403).json({ message: 'Non autorisé' });
  }

  Object.assign(promoCode, req.body);
  await promoCode.save();

  sendSuccess(res, 200, promoCode, 'Code promo mis à jour');
});

// Supprimer un code promo
exports.deletePromoCode = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    return res.status(404).json({ message: 'Boutique non trouvée' });
  }

  const promoCode = await PromoCode.findById(req.params.id);
  if (!promoCode || promoCode.store.toString() !== store._id.toString()) {
    return res.status(403).json({ message: 'Non autorisé' });
  }

  await PromoCode.deleteOne({ _id: req.params.id });
  sendSuccess(res, 200, null, 'Code promo supprimé');
});

