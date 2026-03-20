const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Obtenir le panier
exports.getCart = async (req, res) => {
  try {
    console.log('DEBUG: minimal getCart for user:', req.user?._id);
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json(cart);
  } catch (error) {
    console.error('CRITICAL Error in getCart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ajouter un produit au panier
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Stock insuffisant' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{
          product: productId,
          quantity,
          price: product.price
        }]
      });
    } else {
      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({
          product: productId,
          quantity,
          price: product.price
        });
      }

      await cart.save();
    }

    cart = await cart.populate('items.product');
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour la quantité
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === req.params.productId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Produit non trouvé dans le panier' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product');
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un produit du panier
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate('items.product');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vider le panier
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    cart.items = [];
    await cart.save();

    res.json({ message: 'Panier vidé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
