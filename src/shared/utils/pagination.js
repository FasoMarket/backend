/**
 * Utilitaires pour la pagination
 */
const { PAGINATION } = require('../constants');

/**
 * Calcule les paramètres de pagination
 * @param {number} page - Numéro de page
 * @param {number} limit - Nombre d'éléments par page
 * @returns {Object} {page, limit, skip}
 */
function getPaginationParams(page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) {
  const validPage = Math.max(1, parseInt(page) || PAGINATION.DEFAULT_PAGE);
  const validLimit = Math.min(
    Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );

  return {
    page: validPage,
    limit: validLimit,
    skip: (validPage - 1) * validLimit
  };
}

/**
 * Formate la réponse paginée
 * @param {Array} data - Données
 * @param {number} total - Total d'éléments
 * @param {number} page - Numéro de page
 * @param {number} limit - Limite par page
 * @returns {Object} Réponse paginée
 */
function formatPaginatedResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

module.exports = {
  getPaginationParams,
  formatPaginatedResponse
};
