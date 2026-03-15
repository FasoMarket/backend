const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const addToCartValidation = [
  body('productId').notEmpty().withMessage('L\'ID du produit est requis'),
  body('quantity').isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
  validate
];

router.get('/', protect, cartController.getCart);
router.post('/', protect, addToCartValidation, cartController.addToCart);
router.put('/:productId', protect, cartController.updateCartItem);
router.delete('/:productId', protect, cartController.removeFromCart);
router.delete('/', protect, cartController.clearCart);

module.exports = router;
