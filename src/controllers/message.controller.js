const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');

// 1. Créer ou récupérer une conversation existante entre deux participants
exports.createOrGetConversation = asyncHandler(async (req, res) => {
  let { recipientId, productId } = req.body;
  const senderId = req.user._id;

  console.log('🔍 createOrGetConversation');
  console.log('   senderId:', senderId);
  console.log('   recipientId:', recipientId);
  console.log('   productId:', productId);

  // Si recipientId est un storeId, chercher le vendeur (owner) du store
  const Store = require('../models/Store');
  let store = await Store.findById(recipientId);
  
  if (store) {
    console.log('✅ Store trouvé par ID:', store.name, 'owner:', store.owner);
    recipientId = store.owner;
  } else {
    console.log('❌ Store non trouvé par ID:', recipientId);
    // Essayer de chercher le store par le productId
    if (productId) {
      const Product = require('../models/Product');
      const product = await Product.findById(productId);
      if (product && product.store) {
        store = await Store.findById(product.store);
        if (store) {
          console.log('✅ Store trouvé via produit:', store.name, 'owner:', store.owner);
          recipientId = store.owner;
        }
      }
    }
    // Si toujours pas de recipientId, c'est peut-être un ID d'utilisateur direct
    if (!recipientId) {
      console.log('⚠️ recipientId reste undefined');
      return res.status(400).json({ success: false, message: "Destinataire invalide" });
    }
  }

  console.log('   recipientId final:', recipientId);

  if (senderId.toString() === recipientId.toString()) {
    return res.status(400).json({ success: false, message: "Vous ne pouvez pas démarrer une discussion avec vous-même" });
  }

  // On cherche une conversation entre ces deux personnes
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, recipientId] }
  });

  if (!conversation) {
    console.log('📝 Création nouvelle conversation entre', senderId, 'et', recipientId);
    conversation = await Conversation.create({
      participants: [senderId, recipientId],
      product: productId
    });
  } else {
    console.log('✅ Conversation existante trouvée:', conversation._id);
  }

  // Envoyer le message du produit (même si la conversation existe déjà)
  if (productId) {
    const Product = require('../models/Product');
    const product = await Product.findById(productId).populate('store', 'slug');
    if (product) {
      console.log(`📦 Envoi du produit: ${product.name}`);
      const productMessage = await Message.create({
        conversation: conversation._id,
        sender: senderId,
        content: JSON.stringify({
          productId: product._id,
          productName: product.name,
          productPrice: product.price,
          productImage: product.images && product.images.length > 0 ? product.images[0] : null,
          productDescription: product.description,
          storeId: product.store?._id,
          storeSlug: product.store?.slug,
        }),
        type: 'product_link',
      });

      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: productMessage._id,
        lastMessageAt: new Date(),
      });
      console.log(`✅ Message produit créé: ${productMessage._id}`);
    }
  }

  res.status(200).json({ success: true, conversation });
});

// 2. Obtenir la liste des conversations de l'utilisateur
exports.getConversations = asyncHandler(async (req, res) => {
  console.log('📨 getConversations - userId:', req.user._id);
  
  const conversations = await Conversation.find({
    participants: req.user._id
  })
  .populate('participants', 'name email avatar role')
  .populate('lastMessage')
  .sort({ updatedAt: -1 });

  console.log(`✅ Conversations trouvées: ${conversations.length}`);

  // On transforme un peu pour identifier l'autre participant plus facilement côté front
  const formatted = conversations.map(conv => {
    const otherParticipant = conv.participants.find(p => p._id.toString() !== req.user._id.toString());
    console.log(`   Conversation ${conv._id}: otherParticipant = ${otherParticipant?.name}`);
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
