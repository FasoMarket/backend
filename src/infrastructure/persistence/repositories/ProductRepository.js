/**
 * Implémentation du repository Product avec MongoDB
 */
const Product = require('../../../models/Product');
const IProductRepository = require('../../../domain/repositories/IProductRepository');

class ProductRepository extends IProductRepository {
  async findById(id) {
    return await Product.findById(id)
      .populate('vendor', 'name avatar')
      .populate('store', 'name slug')
      .populate('category', 'name');
  }

  async findBySlug(slug) {
    return await Product.findOne({ slug })
      .populate('vendor', 'name avatar')
      .populate('store', 'name slug')
      .populate('category', 'name');
  }

  async create(productData) {
    const product = new Product(productData);
    return await product.save();
  }

  async update(id, productData) {
    return await Product.findByIdAndUpdate(id, productData, { new: true });
  }

  async delete(id) {
    return await Product.findByIdAndDelete(id);
  }

  async findAll(filters = {}, pagination = {}) {
    const query = this._buildQuery(filters);
    return await Product.find(query)
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 20)
      .sort({ createdAt: -1 })
      .populate('vendor', 'name avatar')
      .populate('category', 'name');
  }

  async countAll(filters = {}) {
    const query = this._buildQuery(filters);
    return await Product.countDocuments(query);
  }

  async findByVendor(vendorId, pagination = {}) {
    return await Product.find({ vendor: vendorId })
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 20)
      .sort({ createdAt: -1 });
  }

  async countByVendor(vendorId) {
    return await Product.countDocuments({ vendor: vendorId });
  }

  async findByStore(storeId, pagination = {}) {
    return await Product.find({ store: storeId })
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 20)
      .sort({ createdAt: -1 });
  }

  async findByCategory(categoryId, pagination = {}) {
    return await Product.find({ category: categoryId })
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 20)
      .sort({ createdAt: -1 });
  }

  async search(query, filters = {}, pagination = {}) {
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      ...this._buildQuery(filters)
    };

    return await Product.find(searchQuery)
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 20)
      .sort({ createdAt: -1 });
  }

  async countSearch(query, filters = {}) {
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      ...this._buildQuery(filters)
    };
    return await Product.countDocuments(searchQuery);
  }

  async updateStock(id, quantity) {
    return await Product.findByIdAndUpdate(
      id,
      { $inc: { stock: quantity } },
      { new: true }
    );
  }

  async addImages(id, imageUrls) {
    return await Product.findByIdAndUpdate(
      id,
      { $push: { images: { $each: imageUrls } } },
      { new: true }
    );
  }

  async removeImage(id, imageUrl) {
    return await Product.findByIdAndUpdate(
      id,
      { $pull: { images: imageUrl } },
      { new: true }
    );
  }

  async setPromotion(id, promotionData) {
    return await Product.findByIdAndUpdate(
      id,
      { promotion: promotionData },
      { new: true }
    );
  }

  async getLowStock(vendorId, threshold = 10) {
    return await Product.find({
      vendor: vendorId,
      stock: { $lt: threshold }
    }).sort({ stock: 1 });
  }

  _buildQuery(filters) {
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.vendor) query.vendor = filters.vendor;
    if (filters.store) query.store = filters.store;
    if (filters.minPrice) query.price = { $gte: filters.minPrice };
    if (filters.maxPrice) {
      query.price = { ...query.price, $lte: filters.maxPrice };
    }
    if (filters.inStock) query.stock = { $gt: 0 };
    return query;
  }
}

module.exports = ProductRepository;
