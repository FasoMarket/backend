const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/sendResponse');
const { transformCart } = require('../utils/transformers');

// Obtenir le panier
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    sendSuccess(res, 200, transformCart(cart), 'Panier récupéré');
  } catch (error) {
    console.error('Error in getCart:', error);
    sendError(res, 500, error.message);
  }
};

// Ajouter un produit au panier
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, 404, 'Produit non trouvé');
    }

    if (product.stock < quantity) {
      return sendError(res, 400, 'Stock insuffisant');
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
    
    sendSuccess(res, 200, transformCart(cart), 'Produit ajouté au panier');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Mettre à jour la quantité
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return sendError(res, 404, 'Panier non trouvé');
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === req.params.productId);

    if (itemIndex === -1) {
      return sendError(res, 404, 'Produit non trouvé dans le panier');
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product');
    
    sendSuccess(res, 200, transformCart(cart), 'Panier mis à jour');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Supprimer un produit du panier
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return sendError(res, 404, 'Panier non trouvé');
    }

    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate('items.product');

    sendSuccess(res, 200, transformCart(cart), 'Produit supprimé du panier');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Vider le panier
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return sendError(res, 404, 'Panier non trouvé');
    }

    cart.items = [];
    await cart.save();

    sendSuccess(res, 200, transformCart(cart), 'Panier vidé');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};
