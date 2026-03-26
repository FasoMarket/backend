/**
 * Interface du repository Product
 */
class IProductRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findBySlug(slug) {
    throw new Error('Method not implemented');
  }

  async create(productData) {
    throw new Error('Method not implemented');
  }

  async update(id, productData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findAll(filters, pagination) {
    throw new Error('Method not implemented');
  }

  async findByVendor(vendorId, pagination) {
    throw new Error('Method not implemented');
  }

  async findByStore(storeId, pagination) {
    throw new Error('Method not implemented');
  }

  async findByCategory(categoryId, pagination) {
    throw new Error('Method not implemented');
  }

  async search(query, filters, pagination) {
    throw new Error('Method not implemented');
  }

  async updateStock(id, quantity) {
    throw new Error('Method not implemented');
  }

  async addImages(id, imageUrls) {
    throw new Error('Method not implemented');
  }

  async removeImage(id, imageUrl) {
    throw new Error('Method not implemented');
  }

  async setPromotion(id, promotionData) {
    throw new Error('Method not implemented');
  }

  async getLowStock(vendorId, threshold) {
    throw new Error('Method not implemented');
  }
}

module.exports = IProductRepository;
