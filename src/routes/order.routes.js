const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const clientCtrl = require('../controllers/clientAdvancedController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);

// Routes avancées (Invoices, Timeline, Cancellation) - AVANT les routes paramétrées
router.get('/:id/timeline', protect, clientCtrl.getOrderTimeline);
router.get('/:id/invoice',  protect, clientCtrl.downloadInvoice);
router.put('/:id/cancel',   protect, clientCtrl.cancelOrder);

// Routes paramétrées générales
router.get('/:id', protect, orderController.getOrderById);

module.exports = router;
