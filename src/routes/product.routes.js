const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/product.controller');
const vendorAdvancedController = require('../controllers/vendorAdvancedController');
const { protect, authorize, checkVendorApproval } = require('../middlewares/auth.middleware');
const { checkProductOwnership } = require('../middlewares/ownership.middleware');
const { validate } = require('../middlewares/validation.middleware');
const upload = require('../config/multer');

const productValidation = [
  body('name').trim().notEmpty().withMessage('Le nom du produit est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('price').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('category').trim().notEmpty().withMessage('La catégorie est requise'),
  body('stock').isInt({ min: 0 }).withMessage('Le stock doit être un nombre entier positif'),
  validate
];

// Routes spécifiques AVANT les routes paramétrées
router.get('/categories', productController.getCategories);
router.get('/vendor/low-stock', protect, authorize('vendor'), checkVendorApproval, vendorAdvancedController.getLowStockProducts);
router.post('/', protect, authorize('vendor'), checkVendorApproval, upload.array('images', 5), productValidation, productController.createProduct);
router.get('/', productController.getAllProducts);

// Routes paramétrées
router.get('/:id', productController.getProductById);
router.put('/:id', protect, authorize('vendor'), checkProductOwnership, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', protect, authorize('vendor'), checkProductOwnership, productController.deleteProduct);
router.post('/:id/images', protect, authorize('vendor'), checkProductOwnership, upload.array('images', 5), productController.addProductImages);
router.delete('/:id/images', protect, authorize('vendor'), checkProductOwnership, productController.deleteProductImage);

module.exports = router;

