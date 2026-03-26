/**
 * Routes Order
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middlewares/auth.middleware');

function createOrderRoutes(orderController) {
  // Routes client
  router.post('/', protect, orderController.createOrder);
  router.get('/', protect, orderController.getUserOrders);
  router.get('/:id', protect, orderController.getOrder);
  router.put('/:id/cancel', protect, orderController.cancelOrder);

  // Routes vendeur
  router.get('/vendor/orders', protect, authorize('vendor'), orderController.getVendorOrders);
  router.put('/vendor/orders/:id/status', protect, authorize('vendor'), orderController.updateOrderStatus);
  router.get('/vendor/stats', protect, authorize('vendor'), orderController.getOrderStats);

  // Routes admin
  router.get('/admin/orders', protect, authorize('admin'), orderController.getOrdersByStatus);

  return router;
}

module.exports = createOrderRoutes;
