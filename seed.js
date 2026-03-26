require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./src/models/User');
const Store = require('./src/models/Store');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const Review = require('./src/models/Review');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fasomarket');
    console.log('✅ Connecté à MongoDB');

    // Nettoyer les données existantes
    console.log('🧹 Nettoyage des données...');
    await Promise.all([
      User.deleteMany({}),
      Store.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({})
    ]);

    // 1. Créer l'admin
    console.log('\n📝 Création de l\'admin...');
    const admin = await User.create({
      name: 'Admin FasoMarket',
      email: 'admin@fasomarket.com',
      password: 'admin123456',
      role: 'admin',
      phone: '+226 00 00 00 00',
      isVendorApproved: true
    });
    console.log('✅ Admin créé:', admin.email);

    // 2. Créer les vendeurs
    console.log('\n📝 Création des vendeurs...');
    const vendorsData = [
      { name: 'Koné Électronique', email: 'kone@test.com', password: 'vendor123', category: 'Électronique' },
      { name: 'Traore Bio', email: 'traore@test.com', password: 'vendor123', category: 'Produits Bio' },
      { name: 'Diallo Mode', email: 'diallo@test.com', password: 'vendor123', category: 'Mode' },
      { name: 'Sawadogo Art', email: 'sawadogo@test.com', password: 'vendor123', category: 'Art' }
    ];

    const vendors = await Promise.all(
      vendorsData.map(v => User.create({
        name: v.name,
        email: v.email,
        password: v.password,
        role: 'vendor',
        phone: '+226 70 00 00 00',
        isVendorApproved: true
      }))
    );
    console.log(`✅ ${vendors.length} vendeurs créés`);

    // 3. Créer les boutiques
    console.log('\n📝 Création des boutiques...');
    const stores = await Promise.all(
      vendors.map((vendor, idx) => Store.create({
        name: vendorsData[idx].name,
        owner: vendor._id,
        slug: vendorsData[idx].name.toLowerCase().replace(/\s+/g, '-'),
        description: `Boutique officielle de ${vendorsData[idx].name}`,
        category: vendorsData[idx].category,
        rating: 4.5,
        totalReviews: 0
      }))
    );
    console.log(`✅ ${stores.length} boutiques créées`);

    // 4. Créer les produits
    console.log('\n📝 Création des produits...');
    const productsData = [
      // Koné Électronique
      { name: 'Laptop i7', price: 450000, stock: 8, category: 'Électronique', vendor: 0, store: 0 },
      { name: 'Caméra 4K', price: 380000, stock: 5, category: 'Électronique', vendor: 0, store: 0 },
      { name: 'Power Bank 20000mAh', price: 18000, stock: 40, category: 'Électronique', vendor: 0, store: 0 },
      { name: 'Casque Bluetooth', price: 45000, stock: 25, category: 'Électronique', vendor: 0, store: 0 },
      { name: 'Smartphone 5G', price: 250000, stock: 15, category: 'Électronique', vendor: 0, store: 0 },
      // Traore Bio
      { name: 'Beurre de Karité Bio', price: 12000, stock: 50, category: 'Produits Bio', vendor: 1, store: 1 },
      { name: 'Miel Pur', price: 8000, stock: 30, category: 'Produits Bio', vendor: 1, store: 1 },
      { name: 'Huile d\'Argan', price: 15000, stock: 20, category: 'Produits Bio', vendor: 1, store: 1 },
      { name: 'Savon Naturel', price: 3000, stock: 100, category: 'Produits Bio', vendor: 1, store: 1 },
      { name: 'Thé Bio', price: 5000, stock: 60, category: 'Produits Bio', vendor: 1, store: 1 },
      { name: 'Café Bio', price: 7000, stock: 45, category: 'Produits Bio', vendor: 1, store: 1 },
      // Diallo Mode
      { name: 'Pagne Fasso', price: 25000, stock: 35, category: 'Mode', vendor: 2, store: 2 },
      { name: 'Boubou Traditionnel', price: 45000, stock: 20, category: 'Mode', vendor: 2, store: 2 },
      { name: 'Chaussures Artisanales', price: 35000, stock: 15, category: 'Mode', vendor: 2, store: 2 },
      { name: 'Sac à Main', price: 28000, stock: 25, category: 'Mode', vendor: 2, store: 2 },
      { name: 'Ceinture Cuir', price: 12000, stock: 40, category: 'Mode', vendor: 2, store: 2 },
      // Sawadogo Art
      { name: 'Bronze Art', price: 85000, stock: 8, category: 'Art', vendor: 3, store: 3 },
      { name: 'Sculpture Bois', price: 55000, stock: 12, category: 'Art', vendor: 3, store: 3 },
      { name: 'Tableau Peint', price: 45000, stock: 18, category: 'Art', vendor: 3, store: 3 },
      { name: 'Masque Traditionnel', price: 22000, stock: 30, category: 'Art', vendor: 3, store: 3 },
      { name: 'Poterie Artisanale', price: 15000, stock: 25, category: 'Art', vendor: 3, store: 3 },
      { name: 'Bijoux Artisanaux', price: 18000, stock: 35, category: 'Art', vendor: 3, store: 3 }
    ];

    const products = await Promise.all(
      productsData.map(p => Product.create({
        name: p.name,
        description: `Produit de qualité: ${p.name}`,
        price: p.price,
        stock: p.stock,
        category: p.category,
        vendor: vendors[p.vendor]._id,
        store: stores[p.store]._id,
        images: ['https://via.placeholder.com/400x400?text=' + encodeURIComponent(p.name)],
        rating: { average: 4.5, count: 0 }
      }))
    );
    console.log(`✅ ${products.length} produits créés`);

    // 5. Créer des clients
    console.log('\n📝 Création des clients...');
    const clients = await Promise.all([
      User.create({
        name: 'Client Test 1',
        email: 'client1@test.com',
        password: 'client123',
        role: 'customer',
        phone: '+226 70 11 11 11'
      }),
      User.create({
        name: 'Client Test 2',
        email: 'client2@test.com',
        password: 'client123',
        role: 'customer',
        phone: '+226 70 22 22 22'
      })
    ]);
    console.log(`✅ ${clients.length} clients créés`);

    // 6. Créer des commandes livrées
    console.log('\n📝 Création des commandes...');
    const orders = await Promise.all([
      Order.create({
        user: clients[0]._id,
        items: [
          { product: products[0]._id, store: stores[0]._id, vendor: vendors[0]._id, quantity: 1, price: products[0].price }
        ],
        totalPrice: products[0].price,
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        shippingAddress: {
          fullName: 'Client Test 1',
          phone: '+226 70 11 11 11',
          city: 'Ouagadougou',
          details: 'Test Address'
        }
      }),
      Order.create({
        user: clients[0]._id,
        items: [
          { product: products[5]._id, store: stores[1]._id, vendor: vendors[1]._id, quantity: 2, price: products[5].price }
        ],
        totalPrice: products[5].price * 2,
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        shippingAddress: {
          fullName: 'Client Test 1',
          phone: '+226 70 11 11 11',
          city: 'Ouagadougou',
          details: 'Test Address'
        }
      }),
      Order.create({
        user: clients[1]._id,
        items: [
          { product: products[11]._id, store: stores[2]._id, vendor: vendors[2]._id, quantity: 1, price: products[11].price }
        ],
        totalPrice: products[11].price,
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        shippingAddress: {
          fullName: 'Client Test 2',
          phone: '+226 70 22 22 22',
          city: 'Bobo-Dioulasso',
          details: 'Test Address'
        }
      })
    ]);
    console.log(`✅ ${orders.length} commandes créées`);

    // 7. Créer des avis
    console.log('\n📝 Création des avis...');
    const reviews = await Promise.all([
      Review.create({
        product: products[0]._id,
        vendor: vendors[0]._id,
        customer: clients[0]._id,
        order: orders[0]._id,
        rating: 5,
        comment: 'Excellent produit, très satisfait!',
        isVisible: true
      }),
      Review.create({
        product: products[5]._id,
        vendor: vendors[1]._id,
        customer: clients[0]._id,
        order: orders[1]._id,
        rating: 4,
        comment: 'Bonne qualité, livraison rapide',
        isVisible: true
      }),
      Review.create({
        product: products[11]._id,
        vendor: vendors[2]._id,
        customer: clients[1]._id,
        order: orders[2]._id,
        rating: 5,
        comment: 'Conforme à la description, je recommande',
        isVisible: true
      })
    ]);
    console.log(`✅ ${reviews.length} avis créés`);

    // Mettre à jour les ratings des produits
    await Promise.all(
      reviews.map(review =>
        Product.findByIdAndUpdate(review.product, {
          'rating.average': review.rating,
          'rating.count': 1
        })
      )
    );

    console.log('\n' + '='.repeat(50));
    console.log('✅ SEED COMPLÉTÉ AVEC SUCCÈS!');
    console.log('='.repeat(50));
    console.log('\n📊 Résumé:');
    console.log(`  • 1 Admin: admin@fasomarket.com / admin123456`);
    console.log(`  • ${vendors.length} Vendeurs avec boutiques et produits`);
    console.log(`  • ${products.length} Produits`);
    console.log(`  • ${clients.length} Clients`);
    console.log(`  • ${orders.length} Commandes livrées`);
    console.log(`  • ${reviews.length} Avis`);
    console.log('\n🔗 URLs:');
    console.log(`  • Admin: http://localhost:5174/login`);
    console.log(`  • Web App: http://localhost:5173`);
    console.log(`  • Backend API: http://localhost:5000`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seed();
