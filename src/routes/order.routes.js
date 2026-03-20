const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const clientCtrl = require('../controllers/clientAdvancedController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.get('/:id', protect, orderController.getOrderById);

// Routes avancées (Invoices, Timeline, Cancellation)
router.get('/:id/timeline', protect, clientCtrl.getOrderTimeline);
router.get('/:id/invoice',  protect, clientCtrl.downloadInvoice);
router.put('/:id/cancel',   protect, clientCtrl.cancelOrder);

module.exports = router;
