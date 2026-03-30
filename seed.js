require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./src/models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fasomarket');
    console.log('✅ Connecté à MongoDB');

    // Nettoyer les données existantes
    console.log('🧹 Nettoyage des données...');
    await User.deleteMany({});

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

    // 2. Créer 2 vendeurs
    console.log('\n📝 Création des vendeurs...');
    const vendor1 = await User.create({
      name: 'Vendeur Un',
      email: 'vendeur1@test.com',
      password: 'vendeur123',
      role: 'vendor',
      phone: '+226 70 11 11 11',
      isVendorApproved: true
    });

    const vendor2 = await User.create({
      name: 'Vendeur Deux',
      email: 'vendor2@test.com',
      password: 'vendeur123',
      role: 'vendor',
      phone: '+226 70 22 22 22',
      isVendorApproved: true
    });
    console.log(`✅ 2 vendeurs créés`);

    // 3. Créer 2 clients
    console.log('\n📝 Création des clients...');
    const client1 = await User.create({
      name: 'Client One',
      email: 'client1@test.com',
      password: 'client123',
      role: 'customer',
      phone: '+226 70 33 33 33'
    });

    const client2 = await User.create({
      name: 'Client Two',
      email: 'client2@test.com',
      password: 'client123',
      role: 'customer',
      phone: '+226 70 44 44 44'
    });
    console.log(`✅ 2 clients créés`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ SEED COMPLÉTÉ AVEC SUCCÈS!');
    console.log('='.repeat(50));
    console.log('\n📊 Résumé:');
    console.log(`  • 1 Admin: admin@fasomarket.com / admin123456`);
    console.log(`  • 2 Vendeurs:`);
    console.log(`    - vendor1@test.com / vendor123`);
    console.log(`    - vendor2@test.com / vendor123`);
    console.log(`  • 2 Clients:`);
    console.log(`    - client1@test.com / client123`);
    console.log(`    - client2@test.com / client123`);
    console.log('\n🔗 URLs:');
    console.log(`  • Admin: http://localhost:5174/login`);
    console.log(`  • Web App: http://localhost:5173`);
    console.log(`  • Backend API: http://localhost:5000`);
    console.log('\n📝 Prochaines étapes:');
    console.log(`  1. Les vendeurs créent leurs boutiques manuellement`);
    console.log(`  2. Les vendeurs créent leurs produits manuellement`);
    console.log(`  3. Les clients font des achats`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seed();
