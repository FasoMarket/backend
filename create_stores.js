const mongoose = require('mongoose');
const User = require('./src/models/User');
const Store = require('./src/models/Store');

async function createStores() {
  await mongoose.connect('mongodb://localhost:27017/fasomarket');
  
  const vendors = await User.find({ role: 'vendor' });
  let created = 0;
  
  for (const vendor of vendors) {
    const existingStore = await Store.findOne({ owner: vendor._id });
    if (!existingStore) {
      await Store.create({
        owner: vendor._id,
        name: `Boutique de ${vendor.name || 'Vendeur'}`,
        description: 'Boutique par défaut générée pour les tests',
        status: 'active',
        categories: ['Général'],
        vendorPhone: vendor.phone || '00000000'
      });
      created++;
    }
  }
  
  console.log(`Created ${created} stores for vendors.`);
  process.exit(0);
}
createStores();
