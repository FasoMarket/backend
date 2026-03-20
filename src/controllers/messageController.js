const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const { sendNotification } = require('../socket/socketManager');

exports.createOrGetConversation = async (req, res) => {
  try {
    const { recipientId, productId } = req.body;
    const senderId = req.user._id.toString();

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
      ...(productId ? { product: productId } : {}),
    }).populate('participants', 'name avatar role')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        product: productId || null,
      });
      await conversation.populate('participants', 'name avatar role');
    }

    res.json({ success: true, conversation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'name avatar role')
      .populate('lastMessage')
      .populate('product', 'name images')
      .sort('-lastMessageAt');

    const enriched = conversations.map(conv => ({
      ...conv.toObject(),
      unreadCount: conv.unreadCount?.get(userId) || 0,
      otherParticipant: conv.participants.find(p => p._id.toString() !== userId),
    }));

    res.json({ success: true, conversations: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id.toString();

    const conv = await Conversation.findById(conversationId);
    if (!conv || !conv.participants.some(p => p.toString() === userId))
      return res.status(403).json({ success: false, message: 'Accès refusé' });

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar role')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${userId}`]: 0,
    });

    res.json({ success: true, messages: messages.reverse(), page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text' } = req.body;
    const userId = req.user._id.toString();

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      content,
      type,
    });
    await message.populate('sender', 'name avatar role');

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: message._id,
        lastMessageAt: new Date(),
      },
      { new: true }
    ).populate('participants', 'name avatar role');

    const io = req.app.get('io');
    io.to(`conv:${conversationId}`).emit('message:received', { message, conversationId });

    // Notifier les autres participants
    const otherParticipants = conversation.participants.filter(p => p._id.toString() !== userId);
    for (const participant of otherParticipants) {
      const pid = participant._id.toString();
      
      // Incrémenter le compteur de messages non lus
      const currentCount = conversation.unreadCount?.get(pid) || 0;
      await Conversation.findByIdAndUpdate(conversationId, {
        [`unreadCount.${pid}`]: currentCount + 1,
      });

      // Envoyer la notification
      await sendNotification(io, {
        recipientId: pid,
        type: 'new_message',
        title: `Nouveau message de ${req.user.name}`,
        message: content.length > 60 ? content.substring(0, 60) + '...' : content,
        link: `/messages/${conversationId}`,
        data: { conversationId, senderId: userId, senderName: req.user.name },
      });

      // Notifier du changement de conversation (pour la liste des convs)
      io.to(`user:${pid}`).emit('conversation:updated', {
        conversationId,
        lastMessage: message,
        unreadCount: currentCount + 1,
      });
    }

    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${userId}`]: 0,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
