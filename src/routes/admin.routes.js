const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/vendors', protect, authorize('admin'), adminController.getVendors);
router.put('/vendors/:id/approve', protect, authorize('admin'), adminController.approveVendor);
router.put('/vendors/:id/reject', protect, authorize('admin'), adminController.rejectVendor);
router.get('/users', protect, authorize('admin'), adminController.getUsers);

module.exports = router;
