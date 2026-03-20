const User = require('../models/User');
const { sendNotification } = require('../socket/socketManager');
const Category = require('../models/Category');
const Product  = require('../models/Product');

// Obtenir tous les vendeurs avec leurs boutiques
exports.getVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).lean();
    
    // Pour chaque vendeur, chercher sa boutique
    const Store = require('../models/Store');
    const vendorsWithStores = await Promise.all(vendors.map(async (vendor) => {
      const store = await Store.findOne({ owner: vendor._id });
      return { ...vendor, store };
    }));

    res.json(vendorsWithStores);
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

    // NOTIFICATION
    const io = req.app.get('io');
    await sendNotification(io, {
      recipientId: vendor._id,
      type: 'store_approved',
      title: '🎉 Boutique approuvée !',
      message: 'Votre boutique a été validée par l\'administrateur. Vous pouvez maintenant ajouter des produits !',
      link: '/vendor/products',
      data: { vendorId: vendor._id },
    });

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

    // NOTIFICATION
    const io = req.app.get('io');
    await sendNotification(io, {
      recipientId: vendor._id,
      type: 'store_rejected',
      title: '❌ Boutique refusée',
      message: 'Votre demande de boutique a été refusée. Contactez l\'administrateur pour plus d\'informations.',
      link: '/profile',
      data: {},
    });

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

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les stats admin
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const vendors = await User.find({ role: 'vendor' }).lean();
    const totalVendors = vendors.length;
    
    const Store = require('../models/Store');
    const pendingVendorsList = [];
    
    // Pour les stats, on a besoin du nombre de produits et ventes (simulé pour l'instant)
    const totalProducts = await Product.countDocuments();
    
    for (const vendor of vendors) {
      if (!vendor.isVendorApproved) {
        const store = await Store.findOne({ owner: vendor._id });
        pendingVendorsList.push({
          _id: vendor._id,
          name: vendor.name,
          shop: store?.name || 'Pas de boutique',
          createdAt: vendor.createdAt
        });
      }
    }

    // Statistiques réelles des ventes
    const Order = require('../models/Order');
    const orders = await Order.find({ paymentStatus: 'paid' });
    
    let totalSalesValue = 0;
    let totalCommissionEarnings = 0;
    
    orders.forEach(order => {
      totalSalesValue += order.totalPrice;
      totalCommissionEarnings += (order.commissionAmount || 0);
    });

    res.json({
      totalUsers,
      totalVendors,
      totalProducts,
      pendingVendors: pendingVendorsList.length,
      pendingVendorsList,
      totalSales: totalSalesValue,
      totalCommission: totalCommissionEarnings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════
//  CATEGORIES CRUD
// ══════════════════════════════════════════════════════════════════

// GET /admin/categories
exports.getCategories = async (req, res) => {
  try {
    // 1. Get all distinct category strings used in products
    const productCategories = await Product.distinct('category');

    // 2. For each product category string, upsert a Category document
    //    so that existing categories become visible on first load.
    const COLOR_COUNT = 10;
    let colorIdx = 0;
    for (const name of productCategories) {
      if (!name) continue;
      const slug = name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      await Category.findOneAndUpdate(
        { slug },
        { $setOnInsert: { name, slug, icon: 'ShoppingBag', colorIdx: colorIdx++ % COLOR_COUNT } },
        { upsert: true, new: false }
      );
    }

    // 3. Return all Category documents enriched with product count
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          let: { catName: '$name' },
          pipeline: [{ $match: { $expr: { $eq: ['$category', '$$catName'] } } }],
          as: 'products',
        },
      },
      { $addFields: { productCount: { $size: '$products' } } },
      { $project: { products: 0 } },
      { $sort: { name: 1 } },
    ]);

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// POST /admin/categories
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, icon, colorIdx } = req.body;

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'Une catégorie avec ce slug existe déjà.' });
    }

    const category = await Category.create({ name, slug, description, icon, colorIdx });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ce nom/slug est déjà utilisé.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// PUT /admin/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /admin/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json({ success: true, message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


