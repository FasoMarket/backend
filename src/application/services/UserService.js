/**
 * Service métier pour User
 * Orchestre la logique métier et les appels aux repositories
 */
const AppError = require('../../shared/errors/AppError');
const { UserResponseDTO, VendorResponseDTO } = require('../dtos/UserDTO');
const { getPaginationParams, formatPaginatedResponse } = require('../../shared/utils/pagination');

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Récupère un utilisateur par ID
   */
  async getUserById(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('Utilisateur non trouvé');
    }
    return new UserResponseDTO(user);
  }

  /**
   * Récupère un utilisateur par email
   */
  async getUserByEmail(email) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw AppError.notFound('Utilisateur non trouvé');
    }
    return new UserResponseDTO(user);
  }

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(createUserDTO) {
    // Vérifier que l'email n'existe pas
    const existingUser = await this.userRepository.findByEmail(createUserDTO.email);
    if (existingUser) {
      throw AppError.conflict('Cet email est déjà utilisé');
    }

    const user = await this.userRepository.create(createUserDTO);
    return new UserResponseDTO(user);
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(userId, updateUserDTO) {
    const user = await this.userRepository.update(userId, updateUserDTO);
    if (!user) {
      throw AppError.notFound('Utilisateur non trouvé');
    }
    return new UserResponseDTO(user);
  }

  /**
   * Récupère tous les vendeurs
   */
  async getVendors(filters = {}, page, limit) {
    const { skip, limit: validLimit } = getPaginationParams(page, limit);
    
    const [vendors, total] = await Promise.all([
      this.userRepository.findVendors(filters, { skip, limit: validLimit }),
      this.userRepository.countVendors(filters)
    ]);

    const vendorDTOs = vendors.map(v => new VendorResponseDTO(v));
    return formatPaginatedResponse(vendorDTOs, total, page, validLimit);
  }

  /**
   * Approuve un vendeur
   */
  async approveVendor(vendorId) {
    const vendor = await this.userRepository.approveVendor(vendorId);
    if (!vendor) {
      throw AppError.notFound('Vendeur non trouvé');
    }
    return new VendorResponseDTO(vendor);
  }

  /**
   * Rejette un vendeur
   */
  async rejectVendor(vendorId) {
    const vendor = await this.userRepository.rejectVendor(vendorId);
    if (!vendor) {
      throw AppError.notFound('Vendeur non trouvé');
    }
    return new VendorResponseDTO(vendor);
  }

  /**
   * Supprime un utilisateur
   */
  async deleteUser(userId) {
    const result = await this.userRepository.delete(userId);
    if (!result) {
      throw AppError.notFound('Utilisateur non trouvé');
    }
    return { message: 'Utilisateur supprimé avec succès' };
  }
}

module.exports = UserService;
