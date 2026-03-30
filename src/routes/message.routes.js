const express = require('express');
const router  = express.Router();
const messageCtrl = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');
const { uploadMessage } = require('../middlewares/uploadHandler.middleware');

// Routes spécifiques d'abord (avant les routes avec paramètres)
router.post  ('/conversation',     protect, messageCtrl.createOrGetConversation);
router.get   ('/conversations',    protect, messageCtrl.getConversations);
router.post  ('/',                  protect, messageCtrl.sendMessage);

// Routes avec conversationId - spécifiques d'abord
router.post  ('/:conversationId/file', protect, uploadMessage.single('file'), messageCtrl.sendFile);
router.put   ('/:conversationId/read', protect, messageCtrl.markAsRead);
router.delete('/:conversationId',      protect, messageCtrl.deleteConversation);
router.get   ('/:conversationId',  protect, messageCtrl.getMessages);

module.exports = router;
