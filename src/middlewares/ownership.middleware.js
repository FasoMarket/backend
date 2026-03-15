const Store = require('../models/Store');
const Product = require('../models/Product');

// Vérifier que l'utilisateur est propriétaire de la boutique
exports.checkStoreOwnership = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({ message: 'Boutique non trouvée' });
    }

    if (store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous n\'êtes pas propriétaire de cette boutique' });
    }

    req.store = store;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vérifier que l'utilisateur est propriétaire du produit
exports.checkProductOwnership = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('store');

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (product.store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous n\'êtes pas propriétaire de ce produit' });
    }

    req.product = product;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
