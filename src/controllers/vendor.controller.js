const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const OrderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/sendResponse');
const { sendNotification } = require('../socket/socketManager');

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
