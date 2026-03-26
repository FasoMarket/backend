/**
 * Interface du repository Order
 */
class IOrderRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async create(orderData) {
    throw new Error('Method not implemented');
  }

  async update(id, orderData) {
    throw new Error('Method not implemented');
  }

  async findByUser(userId, pagination) {
    throw new Error('Method not implemented');
  }

  async findByVendor(vendorId, pagination) {
    throw new Error('Method not implemented');
  }

  async findByStore(storeId, pagination) {
    throw new Error('Method not implemented');
  }

  async updateStatus(id, status) {
    throw new Error('Method not implemented');
  }

  async updateItemStatus(orderId, itemIndex, status) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status, pagination) {
    throw new Error('Method not implemented');
  }

  async findByDateRange(startDate, endDate, filters) {
    throw new Error('Method not implemented');
  }

  async getStats(vendorId, dateRange) {
    throw new Error('Method not implemented');
  }

  async cancel(id, reason) {
    throw new Error('Method not implemented');
  }
}

module.exports = IOrderRepository;
