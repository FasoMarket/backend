const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const messageController = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const conversationValidation = [
  body('vendorId').notEmpty().withMessage('L\'ID du vendeur est requis'),
  body('productId').notEmpty().withMessage('L\'ID du produit est requis'),
  validate
];

const messageValidation = [
  body('conversationId').notEmpty().withMessage('L\'ID de la conversation est requis'),
  body('message').notEmpty().withMessage('Le message est requis'),
  validate
];

router.post('/conversation', protect, conversationValidation, messageController.createConversation);
router.post('/', protect, messageValidation, messageController.sendMessage);
router.get('/conversations', protect, messageController.getConversations);
router.get('/:conversationId', protect, messageController.getMessages);

module.exports = router;
