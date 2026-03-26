/**
 * Classe d'erreur personnalisée pour l'application
 * Centralise la gestion des erreurs avec code HTTP et message
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message) {
    return new AppError(message, 400);
  }

  static unauthorized(message = 'Non autorisé') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Accès refusé') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Ressource non trouvée') {
    return new AppError(message, 404);
  }

  static conflict(message) {
    return new AppError(message, 409);
  }

  static unprocessable(message) {
    return new AppError(message, 422);
  }

  static internal(message = 'Erreur serveur interne') {
    return new AppError(message, 500);
  }
}

module.exports = AppError;
