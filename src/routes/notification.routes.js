const express = require('express');
const router  = express.Router();
const notificationCtrl = require('../controllers/notification.controller');
const { protect }      = require('../middlewares/auth.middleware');

// Routes spécifiques AVANT les routes paramétrées
router.get   ('/unread-count', protect, notificationCtrl.getUnreadCount);
router.put   ('/read-all',    protect, notificationCtrl.markAllRead);

// Routes générales
router.get   ('/',             protect, notificationCtrl.getAll);
router.put   ('/:id/read',    protect, notificationCtrl.markOneRead);
router.delete('/:id',         protect, notificationCtrl.deleteOne);
router.delete('/',             protect, notificationCtrl.deleteAll);

module.exports = router;
