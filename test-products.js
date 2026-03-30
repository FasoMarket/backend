require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function testProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fasomarket');
    console.log('✅ Connecté à MongoDB');

    const count = await Product.countDocuments();
    console.log(`\n📦 Total produits: ${count}`);

    if (count > 0) {
      const products = await Product.find().limit(5).select('name price status vendor');
      console.log('\n📋 Premiers produits:');
      products.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} - ${p.price} FCFA (Status: ${p.status})`);
      });
    } else {
      console.log('\n⚠️  Aucun produit trouvé dans la base de données');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testProducts();
