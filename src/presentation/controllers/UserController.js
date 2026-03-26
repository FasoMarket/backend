/**
 * Contrôleur User - Couche présentation
 * Gère les requêtes HTTP et délègue à la couche service
 */
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../shared/errors/AppError');

class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  /**
   * GET /api/users/:id
   */
  getUser = asyncHandler(async (req, res) => {
    const user = await this.userService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      data: user
    });
  });

  /**
   * PUT /api/users/:id
   */
  updateUser = asyncHandler(async (req, res) => {
    const user = await this.userService.updateUser(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès'
    });
  });

  /**
   * GET /api/admin/vendors
   */
  getVendors = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, isApproved } = req.query;
    const filters = {};
    if (search) filters.search = search;
    if (isApproved !== undefined) filters.isApproved = isApproved === 'true';

    const result = await this.userService.getVendors(filters, page, limit);
    res.status(200).json({
      success: true,
      ...result
    });
  });

  /**
   * PUT /api/admin/vendors/:id/approve
   */
  approveVendor = asyncHandler(async (req, res) => {
    const vendor = await this.userService.approveVendor(req.params.id);
    res.status(200).json({
      success: true,
      data: vendor,
      message: 'Vendeur approuvé avec succès'
    });
  });

  /**
   * PUT /api/admin/vendors/:id/reject
   */
  rejectVendor = asyncHandler(async (req, res) => {
    const vendor = await this.userService.rejectVendor(req.params.id);
    res.status(200).json({
      success: true,
      data: vendor,
      message: 'Vendeur rejeté'
    });
  });

  /**
   * DELETE /api/admin/users/:id
   */
  deleteUser = asyncHandler(async (req, res) => {
    const result = await this.userService.deleteUser(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  });
}

module.exports = UserController;
