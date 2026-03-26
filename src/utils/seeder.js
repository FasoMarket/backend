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
    console.log('🗑️  Suppression des données existantes...');
    await User.deleteMany({});
    await Store.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});

    // Créer un admin
    const admin = await User.create({
      name: 'Admin FasoMarket',
      email: 'admin@fasomarket.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✅ Admin créé');

    // Créer 4 vendeurs approuvés avec des spécialités différentes
    const vendorData = [
      {
        name: 'Koné Électronique',
        email: 'kone.electronique@fasomarket.com',
        password: 'vendor123',
        role: 'vendor',
        isVendorApproved: true,
        phone: '+226 70 00 00 01'
      },
      {
        name: 'Traore Produits Bio',
        email: 'traore.bio@fasomarket.com',
        password: 'vendor123',
        role: 'vendor',
        isVendorApproved: true,
        phone: '+226 70 00 00 02'
      },
      {
        name: 'Diallo Mode & Textile',
        email: 'diallo.mode@fasomarket.com',
        password: 'vendor123',
        role: 'vendor',
        isVendorApproved: true,
        phone: '+226 70 00 00 03'
      },
      {
        name: 'Sawadogo Artisanat',
        email: 'sawadogo.artisanat@fasomarket.com',
        password: 'vendor123',
        role: 'vendor',
        isVendorApproved: true,
        phone: '+226 70 00 00 04'
      }
    ];

    const vendors = [];
    for (const data of vendorData) {
      const vendor = await User.create(data);
      vendors.push(vendor);
    }
    console.log('✅ 4 vendeurs créés');

    // Créer un client
    const customer = await User.create({
      name: 'Client Test',
      email: 'client@fasomarket.com',
      password: 'client123',
      role: 'customer'
    });
    console.log('✅ Client créé');

    // Créer 4 boutiques diversifiées
    const stores = await Store.insertMany([
      {
        name: 'Koné Électronique',
        description: 'Vente d\'électronique, téléphones, ordinateurs et accessoires de qualité',
        owner: vendors[0]._id,
        phone: '+226 70 00 00 01',
        address: 'Ouagadougou, Secteur 1'
      },
      {
        name: 'Traore Produits Bio',
        description: 'Produits biologiques locaux: fruits, légumes, miel et produits transformés du Burkina Faso',
        owner: vendors[1]._id,
        phone: '+226 70 00 00 02',
        address: 'Bobo-Dioulasso, Centre-ville'
      },
      {
        name: 'Diallo Mode & Textile',
        description: 'Vêtements traditionnels et modernes, tissus africains authentiques et accessoires de mode',
        owner: vendors[2]._id,
        phone: '+226 70 00 00 03',
        address: 'Ouagadougou, Secteur 3'
      },
      {
        name: 'Sawadogo Artisanat',
        description: 'Artisanat burkinabè: sculptures, paniers, poterie et objets de décoration faits main',
        owner: vendors[3]._id,
        phone: '+226 70 00 00 04',
        address: 'Ouagadougou, Secteur 2'
      }
    ]);
    console.log('✅ 4 boutiques créées');

    // Créer des produits diversifiés pour chaque boutique

    // BOUTIQUE 1: Électronique
    const electronicsProducts = [
      {
        name: 'Smartphone Android 5G',
        description: 'Téléphone intelligent 5G avec écran AMOLED 6.7", processeur dernière génération, batterie 5000mAh',
        price: 250000,
        category: 'Électronique',
        stock: 15,
        store: stores[0]._id,
        vendor: vendors[0]._id,
        brand: 'TechPro'
      },
      {
        name: 'Ordinateur Portable 15"',
        description: 'Laptop performant avec processeur Intel i7, 16GB RAM, SSD 512GB, idéal pour travail et gaming',
        price: 450000,
        category: 'Électronique',
        stock: 8,
        store: stores[0]._id,
        vendor: vendors[0]._id,
        brand: 'CompuTech'
      },
      {
        name: 'Casque Bluetooth Wireless',
        description: 'Casque audio sans fil avec réduction de bruit active, autonomie 30h, son haute qualité',
        price: 45000,
        category: 'Électronique',
        stock: 25,
        store: stores[0]._id,
        vendor: vendors[0]._id,
        brand: 'SoundMax'
      },
      {
        name: 'Batterie Externe 20000mAh',
        description: 'Power bank haute capacité avec charge rapide, 2 ports USB, compatible tous appareils',
        price: 18000,
        category: 'Électronique',
        stock: 40,
        store: stores[0]._id,
        vendor: vendors[0]._id,
        brand: 'PowerBank Pro'
      },
      {
        name: 'Caméra Numérique 4K',
        description: 'Caméra 4K avec stabilisation optique, zoom 30x, écran tactile, parfaite pour vidéographie',
        price: 380000,
        category: 'Électronique',
        stock: 5,
        store: stores[0]._id,
        vendor: vendors[0]._id,
        brand: 'CinemaGear'
      }
    ];

    // BOUTIQUE 2: Produits Bio
    const bioProducts = [
      {
        name: 'Mangue Kent Bio',
        description: 'Mangue fraîche et juteuse de Bobo-Dioulasso, cultivée sans pesticides, qualité export',
        price: 3500,
        category: 'Fruits',
        stock: 80,
        store: stores[1]._id,
        vendor: vendors[1]._id,
        brand: 'Traore Bio'
      },
      {
        name: 'Miel Pur de Forêt',
        description: 'Miel sauvage 100% naturel de la région de la Sissili, riche en nutriments, sans additifs',
        price: 8000,
        category: 'Miel',
        stock: 30,
        store: stores[1]._id,
        vendor: vendors[1]._id,
        brand: 'Traore Bio'
      },
      {
        name: 'Beurre de Karité Bio',
        description: 'Beurre de karité pur et naturel, idéal pour la peau et les cheveux, 200g',
        price: 5500,
        category: 'Produits Transformés',
        stock: 50,
        store: stores[1]._id,
        vendor: vendors[1]._id,
        brand: 'Traore Bio'
      },
      {
        name: 'Mil Local Premium',
        description: 'Mil rouge cultivé localement, riche en fer et minéraux, parfait pour la cuisine traditionnelle',
        price: 2500,
        category: 'Céréales',
        stock: 120,
        store: stores[1]._id,
        vendor: vendors[1]._id,
        brand: 'Traore Bio'
      },
      {
        name: 'Tomates Fraîches',
        description: 'Tomates rouges fraîches cultivées sans pesticides, idéales pour sauce et cuisine',
        price: 1500,
        category: 'Légumes',
        stock: 100,
        store: stores[1]._id,
        vendor: vendors[1]._id,
        brand: 'Traore Bio'
      },
      {
        name: 'Arachides Grillées Bio',
        description: 'Arachides grillées naturelles, sans sel ajouté, riche en protéines, 500g',
        price: 3000,
        category: 'Produits Transformés',
        stock: 60,
        store: stores[1]._id,
        vendor: vendors[1]._id,
        brand: 'Traore Bio'
      }
    ];

    // BOUTIQUE 3: Mode & Textile
    const fashionProducts = [
      {
        name: 'Boubou Traditionnel Homme',
        description: 'Boubou traditionnel burkinabè en coton premium, broderies authentiques, tailles S à XXL',
        price: 35000,
        category: 'Vêtements',
        stock: 20,
        store: stores[2]._id,
        vendor: vendors[2]._id,
        brand: 'Diallo Mode'
      },
      {
        name: 'Pagne Africain Wax',
        description: 'Tissu wax authentique africain, motifs traditionnels, 6 mètres, parfait pour couture',
        price: 12000,
        category: 'Textiles',
        stock: 45,
        store: stores[2]._id,
        vendor: vendors[2]._id,
        brand: 'Diallo Mode'
      },
      {
        name: 'Robe Femme Moderne',
        description: 'Robe élégante fusion style africain-moderne, en coton bio, confortable et chic',
        price: 28000,
        category: 'Vêtements',
        stock: 30,
        store: stores[2]._id,
        vendor: vendors[2]._id,
        brand: 'Diallo Mode'
      },
      {
        name: 'Chapeau Traditionnel',
        description: 'Chapeau traditionnel burkinabè en paille tressée, protection solaire naturelle',
        price: 8500,
        category: 'Accessoires',
        stock: 35,
        store: stores[2]._id,
        vendor: vendors[2]._id,
        brand: 'Diallo Mode'
      },
      {
        name: 'Sac à Main Artisanal',
        description: 'Sac à main tissé à la main, motifs traditionnels, durable et écologique',
        price: 15000,
        category: 'Accessoires',
        stock: 25,
        store: stores[2]._id,
        vendor: vendors[2]._id,
        brand: 'Diallo Mode'
      }
    ];

    // BOUTIQUE 4: Artisanat
    const craftProducts = [
      {
        name: 'Sculpture Bois Masque',
        description: 'Masque traditionnel sculpté à la main en bois dur, authentique artisanat burkinabè',
        price: 22000,
        category: 'Sculptures',
        stock: 12,
        store: stores[3]._id,
        vendor: vendors[3]._id,
        brand: 'Sawadogo Artisanat'
      },
      {
        name: 'Panier Tressé Décoratif',
        description: 'Panier tressé à la main en paille naturelle, idéal pour rangement ou décoration',
        price: 9500,
        category: 'Décoration',
        stock: 40,
        store: stores[3]._id,
        vendor: vendors[3]._id,
        brand: 'Sawadogo Artisanat'
      },
      {
        name: 'Poterie Traditionnelle',
        description: 'Vase en poterie fabriqué à la main selon techniques ancestrales, unique et authentique',
        price: 16000,
        category: 'Poterie',
        stock: 18,
        store: stores[3]._id,
        vendor: vendors[3]._id,
        brand: 'Sawadogo Artisanat'
      },
      {
        name: 'Bijoux Perles Artisanaux',
        description: 'Collier et bracelet en perles traditionnelles, fait main, design unique',
        price: 12500,
        category: 'Bijoux',
        stock: 30,
        store: stores[3]._id,
        vendor: vendors[3]._id,
        brand: 'Sawadogo Artisanat'
      },
      {
        name: 'Tableau Peinture Africaine',
        description: 'Tableau peint à la main représentant scènes de vie africaine, cadre inclus',
        price: 28000,
        category: 'Art',
        stock: 8,
        store: stores[3]._id,
        vendor: vendors[3]._id,
        brand: 'Sawadogo Artisanat'
      },
      {
        name: 'Tambour Traditionnel',
        description: 'Tambour artisanal en bois et peau naturelle, instrument de musique authentique',
        price: 35000,
        category: 'Instruments',
        stock: 6,
        store: stores[3]._id,
        vendor: vendors[3]._id,
        brand: 'Sawadogo Artisanat'
      }
    ];

    // Insérer tous les produits
    const allProducts = [
      ...electronicsProducts,
      ...bioProducts,
      ...fashionProducts,
      ...craftProducts
    ];

    await Product.insertMany(allProducts);
    console.log(`✅ ${allProducts.length} produits créés`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ DONNÉES DE TEST CRÉÉES AVEC SUCCÈS');
    console.log('='.repeat(60));

    console.log('\n📧 COMPTES CRÉÉS:\n');
    console.log('👨‍💼 ADMIN:');
    console.log('   Email: admin@fasomarket.com');
    console.log('   Mot de passe: admin123\n');

    console.log('🏪 VENDEURS (4):\n');
    console.log('1️⃣  Koné Électronique');
    console.log('   Email: kone.electronique@fasomarket.com');
    console.log('   Mot de passe: vendor123');
    console.log('   Produits: Électronique (5)\n');

    console.log('2️⃣  Traore Produits Bio');
    console.log('   Email: traore.bio@fasomarket.com');
    console.log('   Mot de passe: vendor123');
    console.log('   Produits: Fruits, Miel, Légumes (6)\n');

    console.log('3️⃣  Diallo Mode & Textile');
    console.log('   Email: diallo.mode@fasomarket.com');
    console.log('   Mot de passe: vendor123');
    console.log('   Produits: Vêtements, Accessoires (5)\n');

    console.log('4️⃣  Sawadogo Artisanat');
    console.log('   Email: sawadogo.artisanat@fasomarket.com');
    console.log('   Mot de passe: vendor123');
    console.log('   Produits: Sculptures, Poterie, Art (6)\n');

    console.log('👤 CLIENT:');
    console.log('   Email: client@fasomarket.com');
    console.log('   Mot de passe: client123\n');

    console.log('📊 RÉSUMÉ:');
    console.log('   • 1 Admin');
    console.log('   • 4 Vendeurs approuvés');
    console.log('   • 4 Boutiques diversifiées');
    console.log('   • 21 Produits variés');
    console.log('   • 1 Client de test\n');

    console.log('🎯 CATÉGORIES DE PRODUITS:');
    console.log('   • Électronique (5 produits)');
    console.log('   • Produits Bio (6 produits)');
    console.log('   • Mode & Textile (5 produits)');
    console.log('   • Artisanat (6 produits)\n');

    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedData();
