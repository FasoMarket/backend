const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AdminSettings = require('../models/AdminSettings');
const PromoCode = require('../models/PromoCode');
const OrderService = require('../services/order.service');
const { sendSuccess, sendError } = require('../utils/sendResponse');
const { transformOrder } = require('../utils/transformers');
const { sendNotification } = require('../socket/socketManager');

// Créer une commande
exports.createOrder = async (req, res) => {
  try {
    console.log('📦 Création commande - user:', req.user._id);
    console.log('📦 Body reçu:', JSON.stringify(req.body, null, 2));
    
    const { paymentMethod, shippingAddress, promoCode } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      populate: { path: 'vendor store' }
    });

    console.log('📦 Panier trouvé:', cart ? `${cart.items?.length || 0} articles` : 'null');

    if (!cart || cart.items.length === 0) {
      return sendError(res, 400, 'Votre panier est vide');
    }

    // Vérifier le stock
    for (const item of cart.items) {
      if (!item.product) {
        console.log('⚠️ Produit null dans le panier');
        continue;
      }
      if (item.product.stock < item.quantity) {
        return sendError(res, 400, `Stock insuffisant pour ${item.product.name}`);
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
      
      // Récupérer le vendorId depuis le produit
      const vendorId = item.product?.vendor?._id || item.product?.vendor;
      const storeId = item.product?.store?._id || item.product?.store;
      
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
    
    // 🔥 PROMO CODE LOGIC
    let discountAmount = 0;
    let appliedPromo = null;

    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (promo) {
        const now = new Date();
        const isStarted = !promo.startDate || promo.startDate <= now;
        const isNotExpired = !promo.endDate || promo.endDate >= now;
        const hasUsesLeft = !promo.maxUses || promo.usedCount < promo.maxUses;
        const notUsedByUser = !promo.usedBy.includes(req.user._id);
        const amountMet = subtotal >= promo.minOrderAmount;

        if (isStarted && isNotExpired && hasUsesLeft && notUsedByUser && amountMet) {
          discountAmount = promo.type === 'percentage' 
            ? Math.round(subtotal * promo.value / 100) 
            : promo.value;
          
          discountAmount = Math.min(discountAmount, subtotal); // Cannot discount more than subtotal
          appliedPromo = promo;
          console.log(`✅ Promo appliquée: ${promoCode} (-${discountAmount} FCFA)`);
        } else {
          console.log(`⚠️ Promo Code ${promoCode} rejeté:`, { isStarted, isNotExpired, hasUsesLeft, notUsedByUser, amountMet });
        }
      }
    }

    const totalPrice = Math.max(0, subtotal - discountAmount) + shippingFee;

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
      paymentStatus: 'pending',
      orderStatus: 'pending',
      commissionRate,
      commissionAmount: orderCommissionAmount,
      netAmount: orderNetAmount,
      promoCode: appliedPromo ? appliedPromo.code : null,
      discountAmount
    });

    // Update Promo Code usage
    if (appliedPromo) {
      await PromoCode.findByIdAndUpdate(appliedPromo._id, {
        $inc: { usedCount: 1 },
        $push: { usedBy: req.user._id }
      });
    }

    // Populate pour la réponse
    await order.populate('user', 'name email');
    await order.populate('items.product');
    await order.populate('items.store');
    await order.populate('items.vendor');

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
        if (product && product.stock < 10 && product.stock > 0) {
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

    sendSuccess(res, 201, transformOrder(order), 'Commande créée avec succès');
  } catch (error) {
    console.error('❌ Erreur création commande:', error);
    sendError(res, 500, error.message);
  }
};

// Obtenir les commandes de l'utilisateur
exports.getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments({ user: req.user._id });
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .populate('items.store')
      .populate('items.vendor')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const transformedOrders = orders.map(transformOrder);

    sendSuccess(res, 200, {
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Commandes récupérées');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Obtenir une commande par ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined') {
      return sendError(res, 400, 'ID de commande invalide');
    }

    let order;
    try {
      order = await Order.findById(id)
        .populate('user', 'name email phone')
        .populate('items.product')
        .populate('items.store')
        .populate('items.vendor');
    } catch (dbErr) {
      if (dbErr.name === 'CastError') {
        return sendError(res, 400, 'Format ID invalide');
      }
      throw dbErr;
    }

    if (!order) {
      return sendError(res, 404, 'Commande non trouvée');
    }

    if (!order.user) {
      return sendError(res, 500, 'Données de commande corrompues (User manquant)');
    }

    const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
    const reqUserId = req.user._id.toString();

    // Autoriser l'acheteur, le vendeur concerné ou l'admin
    const isOwner = orderUserId === reqUserId;
    const isAdmin = req.user.role === 'admin';
    const isVendor = order.items.some(item => {
      const storeOwnerId = item.store?.vendor?.toString() || item.store?.owner?.toString() || item.store?._id?.toString();
      return storeOwnerId === reqUserId;
    });

    if (!isOwner && !isAdmin && !isVendor) {
      return sendError(res, 403, 'Accès non autorisé à cette commande');
    }

    sendSuccess(res, 200, transformOrder(order), 'Commande récupérée');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};
