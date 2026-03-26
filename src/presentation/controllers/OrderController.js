/**
 * Contrôleur Order - Couche présentation
 */
const asyncHandler = require('../../utils/asyncHandler');
const { CreateOrderDTO, UpdateOrderStatusDTO } = require('../../application/dtos/OrderDTO');

class OrderController {
  constructor(orderService) {
    this.orderService = orderService;
  }

  /**
   * POST /api/orders
   */
  createOrder = asyncHandler(async (req, res) => {
    const dto = new CreateOrderDTO({
      ...req.body,
      user: req.user._id
    });
    const order = await this.orderService.createOrder(dto);
    res.status(201).json({
      success: true,
      data: order,
      message: 'Commande créée avec succès'
    });
  });

  /**
   * GET /api/orders/:id
   */
  getOrder = asyncHandler(async (req, res) => {
    const order = await this.orderService.getOrderById(req.params.id);
    res.status(200).json({
      success: true,
      data: order
    });
  });

  /**
   * GET /api/orders
   */
  getUserOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const result = await this.orderService.getUserOrders(req.user._id, page, limit);
    res.status(200).json({
      success: true,
      ...result
    });
  });

  /**
   * GET /api/vendor/orders
   */
  getVendorOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const result = await this.orderService.getVendorOrders(req.user._id, page, limit);
    res.status(200).json({
      success: true,
      ...result
    });
  });

  /**
   * PUT /api/vendor/orders/:id/status
   */
  updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, reason } = req.body;
    const dto = new UpdateOrderStatusDTO(status, reason);
    const order = await this.orderService.updateOrderStatus(req.params.id, dto);
    res.status(200).json({
      success: true,
      data: order,
      message: 'Statut de la commande mis à jour'
    });
  });

  /**
   * PUT /api/orders/:id/cancel
   */
  cancelOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const order = await this.orderService.cancelOrder(req.params.id, reason);
    res.status(200).json({
      success: true,
      data: order,
      message: 'Commande annulée'
    });
  });

  /**
   * GET /api/vendor/stats
   */
  getOrderStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };
    const stats = await this.orderService.getOrderStats(req.user._id, dateRange);
    res.status(200).json({
      success: true,
      data: stats
    });
  });

  /**
   * GET /api/admin/orders
   */
  getOrdersByStatus = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await this.orderService.getOrdersByStatus(status, page, limit);
    res.status(200).json({
      success: true,
      ...result
    });
  });
}

module.exports = OrderController;
