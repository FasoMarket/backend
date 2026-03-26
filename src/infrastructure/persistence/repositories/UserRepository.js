/**
 * Implémentation du repository User avec MongoDB
 */
const User = require('../../../models/User');
const IUserRepository = require('../../../domain/repositories/IUserRepository');

class UserRepository extends IUserRepository {
  async findById(id) {
    return await User.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async update(id, userData) {
    return await User.findByIdAndUpdate(id, userData, { new: true });
  }

  async delete(id) {
    return await User.findByIdAndDelete(id);
  }

  async findAll(filters = {}, pagination = {}) {
    const query = this._buildQuery(filters);
    return await User.find(query)
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 20)
      .sort({ createdAt: -1 });
  }

  async countAll(filters = {}) {
    const query = this._buildQuery(filters);
    return await User.countDocuments(query);
  }

  async findVendors(filters = {}, pagination = {}) {
    const query = { role: 'vendor', ...this._buildQuery(filters) };
    return await User.find(query)
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 20)
      .sort({ createdAt: -1 });
  }

  async countVendors(filters = {}) {
    const query = { role: 'vendor', ...this._buildQuery(filters) };
    return await User.countDocuments(query);
  }

  async updateRole(id, role) {
    return await User.findByIdAndUpdate(id, { role }, { new: true });
  }

  async approveVendor(id) {
    return await User.findByIdAndUpdate(
      id,
      { isVendorApproved: true },
      { new: true }
    );
  }

  async rejectVendor(id) {
    return await User.findByIdAndUpdate(
      id,
      { isVendorApproved: false },
      { new: true }
    );
  }

  _buildQuery(filters) {
    const query = {};
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }
    if (filters.isApproved !== undefined) {
      query.isVendorApproved = filters.isApproved;
    }
    return query;
  }
}

module.exports = UserRepository;
