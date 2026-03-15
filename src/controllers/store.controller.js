const Store = require('../models/Store');
const mongoose = require('mongoose');

// Créer une boutique
exports.createStore = async (req, res) => {
  try {
    const existingStore = await Store.findOne({ owner: req.user._id });
    if (existingStore) {
      return res.status(400).json({ message: 'Vous avez déjà une boutique' });
    }

    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    // Si un slug personnalisé est fourni, l'utiliser
    let storeData = {
      ...req.body,
      logo,
      owner: req.user._id
    };

    // Si un slug personnalisé est fourni, vérifier qu'il est unique
    if (req.body.slug) {
      const existingSlug = await Store.findOne({ slug: req.body.slug });
      if (existingSlug) {
        return res.status(400).json({ message: 'Ce nom de boutique est déjà pris' });
      }
      storeData.slug = req.body.slug;
    }

    const store = await Store.create(storeData);

    res.status(201).json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir toutes les boutiques
exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.find().populate('owner', 'name email');
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir une boutique par ID ou slug
exports.getStoreByIdOrSlug = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Chercher par ID ou par slug
    const query = mongoose.Types.ObjectId.isValid(identifier) 
      ? { _id: identifier }
      : { slug: identifier };
    
    const store = await Store.findOne(query).populate('owner', 'name email');
    
    if (!store) {
      return res.status(404).json({ message: 'Boutique non trouvée' });
    }

    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une boutique
exports.updateStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({ message: 'Boutique non trouvée' });
    }

    if (store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (req.file) {
      req.body.logo = `/uploads/${req.file.filename}`;
    }

    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedStore);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une boutique
exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({ message: 'Boutique non trouvée' });
    }

    if (store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await store.deleteOne();
    res.json({ message: 'Boutique supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Obtenir les produits d'une boutique par ID ou slug
exports.getStoreProducts = async (req, res) => {
  try {
    const { identifier } = req.params;
    const Product = require('../models/Product');
    
    // Chercher la boutique par ID ou slug
    const query = mongoose.Types.ObjectId.isValid(identifier) 
      ? { _id: identifier }
      : { slug: identifier };
    
    const store = await Store.findOne(query);
    
    if (!store) {
      return res.status(404).json({ message: 'Boutique non trouvée' });
    }
    
    const products = await Product.find({ store: store._id });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vérifier la disponibilité d'un slug
exports.checkSlugAvailability = async (req, res) => {
  try {
    const { slug } = req.params;
    const existingStore = await Store.findOne({ slug });
    
    res.json({
      available: !existingStore,
      slug: slug
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};