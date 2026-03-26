/**
 * Service métier pour Product
 */
const AppError = require('../../shared/errors/AppError');
const { ProductResponseDTO, ProductListDTO } = require('../dtos/ProductDTO');
const { getPaginationParams, formatPaginatedResponse } = require('../../shared/utils/pagination');

class ProductService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  /**
   * Récupère un produit par ID
   */
  async getProductById(productId) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw AppError.notFound('Produit non trouvé');
    }
    return new ProductResponseDTO(product);
  }

  /**
   * Crée un nouveau produit
   */
  async createProduct(createProductDTO) {
    // Validation métier
    if (createProductDTO.price <= 0) {
      throw AppError.badRequest('Le prix doit être supérieur à 0');
    }
    if (createProductDTO.stock < 0) {
      throw AppError.badRequest('Le stock ne peut pas être négatif');
    }

    const product = await this.productRepository.create(createProductDTO);
    return new ProductResponseDTO(product);
  }

  /**
   * Met à jour un produit
   */
  async updateProduct(productId, updateProductDTO) {
    // Validation métier
    if (updateProductDTO.price && updateProductDTO.price <= 0) {
      throw AppError.badRequest('Le prix doit être supérieur à 0');
    }

    const product = await this.productRepository.update(productId, updateProductDTO);
    if (!product) {
      throw AppError.notFound('Produit non trouvé');
    }
    return new ProductResponseDTO(product);
  }

  /**
   * Récupère les produits avec filtres et pagination
   */
  async getProducts(filters = {}, page, limit) {
    const { skip, limit: validLimit } = getPaginationParams(page, limit);
    
    const [products, total] = await Promise.all([
      this.productRepository.findAll(filters, { skip, limit: validLimit }),
      this.productRepository.countAll(filters)
    ]);

    const productDTOs = products.map(p => new ProductListDTO(p));
    return formatPaginatedResponse(productDTOs, total, page, validLimit);
  }

  /**
   * Recherche des produits
   */
  async searchProducts(query, filters = {}, page, limit) {
    if (!query || query.trim().length < 2) {
      throw AppError.badRequest('La requête de recherche doit contenir au moins 2 caractères');
    }

    const { skip, limit: validLimit } = getPaginationParams(page, limit);
    
    const [products, total] = await Promise.all([
      this.productRepository.search(query, filters, { skip, limit: validLimit }),
      this.productRepository.countSearch(query, filters)
    ]);

    const productDTOs = products.map(p => new ProductListDTO(p));
    return formatPaginatedResponse(productDTOs, total, page, validLimit);
  }

  /**
   * Récupère les produits d'un vendeur
   */
  async getVendorProducts(vendorId, page, limit) {
    const { skip, limit: validLimit } = getPaginationParams(page, limit);
    
    const [products, total] = await Promise.all([
      this.productRepository.findByVendor(vendorId, { skip, limit: validLimit }),
      this.productRepository.countByVendor(vendorId)
    ]);

    const productDTOs = products.map(p => new ProductResponseDTO(p));
    return formatPaginatedResponse(productDTOs, total, page, validLimit);
  }

  /**
   * Met à jour le stock d'un produit
   */
  async updateStock(productId, quantity) {
    if (quantity < 0) {
      throw AppError.badRequest('La quantité ne peut pas être négative');
    }

    const product = await this.productRepository.updateStock(productId, quantity);
    if (!product) {
      throw AppError.notFound('Produit non trouvé');
    }
    return new ProductResponseDTO(product);
  }

  /**
   * Ajoute des images à un produit
   */
  async addImages(productId, imageUrls) {
    if (!imageUrls || imageUrls.length === 0) {
      throw AppError.badRequest('Au moins une image est requise');
    }

    const product = await this.productRepository.addImages(productId, imageUrls);
    if (!product) {
      throw AppError.notFound('Produit non trouvé');
    }
    return new ProductResponseDTO(product);
  }

  /**
   * Supprime une image d'un produit
   */
  async removeImage(productId, imageUrl) {
    const product = await this.productRepository.removeImage(productId, imageUrl);
    if (!product) {
      throw AppError.notFound('Produit non trouvé');
    }
    return new ProductResponseDTO(product);
  }

  /**
   * Récupère les produits en rupture de stock
   */
  async getLowStockProducts(vendorId, threshold = 10) {
    const products = await this.productRepository.getLowStock(vendorId, threshold);
    return products.map(p => new ProductResponseDTO(p));
  }

  /**
   * Supprime un produit
   */
  async deleteProduct(productId) {
    const result = await this.productRepository.delete(productId);
    if (!result) {
      throw AppError.notFound('Produit non trouvé');
    }
    return { message: 'Produit supprimé avec succès' };
  }
}

module.exports = ProductService;
