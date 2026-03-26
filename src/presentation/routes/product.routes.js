/**
 * Routes Product
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middlewares/auth.middleware');

function createProductRoutes(productController) {
  // Routes publiques
  router.get('/', productController.getProducts);
  router.get('/search', productController.searchProducts);
  router.get('/:id', productController.getProduct);

  // Routes vendeur
  router.post('/', protect, authorize('vendor'), productController.createProduct);
  router.put('/:id', protect, authorize('vendor'), productController.updateProduct);
  router.delete('/:id', protect, authorize('vendor'), productController.deleteProduct);
  router.patch('/:id/stock', protect, authorize('vendor'), productController.updateStock);
  router.post('/:id/images', protect, authorize('vendor'), productController.addImages);
  router.delete('/:id/images', protect, authorize('vendor'), productController.removeImage);
  router.get('/vendor/low-stock', protect, authorize('vendor'), productController.getLowStockProducts);
  router.get('/vendor/products', protect, authorize('vendor'), productController.getVendorProducts);

  return router;
}

module.exports = createProductRoutes;
