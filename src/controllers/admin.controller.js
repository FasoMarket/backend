const User = require('../models/User');
const { sendNotification } = require('../socket/socketManager');
const { sendSuccess, sendError } = require('../utils/sendResponse');
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

    sendSuccess(res, 200, vendorsWithStores, 'Vendeurs récupérés');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Approuver un vendeur
exports.approveVendor = async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);

    if (!vendor || vendor.role !== 'vendor') {
      return sendError(res, 404, 'Vendeur non trouvé');
    }

    vendor.isVendorApproved = true;
    await vendor.save();

    // CRÉATION AUTOMATIQUE DE LA BOUTIQUE
    const Store = require('../models/Store');
    let store = await Store.findOne({ owner: vendor._id });
    
    if (!store) {
      console.log(`📝 Création automatique de la boutique pour ${vendor.name}`);
      store = await Store.create({
        name: vendor.shopName || `${vendor.name}'s Shop`,
        description: vendor.description || `Bienvenue dans la boutique de ${vendor.name}. Nous sommes ravis de vous accueillir !`,
        phone: vendor.phone,
        address: vendor.address || 'Non spécifiée',
        owner: vendor._id
      });
      console.log(`✅ Boutique "${store.name}" créée avec succès`);
    }

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

    sendSuccess(res, 200, vendor, 'Vendeur approuvé avec succès');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Refuser un vendeur
exports.rejectVendor = async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);

    if (!vendor || vendor.role !== 'vendor') {
      return sendError(res, 404, 'Vendeur non trouvé');
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

    sendSuccess(res, 200, vendor, 'Vendeur refusé');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Obtenir tous les utilisateurs avec pagination et filtres
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, sortBy = 'createdAt', sortOrder = -1 } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Construire le filtre
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Récupérer les utilisateurs
    const users = await User.find(filter)
      .select('-password')
      .sort({ [sortBy]: parseInt(sortOrder) })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Compter le total
    const total = await User.countDocuments(filter);

    // Enrichir avec les stats
    const Order = require('../models/Order');
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const orderCount = await Order.countDocuments({ customer: user._id });
      const totalSpent = await Order.aggregate([
        { $match: { customer: user._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);

      return {
        ...user,
        orderCount,
        totalSpent: totalSpent[0]?.total || 0,
      };
    }));

    sendSuccess(res, 200, {
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      }
    }, 'Utilisateurs récupérés');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'Utilisateur non trouvé');
    }
    await User.findByIdAndDelete(req.params.id);
    sendSuccess(res, 200, null, 'Utilisateur supprimé avec succès');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Obtenir les détails d'un utilisateur
exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    
    if (!user) {
      return sendError(res, 404, 'Utilisateur non trouvé');
    }

    // Récupérer les stats
    const Order = require('../models/Order');
    const Review = require('../models/Review');
    
    const orders = await Order.find({ customer: user._id }).lean();
    const reviews = await Review.find({ author: user._id }).lean();
    
    const totalSpent = orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const userDetail = {
      ...user,
      stats: {
        totalOrders: orders.length,
        totalSpent,
        averageOrderValue: orders.length > 0 ? totalSpent / orders.length : 0,
        totalReviews: reviews.length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0,
      },
      recentOrders: orders.slice(-5).reverse(),
    };

    sendSuccess(res, 200, userDetail, 'Détails utilisateur récupérés');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// Obtenir les stats admin
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments(); // Tous les utilisateurs
    const totalClients = await User.countDocuments({ role: 'customer' });
    const vendors = await User.find({ role: 'vendor' }).lean();
    const totalVendors = vendors.length;
    
    const Store = require('../models/Store');
    const pendingVendorsList = [];
    
    // Pour les stats, on a besoin du nombre de produits et ventes
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

    sendSuccess(res, 200, {
      totalUsers,
      totalClients,
      totalVendors,
      totalProducts,
      pendingVendors: pendingVendorsList.length,
      pendingVendorsList,
      totalSales: totalSalesValue,
      totalCommission: totalCommissionEarnings
    }, 'Statistiques récupérées');
  } catch (error) {
    sendError(res, 500, error.message);
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

    sendSuccess(res, 200, categories, 'Catégories récupérées');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};


// POST /admin/categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, colorIdx } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 400, 'Le nom de la catégorie est requis.');
    }

    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await Category.findOne({ $or: [{ slug }, { name: name.trim() }] });
    if (existing) {
      return sendError(res, 400, 'Une catégorie avec ce nom existe déjà.');
    }

    const category = await Category.create({ 
      name: name.trim(), 
      slug, 
      description: description || '', 
      icon: icon || '🛍️', 
      colorIdx: colorIdx || 0 
    });
    
    // Broadcast Socket.io event pour que tous les clients voient la nouvelle catégorie
    const io = req.app.get('io');
    if (io) {
      io.emit('category:created', {
        category: category.toObject(),
        timestamp: new Date(),
      });
    }
    
    sendSuccess(res, 201, category, 'Catégorie créée avec succès');
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Ce nom est déjà utilisé.');
    }
    sendError(res, 500, error.message);
  }
};

// PUT /admin/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, icon, colorIdx } = req.body;
    
    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      // Auto-generate slug from name
      updateData.slug = name
        .toLowerCase()
        .trim()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[ñ]/g, 'n')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (colorIdx !== undefined) updateData.colorIdx = colorIdx;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!category) return sendError(res, 404, 'Catégorie non trouvée');
    
    // Broadcast Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.emit('category:updated', {
        category: category.toObject(),
        timestamp: new Date(),
      });
    }
    
    sendSuccess(res, 200, category, 'Catégorie mise à jour');
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Ce nom est déjà utilisé.');
    }
    sendError(res, 500, error.message);
  }
};

// DELETE /admin/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return sendError(res, 404, 'Catégorie non trouvée');
    sendSuccess(res, 200, null, 'Catégorie supprimée avec succès');
  } catch (error) {
    sendError(res, 500, error.message);
  }
};


