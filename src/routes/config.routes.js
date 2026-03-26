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
    const config = {
      apiUrl: process.env.API_URL || `${req.protocol}://${req.get('host')}/api`,
      socketUrl: process.env.SOCKET_URL || `${req.protocol}://${req.get('host')}`,
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
