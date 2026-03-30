const Wishlist        = require('../models/Wishlist');
const BrowsingHistory = require('../models/BrowsingHistory');
const Address         = require('../models/Address');
const Order           = require('../models/Order');
const Review          = require('../models/Review');
const Dispute         = require('../models/Dispute');
const Refund          = require('../models/Refund');
const Report          = require('../models/Report');
const PromoCode       = require('../models/PromoCode');
const Product         = require('../models/Product');
const User            = require('../models/User');
const { sendNotification } = require('../socket/socketManager');

// ── FAVORIS ───────────────────────────────────────────────────────────────────

exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ customer: req.user._id })
      .populate({ path: 'products', populate: [{ path: 'vendor', select: 'name' }, { path: 'category', select: 'name' }] });
    res.json({ success: true, products: wishlist?.products || [] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addToWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate(
      { customer: req.user._id },
      { $addToSet: { products: req.params.productId } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Ajouté aux favoris' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate(
      { customer: req.user._id },
      { $pull: { products: req.params.productId } }
    );
    res.json({ success: true, message: 'Retiré des favoris' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.checkWishlistStatus = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ customer: req.user._id, products: req.params.productId });
    res.json({ success: true, isFavorite: !!wishlist });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── HISTORIQUE ────────────────────────────────────────────────────────────────

exports.addToHistory = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.productId, { $inc: { viewCount: 1 } });
    await BrowsingHistory.findOneAndUpdate(
      { customer: req.user._id },
      { $pull: { products: { product: req.params.productId } } },
      { upsert: true }
    );
    await BrowsingHistory.findOneAndUpdate(
      { customer: req.user._id },
      { $push: { products: { $each: [{ product: req.params.productId, viewedAt: new Date() }], $position: 0, $slice: 20 } } }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getHistory = async (req, res) => {
  try {
    const history  = await BrowsingHistory.findOne({ customer: req.user._id })
      .populate({ path: 'products.product', populate: { path: 'category', select: 'name' } });
    const products = history?.products.filter(h => h.product).map(h => ({ ...h.product.toObject(), viewedAt: h.viewedAt })) || [];
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.clearHistory = async (req, res) => {
  try {
    await BrowsingHistory.findOneAndUpdate({ customer: req.user._id }, { $set: { products: [] } });
    res.json({ success: true, message: 'Historique effacé' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── ADRESSES ──────────────────────────────────────────────────────────────────

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ customer: req.user._id }).sort('-isDefault -createdAt');
    res.json({ success: true, addresses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createAddress = async (req, res) => {
  try {
    const { label, fullName, phone, street, city, district, isDefault } = req.body;
    if (isDefault) await Address.updateMany({ customer: req.user._id }, { isDefault: false });
    const count   = await Address.countDocuments({ customer: req.user._id });
    const address = await Address.create({
      customer: req.user._id, label, fullName, phone, street, city, district,
      isDefault: isDefault || count === 0,
    });
    res.status(201).json({ success: true, address });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, customer: req.user._id }, req.body, { new: true }
    );
    res.json({ success: true, address });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, customer: req.user._id });
    if (address?.isDefault) await Address.findOneAndUpdate({ customer: req.user._id }, { isDefault: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    await Address.updateMany({ customer: req.user._id }, { isDefault: false });
    await Address.findOneAndUpdate({ _id: req.params.id, customer: req.user._id }, { isDefault: true });
    res.json({ success: true, message: 'Adresse par défaut mise à jour' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── COMMANDES CLIENT ──────────────────────────────────────────────────────────

exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filtre = { user: req.user._id };
    if (status) filtre.status = status;
    const [orders, total] = await Promise.all([
      Order.find(filtre).populate('items.product', 'name images price').sort('-createdAt')
        .limit(Number(limit)).skip((Number(page) - 1) * Number(limit)),
      Order.countDocuments(filtre),
    ]);
    res.json({ success: true, orders, total, page: Number(page) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.product', 'name images price');
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOrderTimeline = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });

    const allSteps = [
      { key: 'pending',    label: 'Commande passée',    icon: '🛒', description: 'Votre commande a été enregistrée' },
      { key: 'paid',       label: 'Paiement confirmé',  icon: '💳', description: 'Votre paiement a été validé' },
      { key: 'confirmed',  label: 'Confirmée',          icon: '✅', description: 'Le vendeur a confirmé votre commande' },
      { key: 'processing', label: 'En préparation',     icon: '📦', description: 'Votre commande est en cours de préparation' },
      { key: 'shipped',    label: 'Expédiée',           icon: '🚚', description: 'Votre commande est en route' },
      { key: 'delivered',  label: 'Livrée',             icon: '🎉', description: 'Votre commande a bien été livrée' },
    ];
    const statusOrder = ['pending', 'paid', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIdx  = statusOrder.indexOf(order.orderStatus);
    const timeline    = allSteps.map((step, i) => ({
      ...step, completed: i <= currentIdx, current: i === currentIdx,
      date: i <= currentIdx ? (i === 0 ? order.createdAt : order.updatedAt) : null,
    }));
    if (order.orderStatus === 'cancelled')
      timeline.push({ key: 'cancelled', label: 'Annulée', icon: '❌', completed: true, current: true, date: order.updatedAt });

    res.json({ success: true, timeline, currentStatus: order.orderStatus });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });
    if (!['pending', 'paid'].includes(order.orderStatus))
      return res.status(400).json({ success: false, message: 'Cette commande ne peut plus être annulée' });

    order.orderStatus = 'cancelled';
    await order.save();

    // Remettre les stocks
    for (const item of order.items)
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });

    // Notifier les vendeurs
    const io        = req.app.get('io');
    const fullOrder = await Order.findById(order._id).populate('items.vendor');
    const vendorIds = [...new Set(fullOrder.items.map(i => i.vendor?.toString()))].filter(Boolean);
    for (const vendorId of vendorIds) {
      await sendNotification(io, {
        recipientId: vendorId, type: 'order_cancelled',
        title:   '❌ Commande annulée',
        message: `${req.user.name} a annulé sa commande #${order._id.toString().slice(-6).toUpperCase()}`,
        link:    '/vendor/orders', data: { orderId: order._id },
      });
    }
    res.json({ success: true, message: 'Commande annulée avec succès' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('user', 'name email phone')
      .populate('items.product', 'name price')
      .populate('items.store',   'name');
      
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });

    // Shipping Logic
    const shipping = order.totalPrice > 50000 ? 0 : 1500;
    const subtotal = order.totalPrice - shipping;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Arial', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
    .logo { font-size: 28px; font-weight: bold; color: #16a34a; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
    .address-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .address-box { flex: 1; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f8fafc; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .total-section { margin-top: 30px; border-top: 2px solid #16a34a; padding-top: 20px; text-align: right; }
    .total-row { display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px; }
    .total-label { color: #64748b; font-weight: bold; }
    .total-value { font-weight: bold; width: 120px; }
    .grand-total { font-size: 20px; color: #16a34a; }
    .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">FasoMarket</div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:bold">FACTURE</div>
      <div style="color:#64748b">#${order._id.toString().slice(-8).toUpperCase()}</div>
      <div style="color:#64748b">${new Date(order.createdAt).toLocaleDateString('fr-FR')}</div>
    </div>
  </div>

  <div class="address-section">
    <div class="address-box">
      <p style="font-size:11px; font-weight:bold; color:#64748b; margin-bottom:5px; text-transform:uppercase;">Facturé à</p>
      <p><strong>${order.user?.name || ''}</strong></p>
      <p style="color:#64748b; font-size:12px;">${order.user?.email || ''}</p>
      <p style="color:#64748b; font-size:12px;">${order.user?.phone || ''}</p>
    </div>
    ${order.shippingAddress ? `
    <div class="address-box" style="text-align:right">
      <p style="font-size:11px; font-weight:bold; color:#64748b; margin-bottom:5px; text-transform:uppercase;">Livré à</p>
      <p><strong>${order.shippingAddress.fullName}</strong></p>
      <p style="color:#64748b; font-size:12px;">${order.shippingAddress.street || ''}, ${order.shippingAddress.district || ''}</p>
      <p style="color:#64748b; font-size:12px;">${order.shippingAddress.city}, Burkina Faso</p>
    </div>
    ` : ''}
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th>Boutique</th><th>Qté</th><th>Prix Unit.</th><th>Total</th></tr>
    </thead>
    <tbody>
      ${order.items.map(i => `
        <tr>
          <td><strong>${i.product?.name || ''}</strong></td>
          <td>${i.store?.name || 'Vendeur FasoMarket'}</td>
          <td>${i.quantity}</td>
          <td>${i.price?.toLocaleString()} FCFA</td>
          <td><strong>${(i.price * i.quantity).toLocaleString()} FCFA</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-row">
      <span class="total-label">Sous-total</span>
      <span class="total-value">${subtotal.toLocaleString()} FCFA</span>
    </div>
    <div class="total-row">
      <span class="total-label">Livraison</span>
      <span class="total-value" style="color:${shipping === 0 ? '#16a34a' : 'inherit'}">${shipping === 0 ? 'GRATUIT' : shipping.toLocaleString() + ' FCFA'}</span>
    </div>
    <div class="total-row" style="margin-top:10px;">
      <span class="total-label" style="font-size:16px; color:#1e293b;">TOTAL</span>
      <span class="total-value grand-total">${order.totalPrice?.toLocaleString()} FCFA</span>
    </div>
  </div>

  <div class="footer">
    <p>FasoMarket · La marketplace d'excellence au Burkina Faso</p>
    <p>Merci pour votre achat ! En cas de litige, contactez notre support dans les 48h.</p>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${order._id.toString().slice(-8)}.html"`);
    res.send(html);
  } catch (err) {
    console.error('Invoice Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── LITIGES ───────────────────────────────────────────────────────────────────

exports.openDispute = async (req, res) => {
  try {
    const { orderId, reason, description } = req.body;
    const io    = req.app.get('io');
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });

    const vendorId = order.items[0]?.vendor;
    const dispute  = await Dispute.create({ order: orderId, initiator: req.user._id, against: vendorId, reason, description });

    if (vendorId) {
      await sendNotification(io, {
        recipientId: vendorId, type: 'systeme',
        title: '⚠️ Litige ouvert',
        message: `${req.user.name} a ouvert un litige sur la commande #${orderId.toString().slice(-6).toUpperCase()}`,
        link: `/vendor/orders/${orderId}`,
      });
    }
    res.status(201).json({ success: true, dispute });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ initiator: req.user._id })
      .populate('order', 'totalPrice createdAt').populate('against', 'name').sort('-createdAt');
    res.json({ success: true, disputes });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getDisputeDetail = async (req, res) => {
  try {
    const dispute = await Dispute.findOne({ _id: req.params.id, initiator: req.user._id })
      .populate('order', 'totalPrice items').populate('against', 'name avatar');
    if (!dispute) return res.status(404).json({ success: false, message: 'Litige introuvable' });
    res.json({ success: true, dispute });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── REMBOURSEMENTS ────────────────────────────────────────────────────────────

exports.requestRefund = async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });
    if (!['delivered', 'cancelled'].includes(order.orderStatus))
      return res.status(400).json({ success: false, message: 'Remboursement non disponible pour cette commande' });

    const refund = await Refund.create({ order: orderId, client: req.user._id, amount: amount || order.totalPrice, reason });
    res.status(201).json({ success: true, refund, message: 'Demande de remboursement envoyée — réponse sous 48h' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getMyRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({ client: req.user._id })
      .populate('order', 'totalPrice createdAt').sort('-createdAt');
    res.json({ success: true, refunds });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── AVIS ──────────────────────────────────────────────────────────────────────

exports.createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    
    console.log('📝 createReview - Données reçues:', { productId, orderId, rating, comment, userId: req.user._id });
    
    // Vérifier que productId n'est pas vide
    if (!productId || productId.trim() === '') {
      console.log('❌ productId vide');
      return res.status(400).json({ success: false, message: 'ID du produit manquant' });
    }
    
    const order = await Order.findOne({ _id: orderId, user: req.user._id, orderStatus: 'delivered' });
    console.log('📝 createReview - Commande trouvée:', order ? 'OUI' : 'NON');
    
    if (!order) {
      console.log('❌ Commande non trouvée ou statut incorrect');
      return res.status(400).json({ success: false, message: 'Commande non trouvée ou non livrée' });
    }
    
    // Vérifier que le produit est dans la commande
    const itemInOrder = order.items.some(item => item.product.toString() === productId);
    console.log('📝 createReview - Produit dans commande:', itemInOrder ? 'OUI' : 'NON');
    console.log('📝 createReview - Items:', order.items.map(i => i.product.toString()));
    
    if (!itemInOrder) {
      console.log('❌ Produit non trouvé dans la commande');
      return res.status(400).json({ success: false, message: 'Ce produit n\'est pas dans cette commande' });
    }
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable' });

    const review = await Review.create({ product: productId, vendor: product.vendor, customer: req.user._id, order: orderId, rating, comment });

    const agg = await Review.aggregate([{ $match: { product: product._id } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]);
    await Product.findByIdAndUpdate(productId, { 'rating.average': Math.round((agg[0]?.avg || 0) * 10) / 10, 'rating.count': agg[0]?.count || 0 });
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalReviews': 1 } });

    const io = req.app.get('io');
    // Envoyer la notification de manière non-bloquante
    if (io) {
      sendNotification(io, {
        recipientId: product.vendor, type: 'avis',
        title: `⭐ Nouvel avis ${rating}/5`,
        message: `${req.user.name} a laissé un avis sur "${product.name}"`,
        link: '/vendor/reviews',
      }).catch(err => console.error('Erreur envoi notification:', err));
    }

    res.status(201).json({ success: true, review });
  } catch (err) {
    console.error('❌ Erreur createReview:', err);
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Vous avez déjà noté ce produit pour cette commande' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.user._id }).populate('product', 'name images').sort('-createdAt');
    res.json({ success: true, reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, customer: req.user._id },
      { rating: req.body.rating, comment: req.body.comment }, { new: true }
    );
    res.json({ success: true, review });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteReview = async (req, res) => {
  try {
    await Review.findOneAndDelete({ _id: req.params.id, customer: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalReviews': -1 } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isVisible: true })
      .populate('customer', 'name avatar').sort('-createdAt');
    res.json({ success: true, reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── SIGNALEMENT ───────────────────────────────────────────────────────────────

exports.reportProduct = async (req, res) => {
  try {
    const { productId, reason, description } = req.body;
    await Report.create({ product: productId, reporter: req.user._id, reason, description });
    await Product.findByIdAndUpdate(productId, { $push: { reports: { reporter: req.user._id, reason, createdAt: new Date() } } });
    res.status(201).json({ success: true, message: 'Signalement envoyé, merci pour votre vigilance' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Vous avez déjà signalé ce produit' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CODE PROMO ────────────────────────────────────────────────────────────────

exports.validatePromoCode = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const promo = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });
    if (!promo) return res.status(404).json({ success: false, message: 'Code promo invalide ou expiré' });

    const now = new Date();
    if (promo.endDate   && promo.endDate   < now) return res.status(400).json({ success: false, message: 'Ce code promo a expiré' });
    if (promo.startDate && promo.startDate > now) return res.status(400).json({ success: false, message: 'Ce code promo n\'est pas encore actif' });
    if (promo.maxUses   && promo.usedCount >= promo.maxUses) return res.status(400).json({ success: false, message: 'Limite d\'utilisation atteinte' });
    if (promo.usedBy.includes(req.user._id)) return res.status(400).json({ success: false, message: 'Vous avez déjà utilisé ce code' });
    if (orderAmount < promo.minOrderAmount) return res.status(400).json({ success: false, message: `Commande minimum ${promo.minOrderAmount.toLocaleString()} FCFA` });

    const discount = promo.type === 'percentage' ? Math.round(orderAmount * promo.value / 100) : promo.value;
    res.json({ success: true, promo: { code: promo.code, type: promo.type, value: promo.value, discount: Math.min(discount, orderAmount), newTotal: Math.max(0, orderAmount - discount) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── STATS ET RECOMMANDATIONS ──────────────────────────────────────────────────

exports.getClientStats = async (req, res) => {
  try {
    const [totalOrders, totalSpent, totalReviews, favoriteVendors] = await Promise.all([
      Order.countDocuments({ user: req.user._id }),
      Order.aggregate([{ $match: { user: req.user._id, orderStatus: 'delivered' } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      Review.countDocuments({ customer: req.user._id }),
      Order.aggregate([
        { $match: { user: req.user._id } }, { $unwind: '$items' },
        { $group: { _id: '$items.vendor', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 3 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'vendor' } }, { $unwind: '$vendor' },
        { $project: { name: '$vendor.name', count: 1 } },
      ]),
    ]);
    res.json({ success: true, stats: { totalOrders, totalSpent: totalSpent[0]?.total || 0, totalReviews, favoriteVendors } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getRecommendations = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.product', 'category');
    const categoryIds   = [...new Set(orders.flatMap(o => o.items.map(i => i.product?.category?.toString())).filter(Boolean))];
    const boughtIds     = orders.flatMap(o => o.items.map(i => i.product?._id?.toString())).filter(Boolean);

    let recs = await Product.find({ category: { $in: categoryIds }, _id: { $nin: boughtIds }, status: 'active', stock: { $gt: 0 } })
      .populate('category', 'name').populate('vendor', 'name').sort('-rating.average -soldCount').limit(10);

    if (recs.length < 6) {
      const popular = await Product.find({ _id: { $nin: [...boughtIds, ...recs.map(r => r._id.toString())] }, status: 'active', stock: { $gt: 0 } })
        .populate('category', 'name').populate('vendor', 'name').sort('-soldCount').limit(10 - recs.length);
      recs = [...recs, ...popular];
    }
    res.json({ success: true, recommendations: recs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateNotificationPrefs = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { notificationPrefs: req.body } });
    res.json({ success: true, message: 'Préférences mises à jour' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
