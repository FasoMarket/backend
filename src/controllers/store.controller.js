const Store = require('../models/Store');
const mongoose = require('mongoose');
const { sendSuccess, sendError, sendListResponse } = require('../utils/sendResponse');
const { transformStore, transformProduct } = require('../utils/transformers');

// Créer une boutique
exports.createStore = async (req, res) => {
  try {
    const existingStore = await Store.findOne({ owner: req.user._id });
    if (existingStore) {
      return sendError(res, 400, 'Vous avez déjà une boutique');
    }

    const logo = req.files?.logo?.[0] ? `/uploads/${req.files.logo[0].filename}` : null;
    const banner = req.files?.banner?.[0] ? `/uploads/${req.files.banner[0].filename}` : null;

    let socialLinks = req.body.socialLinks;
    if (typeof socialLinks === 'string') {
      try { socialLinks = JSON.parse(socialLinks); } catch (e) { socialLinks = {}; }
    }

    let storeData = {
      ...req.body,
      logo,
      banner,
      socialLinks,
      owner: req.user._id
    };

    if (req.body.slug) {
      const existingSlug = await Store.findOne({ slug: req.body.slug });
      if (existingSlug) {
        return sendError(res, 400, 'Ce nom de boutique est déjà pris');
      }
      storeData.slug = req.body.slug;
    }

    const store = await Store.create(storeData);
    await store.populate('owner', 'name email');

    sendSuccess(res, 201, transformStore(store), 'Boutique créée avec succès');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Obtenir toutes les boutiques
exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.find().populate('owner', 'name email');
    const transformedStores = stores.map(transformStore);
    sendListResponse(res, 200, transformedStores, 'Boutiques récupérées');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Obtenir une boutique par ID ou slug
exports.getStoreByIdOrSlug = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const query = mongoose.Types.ObjectId.isValid(identifier) 
      ? { _id: identifier }
      : { slug: identifier };
    
    const store = await Store.findOne(query).populate('owner', 'name email');
    
    if (!store) {
      return sendError(res, 404, 'Boutique non trouvée');
    }

    sendSuccess(res, 200, transformStore(store), 'Boutique récupérée');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Mettre à jour une boutique
exports.updateStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return sendError(res, 404, 'Boutique non trouvée');
    }

    if (store.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Non autorisé');
    }

    if (req.files) {
      if (req.files.logo?.[0]) {
        req.body.logo = `/uploads/${req.files.logo[0].filename}`;
      }
      if (req.files.banner?.[0]) {
        req.body.banner = `/uploads/${req.files.banner[0].filename}`;
      }
    }

    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    sendSuccess(res, 200, transformStore(updatedStore), 'Boutique mise à jour');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Supprimer une boutique
exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return sendError(res, 404, 'Boutique non trouvée');
    }

    if (store.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Non autorisé');
    }

    await store.deleteOne();
    sendSuccess(res, 200, null, 'Boutique supprimée avec succès');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Obtenir les produits d'une boutique par ID ou slug
exports.getStoreProducts = async (req, res) => {
  try {
    const { identifier } = req.params;
    const Product = require('../models/Product');
    
    const query = mongoose.Types.ObjectId.isValid(identifier) 
      ? { _id: identifier }
      : { slug: identifier };
    
    const store = await Store.findOne(query);
    
    if (!store) {
      return sendError(res, 404, 'Boutique non trouvée');
    }
    
    const products = await Product.find({ store: store._id })
      .populate('store', 'name logo slug')
      .populate('vendor', '_id name email');
    
    const transformedProducts = products.map(transformProduct);
    
    sendListResponse(res, 200, transformedProducts, 'Produits de la boutique récupérés');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Vérifier la disponibilité d'un slug
exports.checkSlugAvailability = async (req, res) => {
  try {
    const { slug } = req.params;
    const existingStore = await Store.findOne({ slug });
    
    sendSuccess(res, 200, { available: !existingStore, slug }, 'Vérification effectuée');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Obtenir la boutique du vendeur connecté
exports.getMyStore = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id }).populate('owner', 'name email');
    if (!store) {
      return sendError(res, 404, 'Boutique non trouvée');
    }
    sendSuccess(res, 200, transformStore(store), 'Boutique récupérée');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};