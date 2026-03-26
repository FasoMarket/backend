/**
 * Point d'entrée des routes
 * Organise toutes les routes par domaine métier
 */
const express = require('express');
const router = express.Router();

/**
 * Initialise toutes les routes avec injection de dépendances
 */
function setupRoutes(container) {
  // Récupère les contrôleurs du conteneur
  const userController = container.get('userController');
  const productController = container.get('productController');
  const orderController = container.get('orderController');

  // Routes par domaine
  const createUserRoutes = require('./user.routes');
  const createProductRoutes = require('./product.routes');
  const createOrderRoutes = require('./order.routes');

  // Enregistre les routes
  router.use('/users', createUserRoutes(userController));
  router.use('/products', createProductRoutes(productController));
  router.use('/orders', createOrderRoutes(orderController));

  // TODO: Ajouter les autres domaines
  // router.use('/payments', createPaymentRoutes(paymentController));
  // router.use('/messages', createMessageRoutes(messageController));
  // router.use('/notifications', createNotificationRoutes(notificationController));
  // router.use('/reviews', createReviewRoutes(reviewController));
  // router.use('/carts', createCartRoutes(cartController));
  // router.use('/stores', createStoreRoutes(storeController));
  // router.use('/admin', createAdminRoutes(adminController));

  return router;
}

module.exports = setupRoutes;
