require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
const VendorWallet = require('./src/models/VendorWallet');
const VendorPayout = require('./src/models/VendorPayout');

async function testWallet() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fasomarket');
    console.log('✅ Connecté à MongoDB');

    // Trouver un vendeur avec des commandes livrées
    const vendors = await User.find({ role: 'vendor' }).limit(5);
    console.log(`\n📊 Vendeurs trouvés: ${vendors.length}`);

    for (const vendor of vendors) {
      console.log(`\n🏪 Vendeur: ${vendor.name} (${vendor._id})`);

      // Trouver les commandes livrées du vendeur
      const deliveredOrders = await Order.find({
        'items.vendor': vendor._id,
        orderStatus: 'delivered'
      }).select('_id totalPrice items orderStatus createdAt');

      console.log(`   📦 Commandes livrées: ${deliveredOrders.length}`);

      if (deliveredOrders.length > 0) {
        // Calculer le montant brut
        let totalGross = 0;
        for (const order of deliveredOrders) {
          const vendorItems = order.items.filter(i => i.vendor?.toString() === vendor._id.toString());
          const orderTotal = vendorItems.reduce((s, i) => s + (i.price * i.quantity), 0);
          totalGross += orderTotal;
          console.log(`      - Commande ${order._id}: ${orderTotal} FCFA`);
        }

        console.log(`   💰 Total brut: ${totalGross} FCFA`);

        // Vérifier les paiements déjà traités
        const paidOrderIds = await VendorPayout.find({
          vendor: vendor._id,
          status: { $in: ['paid', 'processing'] }
        }).distinct('orders');

        console.log(`   ✅ Commandes payées: ${paidOrderIds.length}`);

        // Vérifier le wallet
        const wallet = await VendorWallet.findOne({ vendor: vendor._id });
        console.log(`   💳 Wallet: ${wallet ? 'Existe' : 'N\'existe pas'}`);
        if (wallet) {
          console.log(`      - Balance: ${wallet.balance} FCFA`);
          console.log(`      - Pending: ${wallet.pendingBalance} FCFA`);
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testWallet();
