const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Test@123'
};

let token = '';
let userId = '';
let productId = '';

async function runTests() {
  try {
    console.log('🧪 Démarrage des tests du panier...\n');

    // 1. Login
    console.log('1️⃣  Connexion...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, testUser);
    token = loginRes.data.data.token;
    userId = loginRes.data.data.user._id;
    console.log(`✅ Connecté: ${loginRes.data.data.user.email}\n`);

    // 2. Get first product
    console.log('2️⃣  Récupération d\'un produit...');
    const productsRes = await axios.get(`${API_URL}/products?limit=1`);
    productId = productsRes.data.data[0]._id;
    console.log(`✅ Produit trouvé: ${productsRes.data.data[0].name} (${productsRes.data.data[0].price} FCFA)\n`);

    // 3. Add to cart
    console.log('3️⃣  Ajout au panier...');
    const addRes = await axios.post(
      `${API_URL}/cart`,
      { productId, quantity: 1 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Produit ajouté au panier`);
    console.log(`   Nombre d'articles: ${addRes.data.data.items.length}`);
    console.log(`   Total: ${addRes.data.data.total} FCFA\n`);

    // 4. Get cart
    console.log('4️⃣  Récupération du panier...');
    const cartRes = await axios.get(
      `${API_URL}/cart`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Panier récupéré`);
    console.log(`   Nombre d'articles: ${cartRes.data.data.items.length}`);
    console.log(`   Total: ${cartRes.data.data.total} FCFA\n`);

    console.log('✅ Tous les tests sont passés !');
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
