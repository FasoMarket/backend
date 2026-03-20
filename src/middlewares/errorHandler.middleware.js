// Gestionnaire d'erreurs global
exports.errorHandler = (err, req, res, next) => {
  console.error('--- GLOBAL ERROR HANDLER ---');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('---------------------------');

  let error = { ...err };
  error.message = err.message;

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = {
      statusCode: 400,
      message: message
    };
  }

  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      statusCode: 400,
      message: `${field} existe déjà`
    };
  }

  // Erreur CastError MongoDB (ID invalide)
  if (err.name === 'CastError') {
    error = {
      statusCode: 404,
      message: 'Ressource non trouvée'
    };
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Token invalide'
    };
  }

  // Erreur JWT expiré
  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expiré'
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Gestionnaire pour les routes non trouvées
exports.notFound = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
