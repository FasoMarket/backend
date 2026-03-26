/**
 * Interface du repository User
 * Définit le contrat pour l'accès aux données utilisateur
 */
class IUserRepository {
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async create(userData) {
    throw new Error('Method not implemented');
  }

  async update(id, userData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findAll(filters, pagination) {
    throw new Error('Method not implemented');
  }

  async findVendors(filters, pagination) {
    throw new Error('Method not implemented');
  }

  async updateRole(id, role) {
    throw new Error('Method not implemented');
  }

  async approveVendor(id) {
    throw new Error('Method not implemented');
  }

  async rejectVendor(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IUserRepository;
