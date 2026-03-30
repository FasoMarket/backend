require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fasomarket');
    console.log('✅ Connecté à MongoDB');

    // Chercher un utilisateur
    const user = await User.findOne({ email: 'vendor1@test.com' }).select('+password');
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      process.exit(1);
    }

    console.log('✅ Utilisateur trouvé:', user.email);
    console.log('   Mot de passe hashé:', user.password.substring(0, 20) + '...');

    // Tester la comparaison de mot de passe
    const isValid = await user.comparePassword('vendor123');
    console.log('✅ Comparaison mot de passe:', isValid ? 'VALIDE' : 'INVALIDE');

    if (!isValid) {
      console.log('❌ Le mot de passe ne correspond pas!');
      console.log('   Essaie avec le mot de passe: vendor123');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testLogin();
