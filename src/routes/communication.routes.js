const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communication.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Routes publiques
router.get('/', communicationController.getCommunications);
router.get('/:id', communicationController.getCommunicationById);

// Routes utilisateur connecté
router.patch('/:id/mark-read', protect, communicationController.markAsRead);
router.patch('/:id/archive', protect, communicationController.archiveCommunication);

// Routes admin uniquement
router.post('/', protect, authorize('admin'), communicationController.createCommunication);
router.put('/:id', protect, authorize('admin'), communicationController.updateCommunication);
router.delete('/:id', protect, authorize('admin'), communicationController.deleteCommunication);
router.patch('/:id/toggle', protect, authorize('admin'), communicationController.toggleCommunication);

module.exports = router;
