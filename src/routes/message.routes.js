const express = require('express');
const router  = express.Router();
const messageCtrl = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post  ('/conversation',     protect, messageCtrl.createOrGetConversation);
router.get   ('/conversations',    protect, messageCtrl.getConversations);
router.get   ('/:conversationId',  protect, messageCtrl.getMessages);
router.post  ('/',                  protect, messageCtrl.sendMessage);
router.put   ('/:conversationId/read', protect, messageCtrl.markAsRead);
router.delete('/:conversationId',      protect, messageCtrl.deleteConversation);

module.exports = router;
