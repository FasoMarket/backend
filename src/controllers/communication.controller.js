const Communication = require('../models/Communication');
const { sendSuccess, sendError } = require('../utils/sendResponse');
const { broadcastCommunicationCreated, broadcastCommunicationUpdated, broadcastCommunicationDeleted } = require('../socket/socketManager');

// Créer une communication (admin uniquement)
exports.createCommunication = async (req, res) => {
  try {
    const { title, message, type, visibility, targetRole, imageUrl } = req.body;

    const communication = await Communication.create({
      title,
      message,
      type, // 'announcement', 'promotion', 'maintenance', 'alert'
      visibility, // 'public', 'customers', 'vendors', 'admin'
      targetRole,
      imageUrl,
      createdBy: req.user._id,
      isActive: true
    });

    // Broadcast la nouvelle communication
    const io = req.app.get('io');
    if (io) {
      broadcastCommunicationCreated(io, communication);
    }

    sendSuccess(res, 201, communication, 'Communication créée avec succès');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Obtenir les communications visibles pour l'utilisateur
exports.getCommunications = async (req, res) => {
  try {
    const { type, visibility } = req.query;
    const userRole = req.user?.role || 'guest';

    // Construire le filtre de visibilité
    const visibilityFilter = {
      isActive: true,
      $or: [
        { visibility: 'public' },
        { visibility: userRole },
        { visibility: 'customers', targetRole: 'customer' },
        { visibility: 'vendors', targetRole: 'vendor' },
        { targetRole: 'all' } // Ajouter les communications destinées à tous
      ]
    };

    // Ajouter le filtre de type si fourni
    const query = type ? { ...visibilityFilter, type } : visibilityFilter;

    const communications = await Communication.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    sendSuccess(res, 200, communications, 'Communications récupérées');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Obtenir une communication par ID
exports.getCommunicationById = async (req, res) => {
  try {
    const communication = await Communication.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!communication) {
      return sendError(res, 404, 'Communication non trouvée');
    }

    sendSuccess(res, 200, communication, 'Communication récupérée');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Mettre à jour une communication (admin uniquement)
exports.updateCommunication = async (req, res) => {
  try {
    const communication = await Communication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!communication) {
      return sendError(res, 404, 'Communication non trouvée');
    }

    // Broadcast la mise à jour
    const io = req.app.get('io');
    if (io) {
      broadcastCommunicationUpdated(io, communication);
    }

    sendSuccess(res, 200, communication, 'Communication mise à jour');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Supprimer une communication (admin uniquement)
exports.deleteCommunication = async (req, res) => {
  try {
    const communication = await Communication.findByIdAndDelete(req.params.id);

    if (!communication) {
      return sendError(res, 404, 'Communication non trouvée');
    }

    // Broadcast la suppression
    const io = req.app.get('io');
    if (io) {
      broadcastCommunicationDeleted(io, communication._id);
    }

    sendSuccess(res, 200, null, 'Communication supprimée');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Désactiver une communication
exports.toggleCommunication = async (req, res) => {
  try {
    const communication = await Communication.findById(req.params.id);

    if (!communication) {
      return sendError(res, 404, 'Communication non trouvée');
    }

    communication.isActive = !communication.isActive;
    await communication.save();

    // Broadcast la mise à jour
    const io = req.app.get('io');
    if (io) {
      broadcastCommunicationUpdated(io, communication);
    }

    sendSuccess(res, 200, communication, 'Communication mise à jour');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Marquer une communication comme lue
exports.markAsRead = async (req, res) => {
  try {
    const communication = await Communication.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!communication) {
      return sendError(res, 404, 'Communication non trouvée');
    }

    // Broadcast la mise à jour
    const io = req.app.get('io');
    if (io) {
      broadcastCommunicationUpdated(io, communication);
    }

    sendSuccess(res, 200, communication, 'Communication marquée comme lue');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Archiver une communication
exports.archiveCommunication = async (req, res) => {
  try {
    const communication = await Communication.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!communication) {
      return sendError(res, 404, 'Communication non trouvée');
    }

    // Broadcast la mise à jour
    const io = req.app.get('io');
    if (io) {
      broadcastCommunicationUpdated(io, communication);
    }

    sendSuccess(res, 200, communication, 'Communication archivée');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};
