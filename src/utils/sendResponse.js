// Réponse standardisée
exports.sendSuccess = (res, statusCode, data, message = 'Succès') => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

exports.sendError = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message
  });
};

exports.sendPaginatedResponse = (res, statusCode, data, pagination) => {
  res.status(statusCode).json({
    success: true,
    count: data.length,
    pagination,
    data
  });
};
