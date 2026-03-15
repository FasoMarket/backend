const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const OrderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/sendResponse');

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

  const orderStats = await OrderService.getVendorOrderStats(req.user._id);

  const stats = {
    totalProducts,
    lowStockProducts,
    orderStats,
    store: {
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

  sendSuccess(res, 200, order, 'Statut mis à jour');
});
