require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

async function testWallet() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fasomarket');
    console.log('✅ Connecté à MongoDB');

    // Compter les commandes livrées
    const deliveredCount = await Order.countDocuments({ orderStatus: 'delivered' });
    console.log(`\n📦 Total commandes livrées: ${deliveredCount}`);

    // Trouver les vendeurs uniques avec des commandes livrées
    const vendorIds = await Order.aggregate([
      { $match: { orderStatus: 'delivered' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.vendor' } },
      { $match: { _id: { $ne: null } } },
    ]);

    console.log(`🏪 Vendeurs avec commandes livrées: ${vendorIds.length}`);

    // Afficher les 3 premiers vendeurs
    for (let i = 0; i < Math.min(3, vendorIds.length); i++) {
      const vendorId = vendorIds[i]._id;
      const orders = await Order.find({
        'items.vendor': vendorId,
        orderStatus: 'delivered'
      }).select('_id items');

      let total = 0;
      for (const order of orders) {
        const vendorItems = order.items.filter(item => item.vendor?.toString() === vendorId.toString());
        const orderTotal = vendorItems.reduce((s, item) => s + (item.price * item.quantity), 0);
        total += orderTotal;
      }

      console.log(`\n   Vendeur ${vendorId}:`);
      console.log(`   - Commandes: ${orders.length}`);
      console.log(`   - Total brut: ${total} FCFA`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testWallet();
