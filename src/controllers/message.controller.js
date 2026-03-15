const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Product = require('../models/Product');
const User = require('../models/User');

// Créer une conversation
exports.createConversation = async (req, res) => {
  try {
    const { vendorId, productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendeur non trouvé' });
    }

    // Vérifier si une conversation existe déjà
    let conversation = await Conversation.findOne({
      customer: req.user._id,
      vendor: vendorId,
      product: productId
    });

    if (conversation) {
      return res.json(conversation);
    }

    conversation = await Conversation.create({
      customer: req.user._id,
      vendor: vendorId,
      product: productId
    });

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Envoyer un message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const isParticipant = 
      conversation.customer.toString() === req.user._id.toString() ||
      conversation.vendor.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const newMessage = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      message
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir toutes les conversations
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      $or: [
        { customer: req.user._id },
        { vendor: req.user._id }
      ]
    })
    .populate('customer', 'name email')
    .populate('vendor', 'name email')
    .populate('product', 'name price')
    .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les messages d'une conversation
exports.getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    const isParticipant = 
      conversation.customer.toString() === req.user._id.toString() ||
      conversation.vendor.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
