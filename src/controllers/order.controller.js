const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const OrderService = require('../services/order.service');
const { sendSuccess, sendError } = require('../utils/sendResponse');

// Créer une commande
exports.createOrder = async (req, res) => {
  try {
    const { paymentMethod } = req.body;

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

    // Calculer le total
    let totalPrice = 0;
    const orderItems = cart.items.map(item => {
      totalPrice += item.price * item.quantity;
      return {
        product: item.product._id,
        store: item.product.store,
        quantity: item.quantity,
        price: item.price
      };
    });

    // Créer la commande
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalPrice,
      paymentMethod: paymentMethod || 'mobile_money'
    });

    // Mettre à jour le stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Vider le panier
    cart.items = [];
    await cart.save();

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
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('items.store');

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
