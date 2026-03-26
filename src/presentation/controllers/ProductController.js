/**
 * Contrôleur Product - Couche présentation
 */
const asyncHandler = require('../../utils/asyncHandler');
const { CreateProductDTO, UpdateProductDTO } = require('../../application/dtos/ProductDTO');

class ProductController {
  constructor(productService) {
    this.productService = productService;
  }

  /**
   * GET /api/products
   */
  getProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, category, vendor, minPrice, maxPrice, inStock } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (vendor) filters.vendor = vendor;
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (inStock) filters.inStock = inStock === 'true';

    const result = await this.productService.getProducts(filters, page, limit);
    res.status(200).json({
      success: true,
      ...result
    });
  });

  /**
   * GET /api/products/search
   */
  searchProducts = asyncHandler(async (req, res) => {
    const { q, page = 1, limit = 20, category, minPrice, maxPrice } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);

    const result = await this.productService.searchProducts(q, filters, page, limit);
    res.status(200).json({
      success: true,
      ...result
    });
  });

  /**
   * GET /api/products/:id
   */
  getProduct = asyncHandler(async (req, res) => {
    const product = await this.productService.getProductById(req.params.id);
    res.status(200).json({
      success: true,
      data: product
    });
  });

  /**
   * POST /api/vendor/products
   */
  createProduct = asyncHandler(async (req, res) => {
    const dto = new CreateProductDTO({
      ...req.body,
      vendor: req.user._id
    });
    const product = await this.productService.createProduct(dto);
    res.status(201).json({
      success: true,
      data: product,
      message: 'Produit créé avec succès'
    });
  });

  /**
   * PUT /api/vendor/products/:id
   */
  updateProduct = asyncHandler(async (req, res) => {
    const dto = new UpdateProductDTO(req.body);
    const product = await this.productService.updateProduct(req.params.id, dto);
    res.status(200).json({
      success: true,
      data: product,
      message: 'Produit mis à jour avec succès'
    });
  });

  /**
   * DELETE /api/vendor/products/:id
   */
  deleteProduct = asyncHandler(async (req, res) => {
    const result = await this.productService.deleteProduct(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  /**
   * PATCH /api/vendor/products/:id/stock
   */
  updateStock = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    const product = await this.productService.updateStock(req.params.id, quantity);
    res.status(200).json({
      success: true,
      data: product,
      message: 'Stock mis à jour'
    });
  });

  /**
   * POST /api/vendor/products/:id/images
   */
  addImages = asyncHandler(async (req, res) => {
    const { imageUrls } = req.body;
    const product = await this.productService.addImages(req.params.id, imageUrls);
    res.status(200).json({
      success: true,
      data: product,
      message: 'Images ajoutées'
    });
  });

  /**
   * DELETE /api/vendor/products/:id/images
   */
  removeImage = asyncHandler(async (req, res) => {
    const { imageUrl } = req.body;
    const product = await this.productService.removeImage(req.params.id, imageUrl);
    res.status(200).json({
      success: true,
      data: product,
      message: 'Image supprimée'
    });
  });

  /**
   * GET /api/vendor/products/low-stock
   */
  getLowStockProducts = asyncHandler(async (req, res) => {
    const { threshold = 10 } = req.query;
    const products = await this.productService.getLowStockProducts(req.user._id, threshold);
    res.status(200).json({
      success: true,
      data: products
    });
  });

  /**
   * GET /api/vendor/products
   */
  getVendorProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const result = await this.productService.getVendorProducts(req.user._id, page, limit);
    res.status(200).json({
      success: true,
      ...result
    });
  });
}

module.exports = ProductController;
