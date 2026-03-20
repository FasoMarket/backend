const express = require('express');
const router  = express.Router();
const notificationCtrl = require('../controllers/notification.controller');
const { protect }      = require('../middlewares/auth.middleware');

router.get   ('/',             protect, notificationCtrl.getAll);
router.get   ('/unread-count', protect, notificationCtrl.getUnreadCount);
router.put   ('/:id/read',    protect, notificationCtrl.markOneRead);
router.put   ('/read-all',    protect, notificationCtrl.markAllRead);
router.delete('/:id',         protect, notificationCtrl.deleteOne);
router.delete('/',             protect, notificationCtrl.deleteAll);

module.exports = router;
