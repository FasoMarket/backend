const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Créer les dossiers s'ils n'existent pas
const ensureUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../uploads/profiles'),
    path.join(__dirname, '../../uploads/products'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureUploadDirs();

/**
 * Upload une image vers Cloudinary ou stockage local
 * @param {Buffer} fileBuffer - Buffer du fichier
 * @param {string} filename - Nom du fichier
 * @param {string} folder - Dossier Cloudinary (profiles, products, etc.)
 * @returns {Promise<{url: string, publicId: string, storage: 'cloudinary'|'local'}>}
 */
const uploadImage = async (fileBuffer, filename, folder = 'products') => {
  try {
    // Essayer Cloudinary d'abord
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      return await uploadToCloudinary(fileBuffer, filename, folder);
    }
  } catch (err) {
    console.warn('⚠️  Cloudinary upload échoué, utilisation du stockage local:', err.message);
  }

  // Fallback: stockage local
  return uploadToLocal(fileBuffer, filename, folder);
};

/**
 * Upload vers Cloudinary
 */
const uploadToCloudinary = async (fileBuffer, filename, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `fasomarket/${folder}`,
        public_id: filename.split('.')[0],
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            storage: 'cloudinary',
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Upload vers le stockage local
 */
const uploadToLocal = async (fileBuffer, filename, folder) => {
  const uploadDir = path.join(__dirname, `../../uploads/${folder}`);
  
  // Créer le dossier s'il n'existe pas
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filepath = path.join(uploadDir, filename);
  fs.writeFileSync(filepath, fileBuffer);

  // Retourner l'URL relative
  const url = `/uploads/${folder}/${filename}`;
  
  return {
    url,
    publicId: filename,
    storage: 'local',
  };
};

/**
 * Supprimer une image
 */
const deleteImage = async (publicId, storage = 'cloudinary', folder = 'products') => {
  try {
    if (storage === 'cloudinary' && process.env.CLOUDINARY_CLOUD_NAME) {
      await cloudinary.uploader.destroy(publicId);
      console.log('✅ Image Cloudinary supprimée:', publicId);
    } else if (storage === 'local') {
      const filepath = path.join(__dirname, `../../uploads/${folder}/${publicId}`);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log('✅ Image locale supprimée:', filepath);
      }
    }
  } catch (err) {
    console.error('❌ Erreur suppression image:', err.message);
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  ensureUploadDirs,
};
