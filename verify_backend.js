require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./src/models/User');
const Store = require('./src/models/Store');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const Review = require('./src/models/Review');

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fasomarket');
    console.log('✅ Connecté à MongoDB\n');

    // Vérifier les utilisateurs
    const totalUsers = await User.countDocuments();
    const admins = await User.countDocuments({ role: 'admin' });
    const vendors = await User.countDocuments({ role: 'vendor' });
    const customers = await User.countDocuments({ role: 'customer' });

    console.log('👥 UTILISATEURS:');
    console.log(`  • Total: ${totalUsers}`);
    console.log(`  • Admins: ${admins}`);
    console.log(`  • Vendeurs: ${vendors}`);
    console.log(`  • Clients: ${customers}`);

    // Vérifier les boutiques
    const totalStores = await Store.countDocuments();
    console.log(`\n🏪 BOUTIQUES: ${totalStores}`);

    // Vérifier les produits
    const totalProducts = await Product.countDocuments();
    const productsByVendor = await Product.aggregate([
      { $group: { _id: '$vendor', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log(`\n📦 PRODUITS: ${totalProducts}`);
    console.log('  Par vendeur:');
    for (const item of productsByVendor) {
      const vendor = await User.findById(item._id);
      console.log(`    • ${vendor?.name || 'Inconnu'}: ${item.count} produits`);
    }

    // Vérifier les commandes
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });

    console.log(`\n📋 COMMANDES:`);
    console.log(`  • Total: ${totalOrders}`);
    console.log(`  • Livrées: ${deliveredOrders}`);

    // Vérifier les avis
    const totalReviews = await Review.countDocuments();
    const reviewsByRating = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    console.log(`\n⭐ AVIS: ${totalReviews}`);
    console.log('  Par rating:');
    for (const item of reviewsByRating) {
      console.log(`    • ${item._id}⭐: ${item.count} avis`);
    }

    // Vérifier les endpoints
    console.log(`\n🔗 ENDPOINTS À TESTER:`);
    console.log(`  • GET /products - Tous les produits`);
    console.log(`  • GET /products?page=1&limit=12 - Produits paginés`);
    console.log(`  • GET /reviews/product/:productId - Avis d'un produit`);
    console.log(`  • GET /vendor/reviews - Avis reçus (vendeur)`);
    console.log(`  • GET /reviews/my-reviews - Mes avis (client)`);
    console.log(`  • GET /admin/stats - Stats admin`);
    console.log(`  • GET /admin/vendors - Tous les vendeurs`);
    console.log(`  • GET /admin/users - Tous les utilisateurs`);

    console.log(`\n✅ VÉRIFICATION COMPLÈTE!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

verify();
