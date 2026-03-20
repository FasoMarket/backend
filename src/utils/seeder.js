require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Supprimer les données existantes
    await User.deleteMany();
    await Store.deleteMany();
    await Product.deleteMany();
    await Cart.deleteMany();

    // Créer un admin
    const admin = await User.create({
      name: 'Admin FasoMarket',
      email: 'admin@fasomarket.com',
      password: 'admin123',
      role: 'admin'
    });

    // Créer un vendeur approuvé
    const vendor = await User.create({
      name: 'Vendeur Test',
      email: 'vendeur@fasomarket.com',
      password: 'vendeur123',
      role: 'vendor',
      isVendorApproved: true
    });

    // Créer un client
    const customer = await User.create({
      name: 'Client Test',
      email: 'client@fasomarket.com',
      password: 'client123',
      role: 'customer'
    });

    // Créer une boutique
    const store = await Store.create({
      name: 'Boutique Bio Faso',
      description: 'Produits locaux et biologiques du Burkina Faso',
      owner: vendor._id
    });

    // Créer des produits
    const products = [
      {
        name: 'Mangue Kent',
        description: 'Mangue fraîche et juteuse de Bobo-Dioulasso. Qualité export.',
        price: 2000,
        category: 'Fruits',
        stock: 50,
        store: store._id,
        vendor: vendor._id
      },
      {
        name: 'Mil local (Petit Mil)',
        description: 'Mil rouge cultivé localement, riche en fer.',
        price: 1500,
        category: 'Cereals',
        stock: 100,
        store: store._id,
        vendor: vendor._id
      },
      {
        name: 'Beurre de Karité Bio',
        description: 'Beurre de karité 100% naturel, sans additifs.',
        price: 3500,
        category: 'Processed',
        stock: 30,
        store: store._id,
        vendor: vendor._id
      },
      {
        name: 'Miel de la Sissili',
        description: 'Miel sauvage pur de forêt.',
        price: 5000,
        category: 'Honey',
        stock: 20,
        store: store._id,
        vendor: vendor._id
      }
    ];

    await Product.insertMany(products);

    console.log('✅ Données de test créées avec succès');
    console.log('\n📧 Comptes créés:');
    console.log('Admin: admin@fasomarket.com / admin123');
    console.log('Vendeur: vendeur@fasomarket.com / vendeur123');
    console.log('Client: client@fasomarket.com / client123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

seedData();
