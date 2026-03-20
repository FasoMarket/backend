const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');

// 1. Créer ou récupérer une conversation existante entre deux participants
exports.createOrGetConversation = asyncHandler(async (req, res) => {
  const { recipientId, productId } = req.body;
  const senderId = req.user._id;

  if (senderId.toString() === recipientId.toString()) {
    return res.status(400).json({ success: false, message: "Vous ne pouvez pas démarrer une discussion avec vous-même" });
  }

  // On cherche une conversation entre ces deux personnes
  // (Note: on peut affiner en cherchant aussi par productId si on veut des discussions par produit spécifique)
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, recipientId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, recipientId],
      metadata: { productId } // Optionnel
    });
  }

  res.status(200).json({ success: true, conversation });
});

// 2. Obtenir la liste des conversations de l'utilisateur
exports.getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id
  })
  .populate('participants', 'name email avatar role')
  .populate('lastMessage')
  .sort({ updatedAt: -1 });

  // On transforme un peu pour identifier l'autre participant plus facilement côté front
  const formatted = conversations.map(conv => {
    const otherParticipant = conv.participants.find(p => p._id.toString() !== req.user._id.toString());
    return {
      ...conv._doc,
      otherParticipant,
      unreadCount: conv.unreadCount.get(req.user._id.toString()) || 0
    };
  });

  res.status(200).json({ success: true, conversations: formatted });
});

// 3. Obtenir les messages d'une conversation
exports.getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 50, skip = 0 } = req.query;

  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 }) // Ordre chronologique pour le chat
    .limit(Number(limit))
    .skip(Number(skip));

  res.status(200).json({ success: true, messages });
});

// 4. Envoyer un message (Fallback HTTP si besoin, mais Socket.IO est privilégié)
exports.sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, content, type = 'text' } = req.body;
  
  const message = await Message.create({
    conversation: conversationId,
    sender: req.user._id,
    content,
    type
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    $inc: { [`unreadCount.${req.user._id}`]: 0 } // Logique d'incrément gérée plus finement dans socketManager
  });

  res.status(201).json({ success: true, message });
});

// 5. Marquer une conversation comme lue
exports.markAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id.toString();

  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { [`unreadCount.${userId}`]: 0 }
  });

  // Optionnel: marquer les messages individuels comme lus
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.status(200).json({ success: true });
});

// 6. Supprimer une conversation
exports.deleteConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });

  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation non trouvée ou accès refusé" });
  }

  // On supprime les messages associés
  await Message.deleteMany({ conversation: conversationId });
  // On supprime la conversation
  await Conversation.findByIdAndDelete(conversationId);

  res.status(200).json({ success: true, message: "Conversation supprimée" });
});
