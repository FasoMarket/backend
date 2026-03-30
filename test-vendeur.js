require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function testVendeurLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fasomarket');
    console.log('✅ Connecté à MongoDB');

    const email = 'vendeur@fasomarket.com';
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`❌ Utilisateur ${email} non trouvé`);
      process.exit(1);
    }

    console.log('✅ Utilisateur trouvé:', user.email);
    
    const passwordsToTest = ['vendor123', 'vendeur123', 'password123', 'admin123456'];
    for (const pw of passwordsToTest) {
      const isValid = await user.comparePassword(pw);
      console.log(`- Test mot de passe "${pw}": ${isValid ? 'VALIDE ✅' : 'INVALIDE ❌'}`);
      if (isValid) break;
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testVendeurLogin();
