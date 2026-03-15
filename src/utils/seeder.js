require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');

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
        description: 'Mangue fraîche et juteuse',
        price: 2000,
        category: 'fruits',
        stock: 50,
        store: store._id
      },
      {
        name: 'Mil local',
        description: 'Mil cultivé localement',
        price: 1500,
        category: 'cereales',
        stock: 100,
        store: store._id
      },
      {
        name: 'Karité naturel',
        description: 'Beurre de karité 100% naturel',
        price: 3500,
        category: 'cosmetiques',
        stock: 30,
        store: store._id
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
