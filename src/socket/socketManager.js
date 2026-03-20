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

module.exports = { initSocket, sendNotification, onlineUsers };
