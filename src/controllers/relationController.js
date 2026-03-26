const VendorOffer    = require('../models/VendorOffer');
const VendorPayout   = require('../models/VendorPayout');
const VendorWallet   = require('../models/VendorWallet');
const SocialActivity = require('../models/SocialActivity');
const Order          = require('../models/Order');
const User           = require('../models/User');
const Product        = require('../models/Product');
const { sendNotification } = require('../socket/socketManager');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// ════════════════════════════════════════════════════════
// RELATION 1 — VENDEUR → CLIENT
// ════════════════════════════════════════════════════════

// Récupérer les clients qui ont acheté chez ce vendeur
exports.getMyBuyers = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const orders = await Order.find({
      'items.store': req.user._id,
      status: 'delivered',
    }).populate('user', 'name email avatar createdAt');

    const buyerMap = new Map();
    for (const order of orders) {
      if (!order.user) continue;
      const customerId = order.user._id.toString();
      if (!buyerMap.has(customerId)) {
        buyerMap.set(customerId, {
          customer: order.user,
          orderCount: 0,
          totalSpent: 0,
          lastOrderAt: order.createdAt,
        });
      }
      const buyer = buyerMap.get(customerId);
      buyer.orderCount++;
      buyer.totalSpent += order.items
        .filter(i => i.store?.toString() === req.user._id.toString())
        .reduce((s, i) => s + (i.price * i.quantity), 0);
      if (order.createdAt > buyer.lastOrderAt) buyer.lastOrderAt = order.createdAt;
    }

    let buyers = Array.from(buyerMap.values());
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (filter === 'recent_30d') buyers = buyers.filter(b => b.lastOrderAt >= thirtyDaysAgo);
    if (filter === 'repeat') buyers = buyers.filter(b => b.orderCount >= 2);
    buyers.sort((a, b) => b.totalSpent - a.totalSpent);

    res.json({ success: true, buyers, total: buyers.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Créer une offre
exports.createOffer = async (req, res) => {
  try {
    const { title, message, targets, targetUsers, promoCode, productId } = req.body;
    const offer = await VendorOffer.create({
      vendor: req.user._id, title, message, targets,
      targetUsers: targets === 'specific' ? (targetUsers || []) : [],
      promoCode: promoCode || null,
      product: productId || null,
    });

    // Broadcast offer creation
    const io = req.app.get('io');
    if (io) {
      const { broadcastOfferCreated } = require('../socket/socketManager');
      broadcastOfferCreated(io, offer);
    }

    res.status(201).json({ success: true, offer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Envoyer une offre aux clients ciblés
exports.sendOffer = async (req, res) => {
  try {
    const io = req.app.get('io');
    const offer = await VendorOffer.findOne({ _id: req.params.id, vendor: req.user._id });
    if (!offer) return res.status(404).json({ success: false, message: 'Offre introuvable' });
    if (offer.status === 'sent') return res.status(400).json({ success: false, message: 'Offre déjà envoyée' });

    let recipientIds = [];
    if (offer.targets === 'specific') {
      recipientIds = offer.targetUsers.map(u => u.toString());
    } else {
      const matchFilter = { 'items.store': req.user._id, status: 'delivered' };
      if (offer.targets === 'recent_buyers') {
        matchFilter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      }
      const orders = await Order.find(matchFilter).select('user');
      recipientIds = [...new Set(orders.map(o => o.user?.toString()).filter(Boolean))];
    }

    const vendor = await User.findById(req.user._id).select('name');
    for (const recipientId of recipientIds) {
      try {
        await sendNotification(io, {
          recipientId,
          type: 'systeme',
          title: `🎁 Offre de ${vendor.name} : ${offer.title}`,
          message: offer.message,
          link: offer.product ? `/product/${offer.product}` : `/shop/${req.user._id}`,
          data: { vendorId: req.user._id, promoCode: offer.promoCode },
        });
      } catch (notifErr) { console.error('Notif send error:', notifErr.message); }
    }

    offer.status = 'sent';
    offer.sentAt = new Date();
    offer.sentCount = recipientIds.length;
    await offer.save();

    // Broadcast offer sent
    if (io) {
      const { broadcastOfferSent } = require('../socket/socketManager');
      broadcastOfferSent(io, offer);
    }

    res.json({ success: true, message: `Offre envoyée à ${recipientIds.length} client(s)`, sentCount: recipientIds.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyOffers = async (req, res) => {
  try {
    const offers = await VendorOffer.find({ vendor: req.user._id })
      .populate('product', 'name images').sort('-createdAt');
    res.json({ success: true, offers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    await VendorOffer.findOneAndDelete({ _id: offerId, vendor: req.user._id });

    // Broadcast offer deletion
    const io = req.app.get('io');
    if (io) {
      const { broadcastOfferDeleted } = require('../socket/socketManager');
      broadcastOfferDeleted(io, offerId);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════
// RELATION 2 — CLIENT → CLIENT (Social Proof)
// ════════════════════════════════════════════════════════

exports.getProductSocialProof = async (req, res) => {
  try {
    const productId = req.params.productId;
    const pid = new mongoose.Types.ObjectId(productId);

    const [buyersAgg, reviews, wishlistCount] = await Promise.all([
      Order.aggregate([
        { $match: { 'items.product': pid, status: 'delivered' } },
        { $group: { _id: '$user' } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', avatar: '$user.avatar' } },
      ]),
      require('../models/Review').find({ product: productId, isVisible: true })
        .populate('customer', 'name avatar')
        .select('rating customer createdAt comment')
        .sort('-createdAt')
        .limit(3),
      require('../models/Wishlist').countDocuments({ products: pid }),
    ]);

    const stats = await require('../models/Review').aggregate([
      { $match: { product: pid } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]);

    const totalBuyers = buyersAgg.length;
    res.json({
      success: true,
      socialProof: {
        recentBuyers: buyersAgg,
        totalBuyers,
        wishlistCount,
        avgRating: Math.round((stats[0]?.avgRating || 0) * 10) / 10,
        totalReviews: stats[0]?.totalReviews || 0,
        topReviews: reviews,
        socialMessage: totalBuyers > 0
          ? `${totalBuyers} personne${totalBuyers > 1 ? 's ont' : ' a'} acheté ce produit`
          : wishlistCount > 0
          ? `${wishlistCount} personne${wishlistCount > 1 ? 's ont' : ' a'} ce produit en favori`
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTrendingProducts = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trending = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', orderCount: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { orderCount: -1 } },
      { $limit: 12 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $match: { 'product.status': 'active' } },
      { $project: { name: '$product.name', images: '$product.images', price: '$product.price', rating: '$product.rating', orderCount: 1 } },
    ]);
    res.json({ success: true, trending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSocialPrivacy = async (req, res) => {
  try {
    const { isPublic } = req.body;
    await SocialActivity.updateMany({ user: req.user._id }, { isPublic });
    res.json({ success: true, message: isPublic ? 'Activité visible' : 'Activité privée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════
// RELATION 3 — ADMIN → VENDEUR (Paiements)
// ════════════════════════════════════════════════════════

exports.getVendorWallet = async (req, res) => {
  try {
    let wallet = await VendorWallet.findOne({ vendor: req.params.id });
    if (!wallet) wallet = await VendorWallet.create({ vendor: req.params.id });
    await wallet.populate('vendor', 'name email avatar');
    res.json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getVendorEarnings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const vendorId = new mongoose.Types.ObjectId(req.params.id);
    const match = { 'items.store': vendorId, status: 'delivered' };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate)   match.createdAt.$lte = new Date(endDate);
    }

    const paidOrderIds = await VendorPayout.find({ vendor: req.params.id }).distinct('orders');
    const unpaidOrders = await Order.find({ ...match, _id: { $nin: paidOrderIds } })
      .select('_id totalPrice items createdAt');

    let grossAmount = 0;
    const orderDetails = [];
    for (const order of unpaidOrders) {
      const vendorItems = order.items.filter(i => i.store?.toString() === req.params.id);
      const orderTotal = vendorItems.reduce((s, i) => s + (i.price * i.quantity), 0);
      grossAmount += orderTotal;
      orderDetails.push({ orderId: order._id, amount: orderTotal, date: order.createdAt });
    }

    const AdminSettings = require('../models/AdminSettings');
    const settings = await AdminSettings.findOne({ singleton: true });
    const commissionRate = settings?.billing?.commissionRate || 5;
    const commission = grossAmount * commissionRate / 100;

    res.json({
      success: true,
      earnings: {
        grossAmount, commission, commissionRate,
        netAmount: grossAmount - commission,
        orderCount: unpaidOrders.length,
        orders: orderDetails,
        period: { startDate, endDate },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllPayouts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filtre = status ? { status } : {};
    const [payouts, total] = await Promise.all([
      VendorPayout.find(filtre)
        .populate('vendor', 'name email avatar')
        .populate('processedBy', 'name')
        .sort('-createdAt')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      VendorPayout.countDocuments(filtre),
    ]);
    res.json({ success: true, payouts, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPendingPayouts = async (req, res) => {
  try {
    const AdminSettings = require('../models/AdminSettings');
    const settings = await AdminSettings.findOne({ singleton: true });
    const rate = settings?.billing?.commissionRate || 5;

    // Get all unique vendor IDs from delivered orders
    const vendorIds = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.store' } },
      { $match: { _id: { $ne: null } } },
    ]);

    const pending = await Promise.all(
      vendorIds.map(async ({ _id: vendorId }) => {
        if (!vendorId) return null;
        const paidOrderIds = await VendorPayout.find({
          vendor: vendorId, status: { $in: ['paid', 'processing'] },
        }).distinct('orders');

        const unpaidOrders = await Order.find({
          'items.store': vendorId,
          status: 'delivered',
          _id: { $nin: paidOrderIds },
        });

        if (unpaidOrders.length === 0) return null;

        const gross = unpaidOrders.reduce((s, o) => {
          return s + o.items
            .filter(i => i.store?.toString() === vendorId.toString())
            .reduce((si, i) => si + (i.price * i.quantity), 0);
        }, 0);

        if (gross === 0) return null;

        const vendor = await User.findById(vendorId).select('name email avatar');
        if (!vendor) return null;
        const wallet = await VendorWallet.findOne({ vendor: vendorId }).select('paymentInfo');

        return {
          vendor: { _id: vendorId, name: vendor.name, email: vendor.email, avatar: vendor.avatar },
          grossAmount: gross,
          commission: gross * rate / 100,
          netAmount: gross * (1 - rate / 100),
          commissionRate: rate,
          orderCount: unpaidOrders.length,
          paymentInfo: wallet?.paymentInfo || null,
        };
      })
    );

    const result = pending.filter(Boolean).sort((a, b) => b.netAmount - a.netAmount);
    res.json({ success: true, pending: result, total: result.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.processPayout = async (req, res) => {
  try {
    const {
      vendorId, amount, grossAmount, commission, commissionRate,
      orderIds, paymentMethod, paymentNumber, startDate, endDate, notes,
    } = req.body;
    const io = req.app.get('io');
    const reference = `PAY-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;

    const payout = await VendorPayout.create({
      vendor: vendorId,
      processedBy: req.user._id,
      amount, grossAmount, commission, commissionRate,
      period: { startDate: startDate || new Date(), endDate: endDate || new Date() },
      orders: orderIds || [],
      paymentMethod, paymentNumber, reference,
      status: 'processing',
      notes: notes || '',
    });

    await VendorWallet.findOneAndUpdate(
      { vendor: vendorId },
      { $inc: { totalPaid: amount, totalCommission: commission, totalEarned: grossAmount }, $set: { lastPayoutAt: new Date() } },
      { upsert: true }
    );

    try {
      await sendNotification(io, {
        recipientId: vendorId,
        type: 'systeme',
        title: '💰 Paiement en cours !',
        message: `Un versement de ${amount.toLocaleString()} FCFA est en cours vers votre ${paymentMethod.replace(/_/g, ' ')} (${paymentNumber})`,
        link: '/vendor/wallet',
        data: { payoutId: payout._id, amount, reference },
      });
    } catch (notifErr) { console.error('Payout notif error:', notifErr.message); }

    res.status(201).json({ success: true, payout, reference });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.confirmPayout = async (req, res) => {
  try {
    const io = req.app.get('io');
    const payout = await VendorPayout.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidAt: new Date() },
      { new: true }
    ).populate('vendor', 'name _id');

    if (!payout) return res.status(404).json({ success: false, message: 'Paiement introuvable' });

    try {
      await sendNotification(io, {
        recipientId: payout.vendor._id,
        type: 'systeme',
        title: '✅ Paiement confirmé !',
        message: `Votre versement de ${payout.amount.toLocaleString()} FCFA a été confirmé. Réf : ${payout.reference}`,
        link: '/vendor/wallet',
        data: { payoutId: payout._id, amount: payout.amount },
      });
    } catch (notifErr) { console.error('Confirm notif error:', notifErr.message); }

    res.json({ success: true, payout });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.failPayout = async (req, res) => {
  try {
    const io = req.app.get('io');
    const payout = await VendorPayout.findByIdAndUpdate(
      req.params.id,
      { status: 'failed' },
      { new: true }
    ).populate('vendor', 'name _id');

    if (!payout) return res.status(404).json({ success: false, message: 'Paiement introuvable' });

    await VendorWallet.findOneAndUpdate(
      { vendor: payout.vendor._id },
      { $inc: { totalPaid: -payout.amount, totalCommission: -payout.commission, totalEarned: -payout.grossAmount } }
    );

    try {
      await sendNotification(io, {
        recipientId: payout.vendor._id,
        type: 'systeme',
        title: '❌ Échec du paiement',
        message: `Le versement de ${payout.amount.toLocaleString()} FCFA a échoué. L'administrateur vous recontactera.`,
        link: '/vendor/wallet',
      });
    } catch (notifErr) { console.error('Fail notif error:', notifErr.message); }

    res.json({ success: true, payout });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── WALLET VENDEUR ──
exports.getMyWallet = async (req, res) => {
  try {
    let wallet = await VendorWallet.findOne({ vendor: req.user._id });
    if (!wallet) wallet = await VendorWallet.create({ vendor: req.user._id });

    const paidOrderIds = await VendorPayout.find({
      vendor: req.user._id, status: { $in: ['paid', 'processing'] },
    }).distinct('orders');

    const unpaidOrders = await Order.find({
      'items.store': req.user._id, status: 'delivered',
      _id: { $nin: paidOrderIds },
    });

    const AdminSettings = require('../models/AdminSettings');
    const settings = await AdminSettings.findOne({ singleton: true });
    const commissionRate = settings?.billing?.commissionRate || 5;

    const pendingGross = unpaidOrders.reduce((s, o) => {
      return s + o.items
        .filter(i => i.store?.toString() === req.user._id.toString())
        .reduce((si, i) => si + (i.price * i.quantity), 0);
    }, 0);

    res.json({
      success: true,
      wallet: {
        ...wallet.toObject(),
        pendingBalance: Math.round(pendingGross * (1 - commissionRate / 100)),
        pendingGross,
        commissionRate,
        unpaidOrderCount: unpaidOrders.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyPayouts = async (req, res) => {
  try {
    const payouts = await VendorPayout.find({ vendor: req.user._id })
      .populate('processedBy', 'name').sort('-createdAt');
    res.json({ success: true, payouts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePaymentInfo = async (req, res) => {
  try {
    const { method, number, name } = req.body;
    await VendorWallet.findOneAndUpdate(
      { vendor: req.user._id },
      { $set: { paymentInfo: { method, number, name } } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Coordonnées de paiement mises à jour' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
