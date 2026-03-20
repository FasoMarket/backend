const Product = require('../models/Product');
const Store = require('../models/Store');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/ApiFeatures');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/sendResponse');
const fs = require('fs');
const path = require('path');

// Créer un produit
exports.createProduct = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    
    if (!store) {
      return res.status(400).json({ message: 'Vous devez créer une boutique d\'abord' });
    }

    // Récupérer les chemins des images uploadées
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const product = await Product.create({
      ...req.body,
      images,
      store: store._id
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Erreur createProduct:', error);
    res.status(500).json({ message: error.message });

  }
};

// Obtenir tous les produits avec filtres et pagination
exports.getAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  // Construire la requête
  const apiFeatures = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    .sort();

  // Compter le total
  const total = await Product.countDocuments(apiFeatures.query.getFilter());

  // Appliquer pagination et populate
  const products = await apiFeatures.query
    .skip(skip)
    .limit(limit)
    .populate('store', 'name logo');

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };

  sendPaginatedResponse(res, 200, products, pagination);
});

// Obtenir un produit par ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('store');
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un produit
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('store');

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (product.store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
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
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un produit
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('store');

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (product.store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await product.deleteOne();
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ajouter des images à un produit
exports.addProductImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('store');

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (product.store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Aucune image uploadée' });
    }

    const newImages = req.files.map(file => `/uploads/${file.filename}`);
    product.images.push(...newImages);
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une image d'un produit
exports.deleteProductImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const product = await Product.findById(req.params.id).populate('store');

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (product.store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Supprimer l'image du système de fichiers
    const imagePath = path.join(__dirname, '../../', imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Retirer l'image du tableau
    product.images = product.images.filter(img => img !== imageUrl);
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Obtenir les catégories disponibles
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  sendSuccess(res, 200, categories, 'Catégories récupérées');
});
