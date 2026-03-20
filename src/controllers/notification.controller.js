const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// 1. Récupérer toutes les notifications de l'utilisateur
exports.getAll = asyncHandler(async (req, res) => {
  const { isRead, limit = 20, skip = 0 } = req.query;
  const query = { recipient: req.user._id };

  if (isRead !== undefined) query.isRead = isRead === 'true';

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(Number(skip));

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });

  res.status(200).json({ success: true, notifications, unreadCount });
});

// 2. Obtenir le compte des messages non lus
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });
  res.status(200).json({ success: true, unreadCount });
});

// 3. Marquer une notification comme lue
exports.markOneRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification non trouvée" });
  }

  res.status(200).json({ success: true, notification });
});

// 4. Tout marquer comme lu
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.status(200).json({ success: true });
});

// 5. Supprimer une notification
exports.deleteOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await Notification.findOneAndDelete({ _id: id, recipient: req.user._id });

  if (!result) {
    return res.status(404).json({ success: false, message: "Notification non trouvée" });
  }

  res.status(200).json({ success: true });
});

// 6. Supprimer toutes les notifications
exports.deleteAll = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ recipient: req.user._id });
  res.status(200).json({ success: true });
});
