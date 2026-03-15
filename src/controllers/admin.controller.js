const User = require('../models/User');

// Obtenir tous les vendeurs
exports.getVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approuver un vendeur
exports.approveVendor = async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendeur non trouvé' });
    }

    vendor.isVendorApproved = true;
    await vendor.save();

    res.json({ message: 'Vendeur approuvé avec succès', vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Refuser un vendeur
exports.rejectVendor = async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendeur non trouvé' });
    }

    vendor.isVendorApproved = false;
    await vendor.save();

    res.json({ message: 'Vendeur refusé', vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir tous les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
