const express = require('express');
const router = express.Router();
const { upload, handleUploadError } = require('../middlewares/uploadHandler.middleware');
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middlewares/auth.middleware');

// Upload photo de profil (utilisateur connecté)
router.post(
  '/profile',
  protect,
  upload.single('file'),
  handleUploadError,
  uploadController.uploadProfilePhoto
);

// Upload image produit (une seule)
router.post(
  '/product',
  protect,
  upload.single('file'),
  handleUploadError,
  uploadController.uploadProductImage
);

// Upload plusieurs images produit
router.post(
  '/products',
  protect,
  upload.array('files', 10), // Max 10 fichiers
  handleUploadError,
  uploadController.uploadProductImages
);

// Supprimer une image
router.delete(
  '/image',
  protect,
  uploadController.deleteImage
);

module.exports = router;
