// backend/src/routes/config.routes.js
const express = require('express');
const router = express.Router();

/**
 * GET /config/app-config
 * Retourne la configuration de l'app (URLs, etc.)
 * Accessible sans authentification pour que le mobile puisse la récupérer au démarrage
 */
router.get('/app-config', (req, res) => {
  try {
    // En production, toujours utiliser les URLs déployées
    // En développement, utiliser les URLs locales
    const isProduction = process.env.NODE_ENV === 'production';
    
    let apiUrl, socketUrl;
    
    if (isProduction) {
      // Production: utiliser les URLs déployées
      apiUrl = process.env.API_URL || 'http://localhost:5000/api';
      socketUrl = process.env.SOCKET_URL || 'http://localhost:5000';
    } else {
      // Développement: utiliser les URLs locales
      const protocol = req.protocol;
      const host = req.get('host');
      apiUrl = `${protocol}://${host}/api`;
      socketUrl = `${protocol}://${host}`;
    }
    
    const config = {
      apiUrl,
      socketUrl,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
