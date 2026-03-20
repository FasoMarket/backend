const Category     = require('../models/Category');
const Banner       = require('../models/Banner');
const Featured     = require('../models/Featured');
const PromoCode    = require('../models/PromoCode');
const Dispute      = require('../models/Dispute');
const Refund       = require('../models/Refund');
const Announcement = require('../models/Announcement');
const User         = require('../models/User');
const Order        = require('../models/Order');
const Product      = require('../models/Product');
const Store        = require('../models/Store');
const { sendNotification } = require('../socket/socketManager');

// ── BANNIÈRES ─────────────────────────────────────────────────────────────────

exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort('order');
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const { title, subtitle, link, position, startDate, endDate } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
    if (!image) return res.status(400).json({ success: false, message: 'Image requise' });
    const count  = await Banner.countDocuments();
    const banner = await Banner.create({ title, subtitle, image, link, position, startDate, endDate, order: count });
    res.status(201).json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = `/uploads/${req.file.filename}`;
    const banner = await Banner.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Bannière introuvable' });
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bannière supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Bannière introuvable' });
    banner.isActive = !banner.isActive;
    await banner.save();
    res.json({ success: true, isActive: banner.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── EN VEDETTE ────────────────────────────────────────────────────────────────

exports.getFeatured = async (req, res) => {
  try {
    const featured = await Featured.find().sort('order');
    const populated = await Promise.all(featured.map(async (f) => {
      const Model = f.type === 'product' ? Product : Store;
      const ref   = await Model.findById(f.refId).select('name images logo slug price');
      return { ...f.toObject(), ref };
    }));
    res.json({ success: true, featured: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addFeatured = async (req, res) => {
  try {
    const { type, refId } = req.body;
    const count    = await Featured.countDocuments({ type });
    const featured = await Featured.create({ type, refId, addedBy: req.user._id, order: count });
    res.status(201).json({ success: true, featured });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeFeatured = async (req, res) => {
  try {
    await Featured.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Retiré de la sélection' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CODES PROMO ───────────────────────────────────────────────────────────────

exports.getPromoCodes = async (req, res) => {
  try {
    const codes = await PromoCode.find().sort('-createdAt');
    res.json({ success: true, codes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPromoCode = async (req, res) => {
  try {
    const code = await PromoCode.create({ ...req.body, code: req.body.code?.toUpperCase() });
    res.status(201).json({ success: true, code });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Ce code existe déjà' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePromoCode = async (req, res) => {
  try {
    const code = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!code) return res.status(404).json({ success: false, message: 'Code introuvable' });
    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePromoCode = async (req, res) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.togglePromoCode = async (req, res) => {
  try {
    const code = await PromoCode.findById(req.params.id);
    if (!code) return res.status(404).json({ success: false, message: 'Code introuvable' });
    code.isActive = !code.isActive;
    await code.save();
    res.json({ success: true, isActive: code.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── LITIGES ───────────────────────────────────────────────────────────────────

exports.getDisputes = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const disputes = await Dispute.find(filter)
      .populate('order',     'totalPrice createdAt')
      .populate('initiator', 'name email role')
      .populate('against',   'name email role')
      .sort('-createdAt');
    res.json({ success: true, disputes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDisputeDetail = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('order',     'totalPrice createdAt items')
      .populate('initiator', 'name email avatar')
      .populate('against',   'name email avatar')
      .populate('resolvedBy','name');
    if (!dispute) return res.status(404).json({ success: false, message: 'Litige introuvable' });
    res.json({ success: true, dispute });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { resolution, winner } = req.body;
    const io = req.app.get('io');
    const dispute = await Dispute.findByIdAndUpdate(req.params.id, {
      status:     `resolved_${winner}`,
      resolution,
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
    }, { new: true }).populate('initiator against');

    if (!dispute) return res.status(404).json({ success: false, message: 'Litige introuvable' });

    const winnerUser = winner === 'client' ? dispute.initiator : dispute.against;
    const loserUser  = winner === 'client' ? dispute.against   : dispute.initiator;

    await sendNotification(io, { recipientId: winnerUser._id, type: 'order_confirmed', title: '✅ Litige résolu en votre faveur', message: `Décision : ${resolution}`, link: `/my-orders/${dispute.order}` });
    await sendNotification(io, { recipientId: loserUser._id,  type: 'order_cancelled', title: '❌ Litige résolu', message: `Décision : ${resolution}`, link: `/my-orders/${dispute.order}` });

    res.json({ success: true, dispute });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.closeDispute = async (req, res) => {
  try {
    await Dispute.findByIdAndUpdate(req.params.id, { status: 'closed' });
    res.json({ success: true, message: 'Litige clôturé' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── REMBOURSEMENTS ────────────────────────────────────────────────────────────

exports.getRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find()
      .populate('order',  'totalPrice')
      .populate('client', 'name email')
      .populate('processedBy', 'name')
      .sort('-createdAt');
    res.json({ success: true, refunds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveRefund = async (req, res) => {
  try {
    const io = req.app.get('io');
    const refund = await Refund.findByIdAndUpdate(req.params.id, {
      status:      'approved',
      processedBy: req.user._id,
      processedAt: new Date(),
      notes:       req.body.notes || '',
    }, { new: true }).populate('client');
    if (!refund) return res.status(404).json({ success: false, message: 'Demande introuvable' });
    await sendNotification(io, { recipientId: refund.client._id, type: 'order_cancelled', title: '💰 Remboursement approuvé', message: `Votre remboursement de ${refund.amount.toLocaleString()} FCFA a été approuvé.`, link: `/my-orders/${refund.order}` });
    res.json({ success: true, refund });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectRefund = async (req, res) => {
  try {
    const io = req.app.get('io');
    const refund = await Refund.findByIdAndUpdate(req.params.id, {
      status:      'rejected',
      processedBy: req.user._id,
      processedAt: new Date(),
      notes:       req.body.notes || '',
    }, { new: true }).populate('client');
    if (!refund) return res.status(404).json({ success: false, message: 'Demande introuvable' });
    await sendNotification(io, { recipientId: refund.client._id, type: 'order_cancelled', title: '❌ Remboursement refusé', message: `Raison : ${req.body.notes || 'Non précisée'}`, link: `/my-orders/${refund.order}` });
    res.json({ success: true, refund });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── COMMUNICATION ─────────────────────────────────────────────────────────────

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().populate('sentBy', 'name').sort('-createdAt');
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendAnnouncement = async (req, res) => {
  try {
    const { title, content, target, channels } = req.body;
    const io = req.app.get('io');

    const roleFilter = target === 'all' ? {} : { role: target === 'customers' ? 'customer' : 'vendor' };
    const recipients = await User.find({ ...roleFilter }).select('_id');

    const announcement = await Announcement.create({
      title, content, target, channels,
      sentAt: new Date(),
      sentBy: req.user._id,
      recipientCount: recipients.length,
    });

    if (channels.includes('notification')) {
      for (const recipient of recipients) {
        await sendNotification(io, { recipientId: recipient._id, type: 'systeme', title, message: content.length > 120 ? content.substring(0, 120) + '…' : content, link: null });
      }
    }

    res.json({ success: true, announcement, sent: recipients.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ANALYTIQUES ───────────────────────────────────────────────────────────────

exports.getOverview = async (req, res) => {
  try {
    const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalUsers, totalVendors, totalProducts, totalOrders, ordersThisMonth, revenueAgg, pendingDisputes, pendingRefunds] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'vendor' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startMonth } }),
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      Dispute.countDocuments({ status: 'open' }).catch(() => 0),
      Refund.countDocuments({ status: 'pending' }).catch(() => 0),
    ]);

    res.json({
      success: true,
      overview: {
        totalUsers, totalVendors, totalProducts, totalOrders,
        ordersThisMonth,
        totalRevenue:  revenueAgg[0]?.total || 0,
        pendingDisputes,
        pendingRefunds,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRevenueChart = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days  = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const start = new Date();
    start.setDate(start.getDate() - days);

    const data = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
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
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$product.name', 'Produit supprimé'] }, image: { $arrayElemAt: ['$product.images', 0] }, totalSold: 1, revenue: 1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTopVendors = async (req, res) => {
  try {
    const data = await Store.find().select('name owner').populate('owner', 'name email').limit(10).lean();
    // Enrichit avec leurs commandes
    const enriched = await Promise.all(data.map(async (store) => {
      const agg = await Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.store': store._id } },
        { $group: { _id: null, totalOrders: { $sum: 1 }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      ]);
      return { ...store, totalOrders: agg[0]?.totalOrders || 0, revenue: agg[0]?.revenue || 0 };
    }));
    enriched.sort((a, b) => b.revenue - a.revenue);
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrdersByStatus = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUsersGrowth = async (req, res) => {
  try {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, role: '$role' }, count: { $sum: 1 } } },
      { $sort: { '_id.date': 1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { paymentStatus: 'paid' };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate)   match.createdAt.$lte = new Date(endDate);
    }
    const [revenueAgg, refundAgg] = await Promise.all([
      Order.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } }]),
      Refund.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    const totalRefunds = refundAgg[0]?.total  || 0;
    res.json({
      success: true,
      financial: {
        totalRevenue,
        totalOrders:      revenueAgg[0]?.count || 0,
        totalCommissions: Math.round(totalRevenue * 0.05),
        totalRefunds,
        netRevenue:       totalRevenue - totalRefunds,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
