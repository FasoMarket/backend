// Réponse standardisée - Format unifié pour tous les endpoints
exports.sendSuccess = (res, statusCode, data, message = 'Succès') => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

exports.sendError = (res, statusCode, message, errors = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
};

// Réponse paginée - Format unifié
exports.sendPaginatedResponse = (res, statusCode, data, pagination) => {
  res.status(statusCode).json({
    success: true,
    message: 'Succès',
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages
    }
  });
};

// Réponse pour liste simple (sans pagination)
exports.sendListResponse = (res, statusCode, data, message = 'Succès') => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    count: data.length
  });
};
