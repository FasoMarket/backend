const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AdminSettings = require('../models/AdminSettings');
const OrderService = require('../services/order.service');
const { sendSuccess, sendError } = require('../utils/sendResponse');
const { sendNotification } = require('../socket/socketManager');

// Créer une commande
exports.createOrder = async (req, res) => {
  try {
    const { paymentMethod, shippingAddress } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Votre panier est vide' });
    }

    // Vérifier le stock
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Stock insuffisant pour ${item.product.name}` 
        });
      }
    }

    // Rechercher les réglages admin pour la commission
    const adminSettings = await AdminSettings.findOne() || { billing: { commissionRate: 5 } };
    const commissionRate = adminSettings.billing?.commissionRate || 5;

    // Calculer le total et les commissions par article
    let subtotal = 0;
    const orderItems = cart.items.map(item => {
      const itemTotal = (item.price || 0) * item.quantity;
      subtotal += itemTotal;
      const itemCommission = (itemTotal * commissionRate) / 100;
      
      const storeId = item.product?.store || item.product?.vendor || req.user._id; 
      const vendorId = item.product?.vendor || storeId; // On essaie de récupérer le vendor direct
      
      return {
        product: item.product?._id || item.product,
        store: storeId,
        vendor: vendorId,
        quantity: item.quantity,
        price: item.price || 0,
        commissionAmount: itemCommission,
        netAmount: itemTotal - itemCommission
      };
    });

    // Frais de livraison (Gratuit si > 50000)
    const shippingFee = subtotal > 50000 ? 0 : 1500;
    const totalPrice = subtotal + shippingFee;

    // Calculer les totaux de commission pour la commande entière
    const orderCommissionAmount = orderItems.reduce((sum, item) => sum + item.commissionAmount, 0);
    const orderNetAmount = orderItems.reduce((sum, item) => sum + item.netAmount, 0);

    // Créer la commande
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalPrice,
      shippingAddress,
      paymentMethod: paymentMethod || 'mobile_money',
      // Billing functional
      commissionRate,
      commissionAmount: orderCommissionAmount,
      netAmount: orderNetAmount
    });

    // Mettre à jour le stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Snapshot des articles avant vidage du panier
    const cartItemsSnapshot = cart.items.slice();

    // Vider le panier
    cart.items = [];
    await cart.save();

    // NOTIFICATIONS (async, no await to avoid blocking the response)
    const io = req.app.get('io');
    
    // Notifier les vendeurs concernés
    const vendorIds = [...new Set(orderItems.map(i => i.vendor?.toString()).filter(Boolean))];
    for (const vendorId of vendorIds) {
      try {
        await sendNotification(io, {
          recipientId: vendorId,
          type: 'order_placed',
          title: '🛒 Nouvelle commande reçue !',
          message: `${req.user.name} vient de passer une commande de ${totalPrice.toLocaleString()} FCFA`,
          link: '/vendor/orders',
          data: { orderId: order._id },
        });
      } catch (notifErr) { console.error('Notification vendor error:', notifErr); }
    }

    // Vérifier le stock faible (utiliser le snapshot AVANT vidage)
    for (const item of cartItemsSnapshot) {
      try {
        const product = await Product.findById(item.product?._id || item.product);
        if (product && product.stock <= 5 && product.stock > 0) {
          const recipientId = product.store || product.vendor;
          if (recipientId) {
            await sendNotification(io, {
              recipientId,
              type: 'low_stock',
              title: '⚠️ Stock faible',
              message: `Il ne reste que ${product.stock} unité(s) pour "${product.name}"`,
              link: '/vendor/products',
              data: { productId: product._id, stock: product.stock },
            });
          }
        }
      } catch (notifErr) { console.error('Low stock notification error:', notifErr); }
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les commandes de l'utilisateur
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .populate('items.store')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir une commande par ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DEBUG: Fetching order by ID:', id);

    if (!id || id === 'undefined') {
      console.log('DEBUG: Invalid ID provided');
      return res.status(400).json({ message: 'ID de commande invalide' });
    }

    let order;
    try {
      order = await Order.findById(id)
        .populate('user', 'name email phone')
        .populate('items.product')
        .populate('items.store');
    } catch (dbErr) {
      console.error('DEBUG: DB Error during findById:', dbErr);
      if (dbErr.name === 'CastError') {
        return res.status(400).json({ message: 'Format ID invalide', details: dbErr.message });
      }
      throw dbErr;
    }

    if (!order) {
      console.log('DEBUG: Order not found for ID:', id);
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    console.log('DEBUG: Order found, checking authorization');
    
    if (!order.user) {
      console.error('DEBUG: CRITICAL - Order exists but has no user:', id);
      return res.status(500).json({ message: 'Données de commande corrompues (User manquant)' });
    }

    const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
    const reqUserId = req.user._id.toString();

    console.log(`DEBUG: Comparing order.user (${orderUserId}) with req.user (${reqUserId})`);

    // Autoriser l'acheteur, le vendeur concerné ou l'admin
    const isOwner = orderUserId === reqUserId;
    const isAdmin = req.user.role === 'admin';
    const isVendor = order.items.some(item => {
      const storeOwnerId = item.store?.vendor?.toString() || item.store?.owner?.toString() || item.store?._id?.toString();
      return storeOwnerId === reqUserId;
    });

    if (!isOwner && !isAdmin && !isVendor) {
      console.warn(`DEBUG: Unauthorized access attempt by ${reqUserId} on order ${id}`);
      return res.status(403).json({ message: 'Accès non autorisé à cette commande' });
    }

    console.log('DEBUG: Order retrieval successful');
    res.json(order);
  } catch (error) {
    console.error('DEBUG: Unexpected error in getOrderById:', error);
    res.status(500).json({ 
      message: 'Erreur interne du serveur lors de la récupération de la commande',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
