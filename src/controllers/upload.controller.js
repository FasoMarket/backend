const { uploadImage, deleteImage } = require('../services/uploadService');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/sendResponse');

/**
 * Upload la photo de profil de l'utilisateur
 */
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Aucun fichier fourni');
    }

    const userId = req.user._id;
    const filename = `profile_${userId}_${Date.now()}.${req.file.originalname.split('.').pop()}`;

    // Upload l'image
    const uploadResult = await uploadImage(req.file.buffer, filename, 'profiles');

    // Mettre à jour l'utilisateur
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: uploadResult.url },
      { new: true }
    ).select('-password');

    sendSuccess(res, 200, {
      avatar: uploadResult.url,
      storage: uploadResult.storage,
    }, 'Photo de profil mise à jour');
  } catch (error) {
    console.error('Erreur upload profil:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * Upload une image de produit
 */
exports.uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Aucun fichier fourni');
    }

    const filename = `product_${Date.now()}.${req.file.originalname.split('.').pop()}`;

    // Upload l'image
    const uploadResult = await uploadImage(req.file.buffer, filename, 'products');

    sendSuccess(res, 200, {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      storage: uploadResult.storage,
    }, 'Image produit uploadée');
  } catch (error) {
    console.error('Erreur upload produit:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * Upload plusieurs images de produit
 */
exports.uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'Aucun fichier fourni');
    }

    const uploadPromises = req.files.map(file => {
      const filename = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${file.originalname.split('.').pop()}`;
      return uploadImage(file.buffer, filename, 'products');
    });

    const results = await Promise.all(uploadPromises);

    sendSuccess(res, 200, {
      images: results,
    }, `${results.length} image(s) uploadée(s)`);
  } catch (error) {
    console.error('Erreur upload images:', error);
    sendError(res, 500, error.message);
  }
};

/**
 * Supprimer une image
 */
exports.deleteImage = async (req, res) => {
  try {
    const { publicId, storage, folder } = req.body;

    if (!publicId) {
      return sendError(res, 400, 'publicId requis');
    }

    await deleteImage(publicId, storage || 'local', folder || 'products');

    sendSuccess(res, 200, null, 'Image supprimée');
  } catch (error) {
    console.error('Erreur suppression image:', error);
    sendError(res, 500, error.message);
  }
};
