/**
 * Service métier pour Order
 * Gère la logique complexe des commandes
 */
const AppError = require('../../shared/errors/AppError');
const { ORDER_STATUS } = require('../../shared/constants');
const { OrderResponseDTO, OrderListDTO } = require('../dtos/OrderDTO');
const { getPaginationParams, formatPaginatedResponse } = require('../../shared/utils/pagination');

class OrderService {
  constructor(orderRepository, productRepository) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
  }

  /**
   * Crée une nouvelle commande
   */
  async createOrder(createOrderDTO) {
    // Validation métier
    if (!createOrderDTO.items || createOrderDTO.items.length === 0) {
      throw AppError.badRequest('La commande doit contenir au moins un article');
    }

    if (createOrderDTO.totalPrice <= 0) {
      throw AppError.badRequest('Le prix total doit être supérieur à 0');
    }

    // Vérifier la disponibilité des produits
    for (const item of createOrderDTO.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw AppError.notFound(`Produit ${item.productId} non trouvé`);
      }
      if (product.stock < item.quantity) {
        throw AppError.badRequest(`Stock insuffisant pour ${product.name}`);
      }
    }

    // Créer la commande
    const order = await this.orderRepository.create(createOrderDTO);
    
    // Réduire le stock des produits
    for (const item of createOrderDTO.items) {
      await this.productRepository.updateStock(item.productId, -item.quantity);
    }

    return new OrderResponseDTO(order);
  }

  /**
   * Récupère une commande par ID
   */
  async getOrderById(orderId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw AppError.notFound('Commande non trouvée');
    }
    return new OrderResponseDTO(order);
  }

  /**
   * Récupère les commandes d'un utilisateur
   */
  async getUserOrders(userId, page, limit) {
    const { skip, limit: validLimit } = getPaginationParams(page, limit);
    
    const [orders, total] = await Promise.all([
      this.orderRepository.findByUser(userId, { skip, limit: validLimit }),
      this.orderRepository.countByUser(userId)
    ]);

    const orderDTOs = orders.map(o => new OrderListDTO(o));
    return formatPaginatedResponse(orderDTOs, total, page, validLimit);
  }

  /**
   * Récupère les commandes d'un vendeur
   */
  async getVendorOrders(vendorId, page, limit) {
    const { skip, limit: validLimit } = getPaginationParams(page, limit);
    
    const [orders, total] = await Promise.all([
      this.orderRepository.findByVendor(vendorId, { skip, limit: validLimit }),
      this.orderRepository.countByVendor(vendorId)
    ]);

    const orderDTOs = orders.map(o => new OrderListDTO(o));
    return formatPaginatedResponse(orderDTOs, total, page, validLimit);
  }

  /**
   * Met à jour le statut d'une commande
   */
  async updateOrderStatus(orderId, updateStatusDTO) {
    // Validation du statut
    const validStatuses = Object.values(ORDER_STATUS);
    if (!validStatuses.includes(updateStatusDTO.status)) {
      throw AppError.badRequest('Statut invalide');
    }

    const order = await this.orderRepository.updateStatus(orderId, updateStatusDTO.status);
    if (!order) {
      throw AppError.notFound('Commande non trouvée');
    }

    return new OrderResponseDTO(order);
  }

  /**
   * Annule une commande
   */
  async cancelOrder(orderId, reason) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw AppError.notFound('Commande non trouvée');
    }

    // Vérifier que la commande peut être annulée
    if (![ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(order.status)) {
      throw AppError.badRequest('Cette commande ne peut pas être annulée');
    }

    // Restaurer le stock
    for (const item of order.items) {
      await this.productRepository.updateStock(item.product, item.quantity);
    }

    // Mettre à jour le statut
    const cancelledOrder = await this.orderRepository.cancel(orderId, reason);
    return new OrderResponseDTO(cancelledOrder);
  }

  /**
   * Récupère les statistiques des commandes
   */
  async getOrderStats(vendorId, dateRange) {
    const stats = await this.orderRepository.getStats(vendorId, dateRange);
    return stats;
  }

  /**
   * Récupère les commandes par statut
   */
  async getOrdersByStatus(status, page, limit) {
    const validStatuses = Object.values(ORDER_STATUS);
    if (!validStatuses.includes(status)) {
      throw AppError.badRequest('Statut invalide');
    }

    const { skip, limit: validLimit } = getPaginationParams(page, limit);
    
    const [orders, total] = await Promise.all([
      this.orderRepository.findByStatus(status, { skip, limit: validLimit }),
      this.orderRepository.countByStatus(status)
    ]);

    const orderDTOs = orders.map(o => new OrderListDTO(o));
    return formatPaginatedResponse(orderDTOs, total, page, validLimit);
  }
}

module.exports = OrderService;
