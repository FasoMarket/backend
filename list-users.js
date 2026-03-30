require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fasomarket');
    console.log('✅ Connecté à MongoDB');

    const users = await User.find({}, 'name email role isVendorApproved');
    console.log(`📊 Total utilisateurs: ${users.length}`);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) [${u.role}] (Approved: ${u.isVendorApproved})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

listUsers();
