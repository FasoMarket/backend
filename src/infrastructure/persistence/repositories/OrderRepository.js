/**
 * Implémentation du repository Order avec MongoDB
 */
const Order = require('../../../models/Order');
const IOrderRepository = require('../../../domain/repositories/IOrderRepository');

class OrderRepository extends IOrderRepository {
  async findById(id) {
    return await Order.findById(id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images')
      .populate('items.vendor', 'name avatar')
      .populate('items.store', 'name');
  }

  async create(orderData) {
    const order = new Order(orderData);
    return await order.save();
  }

  async update(id, orderData) {
    return await Order.findByIdAndUpdate(id, orderData, { new: true });
  }

  async findByUser(userId, pagination = {}) {
    return await Order.find({ user: userId })
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 20)
      .sort({ createdAt: -1 })
      .populate('items.product', 'name price images');
  }

  async countByUser(userId) {
    return await Order.countDocuments({ user: userId });
  }

  async findByVendor(vendorId, pagination = {}) {
    return await Order.find({ 'items.vendor': vendorId })
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 20)
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .populate('items.product', 'name price');
  }

  async countByVendor(vendorId) {
    return await Order.countDocuments({ 'items.vendor': vendorId });
  }

  async findByStore(storeId, pagination = {}) {
    return await Order.find({ 'items.store': storeId })
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 20)
      .sort({ createdAt: -1 });
  }

  async updateStatus(id, status) {
    return await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }

  async updateItemStatus(orderId, itemIndex, status) {
    return await Order.findByIdAndUpdate(
      orderId,
      { $set: { [`items.${itemIndex}.status`]: status } },
      { new: true }
    );
  }

  async findByStatus(status, pagination = {}) {
    return await Order.find({ status })
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 20)
      .sort({ createdAt: -1 });
  }

  async countByStatus(status) {
    return await Order.countDocuments({ status });
  }

  async findByDateRange(startDate, endDate, filters = {}) {
    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      ...filters
    };
    return await Order.find(query).sort({ createdAt: -1 });
  }

  async getStats(vendorId, dateRange) {
    const pipeline = [
      {
        $match: {
          'items.vendor': vendorId,
          createdAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          averageOrderValue: { $avg: '$totalPrice' },
          totalItems: { $sum: { $size: '$items' } }
        }
      }
    ];

    const result = await Order.aggregate(pipeline);
    return result[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalItems: 0
    };
  }

  async cancel(id, reason) {
    return await Order.findByIdAndUpdate(
      id,
      { status: 'cancelled', cancellationReason: reason },
      { new: true }
    );
  }
}

module.exports = OrderRepository;
