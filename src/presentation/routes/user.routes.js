/**
 * Routes User
 * Organisées par domaine métier
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middlewares/auth.middleware');

/**
 * Factory pour créer les routes avec injection de dépendances
 */
function createUserRoutes(userController) {
  // Routes publiques
  router.get('/:id', protect, userController.getUser);
  router.put('/:id', protect, userController.updateUser);

  // Routes admin
  router.get('/admin/vendors', protect, authorize('admin'), userController.getVendors);
  router.put('/admin/vendors/:id/approve', protect, authorize('admin'), userController.approveVendor);
  router.put('/admin/vendors/:id/reject', protect, authorize('admin'), userController.rejectVendor);
  router.delete('/admin/users/:id', protect, authorize('admin'), userController.deleteUser);

  return router;
}

module.exports = createUserRoutes;
