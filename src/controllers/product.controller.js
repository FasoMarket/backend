const Product = require('../models/Product');
const Store = require('../models/Store');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/ApiFeatures');
const { sendSuccess, sendError, sendPaginatedResponse, sendListResponse } = require('../utils/sendResponse');
const { transformProduct } = require('../utils/transformers');
const fs = require('fs');
const path = require('path');

// Créer un produit
exports.createProduct = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    
    if (!store) {
      return sendError(res, 400, 'Vous devez créer une boutique d\'abord');
    }

    // Récupérer les chemins des images uploadées
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const product = await Product.create({
      ...req.body,
      images,
      store: store._id,
      vendor: req.user._id
    });

    // Populate et transformer
    await product.populate('store', 'name logo slug');
    await product.populate('vendor', '_id name email');

    // Broadcast real-time creation to all clients
    const io = req.app.get('io');
    if (io) {
      const { broadcastProductUpdate } = require('../socket/socketManager');
      broadcastProductUpdate(io, product);
    }

    sendSuccess(res, 201, transformProduct(product), 'Produit créé avec succès');
  } catch (error) {
    console.error('Erreur createProduct:', error);
    sendError(res, 500, error.message);
  }
};

// Obtenir tous les produits avec filtres et pagination
exports.getAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  // Construire la requête pour le comptage
  const countQuery = Product.find();
  const countFeatures = new ApiFeatures(countQuery, req.query)
    .search()
    .filter();
  const total = await countFeatures.query.countDocuments();

  // Construire la requête pour les produits
  const apiFeatures = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    .sort();

  // Appliquer pagination et populate
  const products = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate('store', 'name logo slug')
    .populate('vendor', '_id name email');

  // Transformer les produits
  const transformedProducts = products.map(transformProduct);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };

  sendPaginatedResponse(res, 200, transformedProducts, pagination);
});

// Obtenir un produit par ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('store', 'name logo slug')
      .populate('vendor', '_id name email');
    
    if (!product) {
      return sendError(res, 404, 'Produit non trouvé');
    }

    sendSuccess(res, 200, transformProduct(product), 'Produit récupéré');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Mettre à jour un produit
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('store');

    if (!product) {
      return sendError(res, 404, 'Produit non trouvé');
    }

    if (product.store.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Non autorisé');
    }

    // Ajouter les nouvelles images si uploadées
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      req.body.images = [...product.images, ...newImages];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('store', 'name logo slug').populate('vendor', '_id name email');

    // Broadcast real-time update to all clients
    const io = req.app.get('io');
    if (io) {
      const { broadcastProductUpdate } = require('../socket/socketManager');
      broadcastProductUpdate(io, updatedProduct);
    }

    sendSuccess(res, 200, transformProduct(updatedProduct), 'Produit mis à jour');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Supprimer un produit
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('store');

    if (!product) {
      return sendError(res, 404, 'Produit non trouvé');
    }

    if (product.store.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Non autorisé');
    }

    const productId = product._id;
    await product.deleteOne();

    // Broadcast real-time delete to all clients
    const io = req.app.get('io');
    if (io) {
      const { broadcastProductDelete } = require('../socket/socketManager');
      broadcastProductDelete(io, productId);
    }

    sendSuccess(res, 200, null, 'Produit supprimé avec succès');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Ajouter des images à un produit
exports.addProductImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('store');

    if (!product) {
      return sendError(res, 404, 'Produit non trouvé');
    }

    if (product.store.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Non autorisé');
    }

    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'Aucune image uploadée');
    }

    const newImages = req.files.map(file => `/uploads/${file.filename}`);
    product.images.push(...newImages);
    await product.save();
    await product.populate('store', 'name logo slug').populate('vendor', '_id name email');

    sendSuccess(res, 200, transformProduct(product), 'Images ajoutées');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Supprimer une image d'un produit
exports.deleteProductImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const product = await Product.findById(req.params.id).populate('store');

    if (!product) {
      return sendError(res, 404, 'Produit non trouvé');
    }

    if (product.store.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Non autorisé');
    }

    // Supprimer l'image du système de fichiers
    const imagePath = path.join(__dirname, '../../', imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Retirer l'image du tableau
    product.images = product.images.filter(img => img !== imageUrl);
    await product.save();
    await product.populate('store', 'name logo slug').populate('vendor', '_id name email');

    sendSuccess(res, 200, transformProduct(product), 'Image supprimée');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Obtenir les catégories disponibles
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  sendListResponse(res, 200, categories, 'Catégories récupérées');
});
