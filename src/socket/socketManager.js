const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const Notification = require('../models/Notification');

const onlineUsers = new Map();

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Token manquant'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('Utilisateur introuvable'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Token invalide'));
  }
};

const initSocket = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`✅ Socket connecté : ${socket.user.name} (${userId})`);

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    socket.join(`user:${userId}`);
    socket.broadcast.emit('user:online', { userId });
    
    // Envoyer la liste des utilisateurs en ligne au nouveau connecté
    socket.emit('users:online', { userIds: Array.from(onlineUsers.keys()) });

    socket.on('conversation:join', async ({ conversationId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;
        const isParticipant = conv.participants.some(p => p.toString() === userId);
        if (!isParticipant) return;

        socket.join(`conv:${conversationId}`);

        await Message.updateMany(
          { conversation: conversationId, sender: { $ne: userId }, isRead: false },
          { isRead: true, readAt: new Date() }
        );
        await Conversation.findByIdAndUpdate(conversationId, {
          [`unreadCount.${userId}`]: 0,
        });
        socket.to(`conv:${conversationId}`).emit('messages:read', { conversationId, readBy: userId });
      } catch (err) {
        console.error('conversation:join error', err);
      }
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('message:send', async ({ conversationId, content, type = 'text' }) => {
      try {
        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          content,
          type,
        });
        await message.populate('sender', 'name avatar role');

        const conv = await Conversation.findByIdAndUpdate(
          conversationId,
          {
            lastMessage: message._id,
            lastMessageAt: new Date(),
          },
          { new: true }
        ).populate('participants', 'name avatar role');

        const otherParticipants = conv.participants.filter(p => p._id.toString() !== userId);
        for (const participant of otherParticipants) {
          const pid = participant._id.toString();
          const currentCount = conv.unreadCount?.get(pid) || 0;
          await Conversation.findByIdAndUpdate(conversationId, {
            [`unreadCount.${pid}`]: currentCount + 1,
          });
        }

        io.to(`conv:${conversationId}`).emit('message:received', {
          message,
          conversationId,
        });

        for (const participant of otherParticipants) {
          const pid = participant._id.toString();
          const notif = await Notification.create({
            recipient: pid,
            type: 'new_message',
            title: `Nouveau message de ${socket.user.name}`,
            message: content.length > 60 ? content.substring(0, 60) + '...' : content,
            link: `/messages/${conversationId}`,
            data: { conversationId, senderId: userId, senderName: socket.user.name },
          });

          io.to(`user:${pid}`).emit('notification:new', {
            notification: notif,
            unreadCount: await Notification.countDocuments({ recipient: pid, isRead: false }),
          });

          io.to(`user:${pid}`).emit('conversation:updated', {
            conversationId,
            lastMessage: message,
            unreadCount: (conv.unreadCount?.get(pid) || 0) + 1,
          });
        }

      } catch (err) {
        socket.emit('error', { message: 'Erreur envoi message' });
        console.error('message:send error', err);
      }
    });

    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:start', {
        userId,
        userName: socket.user.name,
        conversationId,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:stop', { userId, conversationId });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // APPELS VOCAUX (WebRTC Signaling)
    // ══════════════════════════════════════════════════════════════════════════
    
    // Initier un appel
    socket.on('call:initiate', async ({ targetUserId, conversationId, callerName }) => {
      console.log(`📞 Appel initié par ${socket.user.name} vers ${targetUserId}`);
      
      // Vérifier si l'utilisateur cible est en ligne
      if (!onlineUsers.has(targetUserId)) {
        socket.emit('call:error', { 
          message: 'L\'utilisateur n\'est pas en ligne',
          code: 'USER_OFFLINE'
        });
        return;
      }
      
      // Envoyer l'appel entrant à l'utilisateur cible
      io.to(`user:${targetUserId}`).emit('call:incoming', {
        callerId: userId,
        callerName: callerName || socket.user.name,
        conversationId,
        timestamp: new Date()
      });
    });
    
    // Accepter un appel
    socket.on('call:accept', ({ callerId, conversationId }) => {
      console.log(`✅ Appel accepté par ${socket.user.name}`);
      io.to(`user:${callerId}`).emit('call:accepted', {
        acceptedBy: userId,
        acceptedByName: socket.user.name,
        conversationId
      });
    });
    
    // Refuser un appel
    socket.on('call:reject', ({ callerId, reason }) => {
      console.log(`❌ Appel refusé par ${socket.user.name}`);
      io.to(`user:${callerId}`).emit('call:rejected', {
        rejectedBy: userId,
        rejectedByName: socket.user.name,
        reason: reason || 'Appel refusé'
      });
    });
    
    // Terminer un appel
    socket.on('call:end', ({ targetUserId, conversationId }) => {
      console.log(`📵 Appel terminé par ${socket.user.name}`);
      io.to(`user:${targetUserId}`).emit('call:ended', {
        endedBy: userId,
        endedByName: socket.user.name,
        conversationId
      });
    });
    
    // WebRTC Signaling - Offer
    socket.on('webrtc:offer', ({ targetUserId, offer }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:offer', {
        fromUserId: userId,
        offer
      });
    });
    
    // WebRTC Signaling - Answer
    socket.on('webrtc:answer', ({ targetUserId, answer }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:answer', {
        fromUserId: userId,
        answer
      });
    });
    
    // WebRTC Signaling - ICE Candidate
    socket.on('webrtc:ice-candidate', ({ targetUserId, candidate }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:ice-candidate', {
        fromUserId: userId,
        candidate
      });
    });

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('user:offline', { userId });
        }
      }
      console.log(`❌ Socket déconnecté : ${socket.user.name}`);
    });
  });
};

const sendNotification = async (io, { recipientId, type, title, message, link = null, data = {} }) => {
  try {
    const notif = await Notification.create({
      recipient: recipientId,
      type, title, message, link, data,
    });

    const unreadCount = await Notification.countDocuments({
      recipient: recipientId,
      isRead: false,
    });

    io.to(`user:${recipientId.toString()}`).emit('notification:new', {
      notification: notif,
      unreadCount,
    });

    return notif;
  } catch (err) {
    console.error('sendNotification error:', err);
  }
};

const broadcastProductUpdate = (io, product) => {
  try {
    io.emit('product:updated', {
      productId: product._id,
      product,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastProductUpdate error:', err);
  }
};

const broadcastProductDelete = (io, productId) => {
  try {
    io.emit('product:deleted', {
      productId,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastProductDelete error:', err);
  }
};

const broadcastOfferCreated = (io, offer) => {
  try {
    io.emit('offer:created', {
      offer,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastOfferCreated error:', err);
  }
};

const broadcastOfferSent = (io, offer) => {
  try {
    io.emit('offer:sent', {
      offer,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastOfferSent error:', err);
  }
};

const broadcastOfferDeleted = (io, offerId) => {
  try {
    io.emit('offer:deleted', {
      offerId,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastOfferDeleted error:', err);
  }
};

const broadcastPromotionCreated = (io, promotion) => {
  try {
    io.emit('promotion:created', {
      promotion,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastPromotionCreated error:', err);
  }
};

const broadcastPromotionUpdated = (io, promotion) => {
  try {
    io.emit('promotion:updated', {
      promotion,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastPromotionUpdated error:', err);
  }
};

const broadcastPromotionDeleted = (io, promotionId) => {
  try {
    io.emit('promotion:deleted', {
      promotionId,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastPromotionDeleted error:', err);
  }
};

const broadcastCollectionCreated = (io, collection) => {
  try {
    io.emit('collection:created', {
      collection,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastCollectionCreated error:', err);
  }
};

const broadcastCollectionUpdated = (io, collection) => {
  try {
    io.emit('collection:updated', {
      collection,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastCollectionUpdated error:', err);
  }
};

const broadcastCollectionDeleted = (io, collectionId) => {
  try {
    io.emit('collection:deleted', {
      collectionId,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastCollectionDeleted error:', err);
  }
};

const broadcastCommunicationCreated = (io, communication) => {
  try {
    io.emit('communication:created', {
      communication,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastCommunicationCreated error:', err);
  }
};

const broadcastCommunicationUpdated = (io, communication) => {
  try {
    io.emit('communication:updated', {
      communication,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastCommunicationUpdated error:', err);
  }
};

const broadcastCommunicationDeleted = (io, communicationId) => {
  try {
    io.emit('communication:deleted', {
      communicationId,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('broadcastCommunicationDeleted error:', err);
  }
};

module.exports = {
  initSocket,
  sendNotification,
  onlineUsers,
  broadcastProductUpdate,
  broadcastProductDelete,
  broadcastOfferCreated,
  broadcastOfferSent,
  broadcastOfferDeleted,
  broadcastPromotionCreated,
  broadcastPromotionUpdated,
  broadcastPromotionDeleted,
  broadcastCollectionCreated,
  broadcastCollectionUpdated,
  broadcastCollectionDeleted,
  broadcastCommunicationCreated,
  broadcastCommunicationUpdated,
  broadcastCommunicationDeleted,
}; 